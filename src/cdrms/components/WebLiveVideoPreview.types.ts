export type WebLiveVideoHandle = {
  startRecording: () => void;
  stopRecording: () => Promise<{ uri: string; mimeType: string }>;
  abort: () => void;
};

export type WebLiveVideoPreviewProps = {
  facing: 'front' | 'back';
  onReady?: () => void;
  onError?: (message: string) => void;
};
