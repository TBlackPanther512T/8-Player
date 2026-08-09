export interface VideoFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: string;
  type: string;
}

export interface PlayerState {
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}
