import { Platform } from 'react-native';

import { isSimulatorVideoBlocked } from '@/src/cdrms/camera/cameraCaptureGate';

function isAndroidEmulator() {
  if (Platform.OS !== 'android') return false;
  const c = Platform.constants as {
    Brand?: string;
    Model?: string;
    Fingerprint?: string;
  };
  return /sdk|emulator|gphone|generic/i.test(
    `${c.Brand ?? ''} ${c.Model ?? ''} ${c.Fingerprint ?? ''}`
  );
}

/** Android emulator — no usable camera hardware. */
export function isAndroidVirtual(): boolean {
  return isAndroidEmulator();
}

/**
 * Live *video recording* is blocked on iOS Simulator by Apple
 * ("This operation is not supported on the simulator").
 * Still photos may work if Simulator I/O → Camera points at the MacBook camera.
 *
 * Does NOT import expo-device (native module may be unlinked → crash).
 */
export function isLiveVideoBlocked(): boolean {
  if (isSimulatorVideoBlocked()) return true;
  // iOS + Metro/dev: assume Simulator for video (record is unsupported there).
  // Real-device production builds still get live record via ImagePicker/CameraView
  // when this returns false — flip by clearing the module flag after a successful record
  // is not needed; physical devices typically aren't __DEV__ long-term, but if testing
  // a real phone with Metro, video will open Gallery unless you wire a real-device build.
  if (Platform.OS === 'ios' && __DEV__) return true;
  return false;
}

export function isVirtualDevice(): boolean {
  return isAndroidVirtual() || isLiveVideoBlocked();
}

export const MAC_CAMERA_HINT =
  'On Simulator: open the Simulator menu → I/O → Camera → choose your MacBook camera (or Continuity Camera). Then try selfie again.';

export const VIRTUAL_CAMERA_MESSAGE =
  'Live video recording cannot run on the iOS Simulator (Apple block). Use Gallery/Files for video. For selfie photos, set Simulator I/O → Camera → your MacBook camera first.';
