import React, { useRef } from 'react';
import { Upload, Film, FolderOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  onFilesSelected: (files: FileList) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-gray-700 rounded-3xl bg-gray-900/50 hover:bg-gray-900/80 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/*"
        multiple
      />
      
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full"></div>
        <div className="relative p-6 bg-gray-800 rounded-2xl shadow-xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-12 h-12 text-indigo-400" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-3 text-center">قم برفع مقاطع الفيديو</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">
        اسحب وأفلت الملفات هنا، أو اضغط لفتح مستعرض الملفات.
        <br/>
        <span className="text-sm text-gray-500 mt-2 block">ندعم صيغ MP4, WebM, Ogg</span>
      </p>

      <div className="flex gap-4">
        <Button variant="primary" icon={<FolderOpen />}>
          اختيار ملفات
        </Button>
      </div>
    </div>
  );
};