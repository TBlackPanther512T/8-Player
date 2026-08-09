import React, { useEffect, useRef, useState } from 'react';
import { VideoFile } from '../types';
import { 
  Repeat, RefreshCcw, StopCircle, Flag, Gauge, Play, Pause, Camera, 
  Volume2, VolumeX, Maximize, Minimize, Settings, Activity, Save, Trash2, PlayCircle
} from 'lucide-react';

interface VideoPlayerProps {
  video: VideoFile;
  onEnded: () => void;
  autoPlay?: boolean;
}

interface SavedLoop {
  id: string;
  start: number;
  end: number;
  name: string;
}

const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onEnded, autoPlay = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Advanced State
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  
  // A-B Loop State
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isABLoopActive, setIsABLoopActive] = useState(false);
  const [savedLoops, setSavedLoops] = useState<SavedLoop[]>([]);
  
  // Metadata State
  const [resolution, setResolution] = useState<string>("");
  const [videoStats, setVideoStats] = useState<{dropped: number, total: number}>({ dropped: 0, total: 0 });

  // Control visibility timer
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset states when video changes
    setLoopA(null);
    setLoopB(null);
    setIsABLoopActive(false);
    setSavedLoops([]); // Clear saved loops for new video
    setCurrentTime(0);
    setDuration(0);
    setResolution("");
    setPlaybackRate(1);
    setVideoStats({ dropped: 0, total: 0 });

    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.volume = volume;
      if (autoPlay) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [video, autoPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Update Stats (Dropped Frames)
    if (videoRef.current.getVideoPlaybackQuality) {
      const quality = videoRef.current.getVideoPlaybackQuality();
      setVideoStats({
        dropped: quality.droppedVideoFrames,
        total: quality.totalVideoFrames
      });
    }

    // A-B Loop Logic
    if (isABLoopActive && loopA !== null && loopB !== null) {
      // Add a small buffer (0.1s) to ensure smoother looping slightly before the exact end if needed
      if (time >= loopB) {
        videoRef.current.currentTime = loopA;
        if (videoRef.current.paused) {
            videoRef.current.play();
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setResolution(`${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowControls(true);
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      
      // If seeking outside the loop, disable loop temporarily or logic will force it back
      if (isABLoopActive && loopA !== null && loopB !== null) {
        if (time < loopA || time > loopB) {
            // Optional: Auto-disable loop if user manually seeks outside
            // setIsABLoopActive(false); 
        }
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error(err);
      }
    } else {
      await document.exitFullscreen();
    }
  };

  // --- Loop Functions ---

  const setPointA = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setLoopA(time);
      if (loopB !== null && time >= loopB) {
        setLoopB(null);
        setIsABLoopActive(false);
      }
    }
  };

  const setPointB = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (loopA !== null && time > loopA) {
        setLoopB(time);
        setIsABLoopActive(true);
        videoRef.current.currentTime = loopA;
        videoRef.current.play();
      }
    }
  };

  const clearABLoop = () => {
    setLoopA(null);
    setLoopB(null);
    setIsABLoopActive(false);
  };

  const toggleStandardLoop = () => {
    setIsLooping(!isLooping);
  };

  // --- Multi-Scene Loop Functions ---

  const saveCurrentLoop = () => {
    if (loopA !== null && loopB !== null) {
        const newLoop: SavedLoop = {
            id: crypto.randomUUID(),
            start: loopA,
            end: loopB,
            name: `مشهد ${savedLoops.length + 1}`
        };
        setSavedLoops([...savedLoops, newLoop]);
    }
  };

  const activateSavedLoop = (loop: SavedLoop) => {
      setLoopA(loop.start);
      setLoopB(loop.end);
      setIsABLoopActive(true);
      if (videoRef.current) {
          videoRef.current.currentTime = loop.start;
          videoRef.current.play();
      }
  };

  const deleteSavedLoop = (id: string) => {
      setSavedLoops(savedLoops.filter(l => l.id !== id));
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `snapshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Video Container with Custom Controls */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={video.url}
          onEnded={() => {
            if (!isLooping && !isABLoopActive) onEnded();
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          loop={isLooping}
          // Default controls hidden
        />
        
        {/* Overlays */}
        {isABLoopActive && (
          <div className="absolute top-4 left-4 bg-indigo-600/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-2 animate-pulse pointer-events-none z-20">
            <RefreshCcw className="w-3 h-3" />
            تكرار {formatTime(loopA || 0)} - {formatTime(loopB || 0)}
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-10">
            <div className="bg-black/50 p-6 rounded-full backdrop-blur-sm shadow-2xl ring-1 ring-white/20">
              <Play className="w-12 h-12 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Custom Control Bar Overlay */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-2 px-4 transition-opacity duration-300 z-30 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-2 group/progress">
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform group-hover/progress:[&::-webkit-slider-thumb]:scale-125"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Right Side: Play, Volume, Time */}
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-indigo-400">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range" 
                  min={0} 
                  max={1} 
                  step={0.05} 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              <div className="text-xs font-mono text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1 text-gray-500">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Left Side: Tools */}
            <div className="flex items-center gap-2">
              <button onClick={captureFrame} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg" title="التقاط صورة">
                <Camera className="w-4 h-4" />
              </button>
              
              <button onClick={toggleStandardLoop} className={`p-2 rounded-lg transition-colors ${isLooping ? 'text-indigo-400 bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`} title="تكرار الفيديو بالكامل">
                <Repeat className="w-4 h-4" />
              </button>
              
              <button onClick={toggleFullscreen} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg" title="ملء الشاشة">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Tools Panel (Outside fullscreen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Speed Controls */}
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex items-center gap-2">
          <div className="px-2 flex items-center gap-1 text-gray-500 border-l border-gray-700 ml-2" title="سرعة التشغيل">
             <Gauge className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap gap-1">
            {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                <button 
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all min-w-[3rem] ${
                    playbackRate === rate 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                >
                {rate}x
                </button>
            ))}
           </div>
        </div>

        {/* A-B Loop Controls */}
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 pl-2 font-bold flex items-center gap-1 border-l border-gray-700 ml-2">
            <RefreshCcw className="w-3 h-3" />
            تكرار مشهد
          </span>
          
          <button 
            onClick={setPointA}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              loopA !== null ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Flag className="w-3 h-3" />
            {loopA !== null ? `A: ${formatTime(loopA)}` : 'حدد A'}
          </button>

          <button 
            onClick={setPointB}
            disabled={loopA === null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              loopB !== null ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            <Flag className="w-3 h-3" />
            {loopB !== null ? `B: ${formatTime(loopB)}` : 'حدد B'}
          </button>

          {loopA !== null && loopB !== null && (
            <>
                <button 
                onClick={saveCurrentLoop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 transition-all"
                title="حفظ المشهد الحالي"
                >
                <Save className="w-3 h-3" />
                حفظ
                </button>
                
                <button 
                onClick={clearABLoop}
                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                title="إلغاء التكرار"
                >
                <StopCircle className="w-4 h-4" />
                </button>
            </>
          )}
        </div>
      </div>

      {/* Saved Loops List (If any) */}
      {savedLoops.length > 0 && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
             <div className="bg-gray-900/80 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                 <ListVideo className="w-4 h-4 text-indigo-400" />
                 <h4 className="text-sm font-bold text-gray-300">المشاهد المحفوظة لهذا الفيديو</h4>
             </div>
             <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                 {savedLoops.map(loop => {
                     const isActive = isABLoopActive && loopA === loop.start && loopB === loop.end;
                     return (
                         <div 
                            key={loop.id}
                            onClick={() => activateSavedLoop(loop)}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                isActive 
                                ? 'bg-indigo-900/30 border-indigo-500/50 ring-1 ring-indigo-500/20' 
                                : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                            }`}
                         >
                            <div className="flex items-center gap-3">
                                <PlayCircle className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                                <div>
                                    <div className={`text-sm font-medium ${isActive ? 'text-indigo-300' : 'text-gray-300'}`}>
                                        {loop.name}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {formatTime(loop.start)} - {formatTime(loop.end)}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSavedLoop(loop.id);
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                     );
                 })}
             </div>
          </div>
      )}

      {/* Technical Details Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
           <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
             <Activity className="w-3 h-3" /> جودة التشغيل
           </div>
           <div className="text-gray-200 font-mono text-sm">
             {videoStats.total > 0 
               ? `Drops: ${videoStats.dropped} / ${videoStats.total}` 
               : 'Excellent'}
           </div>
        </div>
        <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
           <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
             <Settings className="w-3 h-3" /> الدقة والنوع
           </div>
           <div className="text-gray-200 font-mono text-sm">{resolution || '--'}</div>
        </div>
        <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
           <div className="text-gray-500 text-xs mb-1">معلومات الملف</div>
           <div className="text-gray-200 font-mono text-sm truncate" title={video.type}>
             {video.type.replace('video/', '').toUpperCase() || 'MKV/MP4'} 
           </div>
        </div>
        <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
           <div className="text-gray-500 text-xs mb-1">الحجم الإجمالي</div>
           <div className="text-gray-200 font-mono text-sm">{video.size}</div>
        </div>
      </div>
    </div>
  );
};

// Helper component for List Icon
const ListVideo: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 13h-6" /><path d="M16 6h-6" /><path d="M16 18h-6" /><path d="M4 6h2" /><path d="M4 13h2" /><path d="M4 18h2" />
        <rect width="6" height="18" x="14" y="4" rx="2" stroke="none" /> {/* Adjusted to not clash with lucide import style but kept inline for simplicity if lucide version misses it */}
        <path d="M21 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity="0" />
    </svg>
);
