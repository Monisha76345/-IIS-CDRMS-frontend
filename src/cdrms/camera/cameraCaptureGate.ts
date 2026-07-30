import type { MediaAsset } from '@/src/cdrms/project/types';

export type CameraCaptureMode = 'photo' | 'video';
export type CameraFacing = 'front' | 'back';

export type CameraCaptureRequest = {
  mode: CameraCaptureMode;
  facing: CameraFacing;
  title: string;
  maxDurationSec?: number;
  resolve: (asset: MediaAsset | null) => void;
};

type Listener = () => void;

let pending: CameraCaptureRequest | null = null;
const listeners = new Set<Listener>();

/** True after native reports video record is unsupported (iOS Simulator). */
let simulatorVideoBlocked = false;

export function isSimulatorVideoBlocked() {
  return simulatorVideoBlocked;
}

export function markSimulatorVideoBlocked() {
  simulatorVideoBlocked = true;
}

export function getPendingCameraCapture(): CameraCaptureRequest | null {
  return pending;
}

export function subscribeCameraCapture(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function openDeviceCamera(options: {
  mode: CameraCaptureMode;
  facing?: CameraFacing;
  title?: string;
  maxDurationSec?: number;
}): Promise<MediaAsset | null> {
  if (pending) {
    pending.resolve(null);
    pending = null;
  }

  return new Promise((resolve) => {
    pending = {
      mode: options.mode,
      facing: options.facing ?? (options.mode === 'photo' ? 'front' : 'back'),
      title:
        options.title ??
        (options.mode === 'video' ? 'Record inspection video' : 'Take photo'),
      maxDurationSec: options.maxDurationSec ?? 120,
      resolve: (asset) => {
        pending = null;
        notify();
        resolve(asset);
      },
    };
    notify();
  });
}

export function closeDeviceCamera(result: MediaAsset | null = null) {
  if (!pending) return;
  const { resolve } = pending;
  pending = null;
  notify();
  resolve(result);
}
