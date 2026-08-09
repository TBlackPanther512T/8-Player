import React, { useState, useEffect } from 'react';
import { VideoFile } from './types';
import { EmptyState } from './components/EmptyState';
import { VideoPlayer } from './components/VideoPlayer';
import { Playlist } from './components/Playlist';
import { Video, Plus } from 'lucide-react';
import { Button } from './components/Button';

// Utility to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Handle file selection
  const handleFilesSelected = (files: FileList) => {
    const newVideos: VideoFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file: file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    }));

    setVideos((prev) => [...prev, ...newVideos]);
    
    // Auto-play first video if none playing
    if (!currentVideoId && newVideos.length > 0) {
      setCurrentVideoId(newVideos[0].id);
    }
  };

  // Cleanup URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      videos.forEach(video => URL.revokeObjectURL(video.url));
    };
  }, []);

  const handleVideoEnded = () => {
    // Logic handled inside VideoPlayer now for looping
    // If not looping, proceed to next
    const currentIndex = videos.findIndex(v => v.id === currentVideoId);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      setCurrentVideoId(videos[currentIndex + 1].id);
    }
  };

  const handleRemoveVideo = (id: string) => {
    setVideos(prev => {
      const videoToRemove = prev.find(v => v.id === id);
      if (videoToRemove) {
        URL.revokeObjectURL(videoToRemove.url);
      }
      return prev.filter(v => v.id !== id);
    });

    if (currentVideoId === id) {
      setCurrentVideoId(null);
    }
  };

  const currentVideo = videos.find(v => v.id === currentVideoId);

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/40 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight">مشغل المحترفين</h1>
              <p className="text-xs text-gray-500 mt-1">تشغيل محلي | تحكم كامل</p>
            </div>
          </div>
          
          {videos.length > 0 && (
            <div className="relative overflow-hidden rounded-lg">
               <input 
                  type="file" 
                  id="header-upload"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  accept="video/*"
                  multiple
                />
              <Button 
                variant="secondary" 
                className="text-sm" 
                icon={<Plus className="w-4 h-4" />}
                onClick={() => document.getElementById('header-upload')?.click()}
              >
                إضافة ملفات
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {videos.length === 0 ? (
          <EmptyState onFilesSelected={handleFilesSelected} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            
            {/* Player Section */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {currentVideo ? (
                <div className="flex-1 flex flex-col bg-gray-900/30 rounded-2xl p-4 border border-gray-800/50">
                  <VideoPlayer 
                    video={currentVideo} 
                    onEnded={handleVideoEnded} 
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-900/30 rounded-2xl border border-gray-800/50 border-dashed">
                  <div className="text-center text-gray-500">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">اختر مقطعاً للبدء</p>
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Section */}
            <div className="lg:col-span-1 h-full overflow-hidden">
               <Playlist 
                 videos={videos}
                 currentVideoId={currentVideoId}
                 onSelect={setCurrentVideoId}
                 onRemove={handleRemoveVideo}
               />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {videos.length === 0 && (
         <footer className="py-6 text-center text-gray-600 text-sm">
           <p>مشغل فيديو محلي. لا يتم رفع أي بيانات إلى السحابة.</p>
         </footer>
      )}
    </div>
  );
}