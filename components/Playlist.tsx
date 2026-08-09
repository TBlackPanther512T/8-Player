import React from 'react';
import { VideoFile } from '../types';
import { Play, Trash2, Film, ListVideo } from 'lucide-react';

interface PlaylistProps {
  videos: VideoFile[];
  currentVideoId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ videos, currentVideoId, onSelect, onRemove }) => {
  if (videos.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ListVideo className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white">قائمة التشغيل</h3>
        </div>
        <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-400">
          {videos.length} مقاطع
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {videos.map((video) => {
          const isPlaying = video.id === currentVideoId;
          return (
            <div 
              key={video.id}
              onClick={() => onSelect(video.id)}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                isPlaying 
                  ? 'bg-indigo-900/20 border-indigo-500/30' 
                  : 'bg-gray-800/40 border-transparent hover:bg-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Thumbnail Placeholder */}
              <div className={`w-12 h-12 shrink-0 rounded-md flex items-center justify-center transition-colors ${
                isPlaying ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
              }`}>
                {isPlaying ? <Play className="w-5 h-5 fill-current" /> : <Film className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate text-sm mb-1 ${
                  isPlaying ? 'text-indigo-300' : 'text-gray-200'
                }`}>
                  {video.name}
                </p>
                <p className="text-xs text-gray-500 truncate font-mono">
                  {video.size}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(video.id);
                }}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};