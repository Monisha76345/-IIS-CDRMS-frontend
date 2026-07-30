import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

import { openDeviceCamera } from '@/src/cdrms/camera/cameraCaptureGate';
import {
  isAndroidVirtual,
  isLiveVideoBlocked,
  MAC_CAMERA_HINT,
  VIRTUAL_CAMERA_MESSAGE,
} from '@/src/cdrms/device/isVirtualDevice';
import type { MediaAsset } from '@/src/cdrms/project/types';

function toAsset(
  asset: ImagePicker.ImagePickerAsset,
  type: 'image' | 'video'
): MediaAsset {
  const durationMs =
    typeof asset.duration === 'number' && asset.duration > 0
      ? asset.duration < 1000
        ? Math.round(asset.duration * 1000)
        : Math.round(asset.duration)
      : null;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: asset.uri,
    type,
    width: asset.width,
    height: asset.height,
    durationMs,
    createdAt: Date.now(),
  };
}

function permissionOk(status: ImagePicker.PermissionStatus | string): boolean {
  return status === 'granted' || status === 'limited';
}

function showPermissionAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => void Linking.openSettings() },
  ]);
}

async function ensureLibraryPermission() {
  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permissionOk(current.status)) return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionOk(status)) return true;
    if (Platform.OS === 'ios') return true;
    showPermissionAlert(
      'Photos needed',
      'Allow photo library access in Settings so CDRMS can pick site images or video.'
    );
    return false;
  } catch {
    if (Platform.OS === 'ios') return true;
    Alert.alert('Photos error', 'Could not request photo library permission.');
    return false;
  }
}

let explainedVideoOnce = false;
let explainedMacCamOnce = false;

function explainMacCameraOnce() {
  if (explainedMacCamOnce || Platform.OS !== 'ios') return;
  explainedMacCamOnce = true;
  Alert.alert('Use MacBook camera', MAC_CAMERA_HINT, [{ text: 'Got it' }]);
}

async function pickPhotoFromLibrary(): Promise<MediaAsset | null> {
  if (!(await ensureLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.75,
    allowsMultipleSelection: false,
    allowsEditing: false,
    ...(Platform.OS === 'android' ? { legacy: true } : {}),
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return toAsset(result.assets[0], 'image');
}

/**
 * Site / directional photo / selfie.
 * On Android emulator → Gallery.
 * On iOS Simulator → in-app camera using MacBook camera (set I/O → Camera).
 * On real phone → device camera.
 */
export async function capturePhoto(options?: {
  facing?: 'front' | 'back';
  title?: string;
}): Promise<MediaAsset | null> {
  if (Platform.OS === 'ios' && __DEV__) {
    explainMacCameraOnce();
  }

  // Prefer in-app CameraView so both real devices and Emulators/Simulators can use the camera.
  return openDeviceCamera({
    mode: 'photo',
    facing: options?.facing ?? 'back',
    title: options?.title ?? 'Take photo',
  });
}

/** Engineer selfie — front camera (MacBook FaceTime front when mapped on Simulator). */
export async function captureSelfie(): Promise<MediaAsset | null> {
  return capturePhoto({ facing: 'front', title: 'Take selfie' });
}

export async function pickPhoto(): Promise<MediaAsset | null> {
  try {
    return await pickPhotoFromLibrary();
  } catch (e) {
    Alert.alert(
      'Photos error',
      e instanceof Error ? e.message : 'Could not open photo library'
    );
    return null;
  }
}

export async function pickVideoFromLibrary(): Promise<MediaAsset | null> {
  try {
    if (!(await ensureLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      allowsEditing: false,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      ...(Platform.OS === 'android' ? { legacy: true } : {}),
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return toAsset(result.assets[0], 'video');
  } catch (e) {
    Alert.alert(
      'Video error',
      e instanceof Error ? e.message : 'Could not open video library'
    );
    return null;
  }
}

export async function pickVideoFromFiles(): Promise<MediaAsset | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uri: result.assets[0].uri,
      type: 'video',
      width: 0,
      height: 0,
      durationMs: null,
      createdAt: Date.now(),
    };
  } catch (e) {
    Alert.alert(
      'Video error',
      e instanceof Error ? e.message : 'Could not open file picker'
    );
    return null;
  }
}

export async function chooseVideoFile(): Promise<MediaAsset | null> {
  return new Promise((resolve) => {
    Alert.alert('Choose video', 'Select where to pick the inspection video from.', [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      {
        text: 'Photo library',
        onPress: () => {
          void pickVideoFromLibrary().then(resolve);
        },
      },
      {
        text: 'Device files',
        onPress: () => {
          void pickVideoFromFiles().then(resolve);
        },
      },
    ]);
  });
}

/**
 * Inspection video.
 * Apple blocks live *recording* on iOS Simulator — Gallery/Files only there.
 * Real phone uses camera record.
 */
export async function captureVideo(): Promise<MediaAsset | null> {
  if (isLiveVideoBlocked()) {
    if (!explainedVideoOnce) {
      explainedVideoOnce = true;
      Alert.alert('Video on Simulator', VIRTUAL_CAMERA_MESSAGE, [{ text: 'OK' }]);
    }
    return chooseVideoFile();
  }

  return openDeviceCamera({
    mode: 'video',
    facing: 'back',
    title: 'Record inspection video',
    maxDurationSec: 120,
  });
}

export async function pickVideo(): Promise<MediaAsset | null> {
  return pickVideoFromLibrary();
}
