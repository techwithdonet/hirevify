// Supabase Edge Function for auto-deleting expired introduction videos
// Deploy with: supabase functions deploy cleanup-expired-videos
// Set as a cron job to run daily via Supabase Dashboard

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CandidateProfile {
  id: string
  user_id: string
  intro_video_url: string | null
  video_expires_at: string | null
  full_name: string | null
}

Deno.serve(async (req) => {
  // Verify cron secret for security
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_functions_invite_secret')}`) {
    // Allow cron triggers from Supabase (they don't have custom headers)
    if (req.headers.get('x-supabase-auth') !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      // Check if it's a cron request (Supabase sends this header)
      if (!req.headers.get('x-cron-trigger')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date().toISOString()

    // Find videos that have expired
    const { data: expiredVideos, error: fetchError } = await supabase
      .from('candidate_profiles')
      .select('id, user_id, intro_video_url, video_expires_at, full_name')
      .not('intro_video_url', 'is', null)
      .not('video_expires_at', 'is', null)
      .lt('video_expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired videos:', fetchError)
      throw fetchError
    }

    const videosToCleanup = expiredVideos as CandidateProfile[] | null

    if (!videosToCleanup || videosToCleanup.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired videos found',
          deletedCount: 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete from storage
    const deletedStoragePaths: string[] = []
    const failedDeletions: string[] = []

    for (const video of videosToCleanup) {
      if (video.intro_video_url) {
        try {
          // Extract the storage path from the URL
          const urlParts = video.intro_video_url.split('/')
          const bucketAndPath = urlParts.slice(urlParts.indexOf('intro-videos') + 1).join('/')
          
          if (bucketAndPath) {
            const { error: storageError } = await supabase.storage
              .from('intro-videos')
              .remove([bucketAndPath])

            if (storageError) {
              console.error(`Failed to delete storage file: ${bucketAndPath}`, storageError)
              failedDeletions.push(video.intro_video_url)
            } else {
              deletedStoragePaths.push(bucketAndPath)
            }
          }
        } catch (err) {
          console.error(`Error processing video for ${video.user_id}:`, err)
          failedDeletions.push(video.intro_video_url)
        }
      }
    }

    // Clear the database records for successfully deleted videos
    const successfulUrls = deletedStoragePaths.map(path => {
      // Reconstruct full URL for comparison
      return `${SUPABASE_URL}/storage/v1/object/public/intro-videos/${path}`
    })

    if (successfulUrls.length > 0) {
      // Clear video fields in candidate_profiles
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          intro_video_url: null,
          intro_video_comment: null,
          video_uploaded_at: null,
          video_expires_at: null
        })
        .in('intro_video_url', successfulUrls)

      if (updateError) {
        console.error('Error clearing video records:', updateError)
      }

      // Log cleanup activity
      console.log(`Cleaned up ${successfulUrls.length} expired videos`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed`,
        deletedCount: successfulUrls.length,
        deletedPaths: deletedStoragePaths,
        failedCount: failedDeletions.length,
        failedUrls: failedDeletions
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
