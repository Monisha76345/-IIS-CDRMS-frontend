/** Browser live video — expo-camera's `recordAsync` is native-only. */

export function pickWebRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

async function attachStream(
  videoEl: HTMLVideoElement,
  stream: MediaStream,
): Promise<MediaStream> {
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.setAttribute('playsinline', 'true');
  videoEl.setAttribute('webkit-playsinline', 'true');
  await videoEl.play().catch(() => undefined);
  return stream;
}

export async function startWebCameraStream(
  videoEl: HTMLVideoElement,
  facing: 'front' | 'back',
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera recording is not available in this browser.');
  }

  const facingMode = facing === 'front' ? 'user' : 'environment';
  const videoIdeal = {
    facingMode: { ideal: facingMode },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  } as const;

  try {
    return await attachStream(
      videoEl,
      await navigator.mediaDevices.getUserMedia({ audio: true, video: videoIdeal }),
    );
  } catch {
    try {
      return await attachStream(
        videoEl,
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }),
      );
    } catch {
      return await attachStream(
        videoEl,
        await navigator.mediaDevices.getUserMedia({ audio: false, video: true }),
      );
    }
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  });
}

export function startWebMediaRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  chunks: Blob[];
} {
  const mime = pickWebRecorderMime();
  const recorder = mime
    ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_500_000 })
    : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };
  recorder.start(250);
  return { recorder, chunks };
}

export function stopWebMediaRecorder(
  recorder: MediaRecorder,
  chunks: Blob[],
): Promise<{ uri: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      const mimeType = recorder.mimeType || chunks[0]?.type || 'video/webm';
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 64) {
        reject(new Error('Recording did not produce a file. Tap Record and try again.'));
        return;
      }
      resolve({ uri: URL.createObjectURL(blob), mimeType });
    };

    if (recorder.state === 'inactive') {
      finish();
      return;
    }

    recorder.onerror = () => {
      reject(new Error('Video recording failed. Tap Record and try again.'));
    };
    recorder.onstop = finish;
    try {
      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {
          /* some browsers throw if requestData is unsupported */
        }
      }
      recorder.stop();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Could not stop recording'));
    }
  });
}
