'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Video, Play, Download, ExternalLink, X, MessageSquare } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl: string | null;
  comment?: string;
  candidateName?: string;
  onPreview?: () => void;
  onDownload?: () => void;
}

export function VideoPreview({ videoUrl, comment, candidateName, onPreview, onDownload }: VideoPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!videoUrl) {
    return null;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
    onPreview?.();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidateName || 'candidate'}-intro-video.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      onDownload?.();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      {/* Video Indicator Badge */}
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <Video className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-900">Introduction Video</p>
          <p className="text-xs text-emerald-700 truncate">
            {candidateName ? `${candidateName} recorded an intro video` : 'Candidate intro video available'}
          </p>
        </div>
        <Button 
          onClick={handleOpenModal}
          size="sm" 
          className="premium-btn-accent shrink-0"
        >
          <Play className="w-4 h-4 mr-1" />
          Watch
        </Button>
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Video className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Introduction Video</h3>
                  {candidateName && (
                    <p className="text-sm text-slate-500">{candidateName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="bg-black">
              <video 
                src={videoUrl}
                controls 
                autoPlay
                className="w-full max-h-[500px] object-contain"
              />
            </div>

            {/* Comment */}
            {comment && (
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                  <MessageSquare className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Candidate's Note</p>
                    <p className="mt-1 text-sm text-slate-600">{comment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <Button 
                onClick={handleDownload}
                variant="outline"
                className="premium-btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
              <Button 
                onClick={() => setIsModalOpen(false)}
                className="premium-btn-accent"
              >
                Close
              </Button>
            </div>

            {/* Expiry Notice */}
            <div className="bg-amber-50 border-t border-amber-100 px-6 py-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Introduction videos are stored for 14 days for privacy. Download to keep a permanent copy.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Compact inline video player for candidate cards
export function CompactVideoPreview({ videoUrl, comment }: { videoUrl: string | null; comment?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoUrl) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsPlaying(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
      >
        <Play className="h-4 w-4 fill-current" />
      </button>
      <span className="text-xs text-slate-500">Intro video</span>

      {isPlaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsPlaying(false)}>
          <div className="relative w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
            <video 
              src={videoUrl}
              controls 
              autoPlay
              className="w-full rounded-xl"
            />
            {comment && (
              <p className="mt-2 text-sm text-white/80 bg-black/50 rounded-lg p-2">
                {comment}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
