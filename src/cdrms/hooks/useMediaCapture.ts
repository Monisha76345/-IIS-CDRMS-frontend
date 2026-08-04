import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { openDeviceCamera } from '@/src/cdrms/camera/cameraCaptureGate';
import {
  isAndroidVirtual,
  isLiveVideoBlocked,
  MAC_CAMERA_HINT,
  VIRTUAL_CAMERA_MESSAGE,
} from '@/src/cdrms/device/isVirtualDevice';
import {
  createDummyImageAsset,
  createDummyVideoAsset,
} from '@/src/cdrms/hooks/dummyMedia';
import { isSimulatorOrEmulator } from '@/src/cdrms/hooks/useCompass';
import { ensureMediaCapturePermissions } from '@/src/cdrms/mediaPermission';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
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
  showAppDialog({
    variant: 'warning',
    title,
    message,
    cancelLabel: 'Cancel',
    confirmLabel: 'Open Settings',
    onConfirm: () => void Linking.openSettings(),
  });
}

/** Sample media only on Simulator / Emulator — never on a real phone. */
export function useDummyCapture(): boolean {
  if (isSimulatorOrEmulator()) return true;
  if (isAndroidVirtual()) return true;
  if (Platform.OS === 'ios' && Constants.isDevice === false) return true;
  return false;
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
    showAppDialog({
      variant: 'error',
      title: 'Photos error',
      message: 'Could not request photo library permission.',
      hideCancel: true,
      confirmLabel: 'OK',
    });
    return false;
  }
}

let explainedVideoOnce = false;
let explainedMacCamOnce = false;

function explainMacCameraOnce() {
  if (explainedMacCamOnce || Platform.OS !== 'ios') return;
  explainedMacCamOnce = true;
  showAppDialog({
    variant: 'info',
    title: 'Use MacBook camera',
    message: MAC_CAMERA_HINT,
    hideCancel: true,
    confirmLabel: 'Got it',
  });
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
 * Open the native system camera (most reliable on real Android / iPhone).
 * Falls back to in-app CameraView if the system picker fails.
 */
async function captureWithSystemCamera(options?: {
  facing?: 'front' | 'back';
  title?: string;
  lockFacing?: boolean;
}): Promise<MediaAsset | null> {
  if (!(await ensureMediaCapturePermissions('photo'))) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      cameraType:
        options?.facing === 'front'
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back,
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return toAsset(result.assets[0], 'image');
  } catch (e) {
    try {
      return await openDeviceCamera({
        mode: 'photo',
        facing: options?.facing ?? 'back',
        title: options?.title ?? 'Take photo',
        lockFacing: options?.lockFacing ?? false,
      });
    } catch {
      showAppDialog({
        variant: 'error',
        title: 'Camera error',
        message:
          e instanceof Error
            ? e.message
            : 'Could not open the camera. Allow Camera in Settings and try again.',
        hideCancel: true,
        confirmLabel: 'OK',
      });
      return null;
    }
  }
}

/**
 * Site / directional photo / selfie.
 * Simulator/Emulator → sample image.
 * Real phone → system camera (with CameraView fallback).
 */
export async function capturePhoto(options?: {
  facing?: 'front' | 'back';
  title?: string;
  lockFacing?: boolean;
}): Promise<MediaAsset | null> {
  if (useDummyCapture()) {
    try {
      return await createDummyImageAsset();
    } catch {
      // Fall through if sample asset fails
    }
  }

  if (Platform.OS === 'ios' && Constants.isDevice === false) {
    explainMacCameraOnce();
  }

  return captureWithSystemCamera(options);
}

/** Engineer selfie — front camera only (no rear flip). */
export async function captureSelfie(): Promise<MediaAsset | null> {
  if (useDummyCapture()) {
    try {
      return await createDummyImageAsset();
    } catch {
      // Fall through if sample asset fails
    }
  }

  if (Platform.OS === 'ios' && Constants.isDevice === false) {
    explainMacCameraOnce();
  }

  if (!(await ensureMediaCapturePermissions('photo'))) return null;

  // Use in-app camera so rear camera / flip cannot be selected.
  try {
    return await openDeviceCamera({
      mode: 'photo',
      facing: 'front',
      title: 'Take selfie',
      lockFacing: true,
    });
  } catch {
    return captureWithSystemCamera({
      facing: 'front',
      title: 'Take selfie',
      lockFacing: true,
    });
  }
}

/** Site / schedule photos — rear camera only (no front flip). */
export async function captureSitePhoto(options?: {
  title?: string;
}): Promise<MediaAsset | null> {
  if (useDummyCapture()) {
    try {
      return await createDummyImageAsset();
    } catch {
      // Fall through if sample asset fails
    }
  }

  if (!(await ensureMediaCapturePermissions('photo'))) return null;

  const title = options?.title ?? 'Take site photo';

  try {
    return await openDeviceCamera({
      mode: 'photo',
      facing: 'back',
      title,
      lockFacing: true,
    });
  } catch {
    return captureWithSystemCamera({
      facing: 'back',
      title,
      lockFacing: true,
    });
  }
}

export async function pickPhoto(): Promise<MediaAsset | null> {
  try {
    return await pickPhotoFromLibrary();
  } catch (e) {
    showAppDialog({
      variant: 'error',
      title: 'Photos error',
      message: e instanceof Error ? e.message : 'Could not open photo library',
      hideCancel: true,
      confirmLabel: 'OK',
    });
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
    showAppDialog({
      variant: 'error',
      title: 'Video error',
      message: e instanceof Error ? e.message : 'Could not open video library',
      hideCancel: true,
      confirmLabel: 'OK',
    });
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
    showAppDialog({
      variant: 'error',
      title: 'Video error',
      message: e instanceof Error ? e.message : 'Could not open file picker',
      hideCancel: true,
      confirmLabel: 'OK',
    });
    return null;
  }
}

export async function chooseVideoFile(): Promise<MediaAsset | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: MediaAsset | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    showAppDialog({
      variant: 'info',
      title: 'Choose video',
      message: 'Select where to pick the inspection video from.',
      cancelLabel: 'Photo library',
      confirmLabel: 'Device files',
      onDismiss: () => finish(null),
      onCancel: () => {
        void pickVideoFromLibrary().then(finish);
      },
      onConfirm: () => {
        void pickVideoFromFiles().then(finish);
      },
    });
  });
}

/**
 * Inspection video.
 * Simulator → sample / gallery.
 * Real phone → system camera recorder (fallback: in-app CameraView).
 */
export async function captureVideo(): Promise<MediaAsset | null> {
  if (useDummyCapture() || isLiveVideoBlocked()) {
    try {
      return await createDummyVideoAsset();
    } catch {
      // Fall through to gallery / files if bundled sample is missing
      if (isLiveVideoBlocked()) {
        if (!explainedVideoOnce) {
          explainedVideoOnce = true;
          showAppDialog({
            variant: 'info',
            title: 'Video on Simulator',
            message: VIRTUAL_CAMERA_MESSAGE,
            hideCancel: true,
            confirmLabel: 'OK',
          });
        }
        return chooseVideoFile();
      }
    }
  }

  if (!(await ensureMediaCapturePermissions('video'))) return null;

  // System camera video is the most reliable on real Android / iPhone.
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 120,
      allowsEditing: false,
      quality: 0.7,
      ...(Platform.OS === 'ios'
        ? {
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
          }
        : {}),
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return toAsset(result.assets[0], 'video');
  } catch {
    return openDeviceCamera({
      mode: 'video',
      facing: 'back',
      title: 'Record inspection video',
      maxDurationSec: 120,
    });
  }
}

export async function pickVideo(): Promise<MediaAsset | null> {
  return pickVideoFromLibrary();
}
