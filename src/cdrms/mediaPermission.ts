import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

function openAppSettings() {
  void Linking.openSettings().catch(() => undefined);
}

function showSettingsAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: openAppSettings },
  ]);
}

/** True when device camera access is already allowed. */
export async function hasCameraPermission(): Promise<boolean> {
  try {
    const cam = await Camera.getCameraPermissionsAsync();
    if (cam.granted) return true;
    const picker = await ImagePicker.getCameraPermissionsAsync();
    return picker.granted || picker.status === 'granted';
  } catch {
    return false;
  }
}

/** True when microphone access is already allowed (needed for video with audio). */
export async function hasMicrophonePermission(): Promise<boolean> {
  try {
    const mic = await Camera.getMicrophonePermissionsAsync();
    return mic.granted;
  } catch {
    return false;
  }
}

/**
 * Request camera access for selfies and site photos.
 * Also asks ImagePicker camera permission (used as fallback on some devices).
 */
export async function ensureCameraPermission(silent = false): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return true;

    const current = await Camera.getCameraPermissionsAsync();
    if (current.granted) {
      await ImagePicker.requestCameraPermissionsAsync().catch(() => undefined);
      return true;
    }

    const requested = await Camera.requestCameraPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync().catch(() => undefined);

    if (requested.granted) return true;

    if (!silent) {
      showSettingsAlert(
        'Camera permission needed',
        Platform.OS === 'android'
          ? 'Allow Camera for CDRMS in Settings so you can take selfies and site photos.'
          : 'Allow Camera access in Settings → CDRMS so you can take selfies and site photos.'
      );
    }
    return false;
  } catch {
    if (!silent) {
      Alert.alert('Camera error', 'Could not request camera permission.');
    }
    return false;
  }
}

/** Request microphone access for inspection video recording with audio. */
export async function ensureMicrophonePermission(
  silent = false
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return true;

    const current = await Camera.getMicrophonePermissionsAsync();
    if (current.granted) return true;

    const requested = await Camera.requestMicrophonePermissionsAsync();
    if (requested.granted) return true;

    if (!silent) {
      showSettingsAlert(
        'Microphone permission needed',
        Platform.OS === 'android'
          ? 'Allow Microphone for CDRMS in Settings so inspection videos can record audio.'
          : 'Allow Microphone access in Settings → CDRMS so inspection videos can record audio.'
      );
    }
    return false;
  } catch {
    if (!silent) {
      Alert.alert('Microphone error', 'Could not request microphone permission.');
    }
    return false;
  }
}

/**
 * Request camera (and mic when recording video) before opening the capture UI.
 * Returns false if camera is blocked — caller should not open the camera modal.
 */
export async function ensureMediaCapturePermissions(
  mode: 'photo' | 'video',
  silent = false
): Promise<boolean> {
  const cameraOk = await ensureCameraPermission(silent);
  if (!cameraOk) return false;
  if (mode === 'video') {
    // Mic is preferred for video-with-audio; still allow camera if mic denied
    // so silent recording can proceed after the user is warned.
    await ensureMicrophonePermission(silent);
  }
  return true;
}
