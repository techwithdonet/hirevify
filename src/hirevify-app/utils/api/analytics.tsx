import { projectId } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface RecruiterAnalytics {
  totalProjects: number
  activeProjects: number
  totalApplications: number
  avgMatchScore: number
  timeToHire: number
  costPerHire: number
  hiringFunnel: Record<string, number>
  conversionRate: number
}

export interface CandidateAnalytics {
  totalApplications: number
  profileViews: number
  responseRate: number
  avgMatchScore: number
  applicationStatus: Record<string, number>
  successRate: number
}

export class AnalyticsAPI {
  static async getUserAnalytics(userId: string, accessToken: string): Promise<RecruiterAnalytics | CandidateAnalytics> {
    const response = await fetch(`${API_BASE}/analytics/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch analytics')
    }

    return result
  }

  static async getPlatformAnalytics(accessToken: string): Promise<{
    totalUsers: number
    totalRecruiters: number
    totalCandidates: number
    totalProjects: number
    activeProjects: number
    totalApplications: number
    successRate: number
    avgMatchScore: number
  }> {
    const response = await fetch(`${API_BASE}/analytics/platform/overview`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch platform analytics')
    }

    return result
  }
}




