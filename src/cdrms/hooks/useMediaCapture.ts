import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

import type { MediaAsset } from '@/src/cdrms/project/types';

function toAsset(
  asset: ImagePicker.ImagePickerAsset,
  type: 'image' | 'video'
): MediaAsset {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: asset.uri,
    type,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
    createdAt: Date.now(),
  };
}

function isCameraUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /camera not available|not available on simulator|simulator/i.test(message);
}

function permissionOk(status: ImagePicker.PermissionStatus): boolean {
  return status === 'granted' || status === 'limited';
}

function showPermissionAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => void Linking.openSettings() },
  ]);
}

async function ensureCameraPermission() {
  try {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (permissionOk(current.status)) return true;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionOk(status)) return true;

    showPermissionAlert(
      'Camera needed',
      'Allow camera access in Settings so CDRMS can capture site photos and video.'
    );
    return false;
  } catch {
    Alert.alert('Camera error', 'Could not request camera permission.');
    return false;
  }
}

async function ensureLibraryPermission() {
  try {
    // iOS PHPicker opens without a prior permission grant (Expo docs).
    if (Platform.OS === 'ios') return true;

    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permissionOk(current.status)) return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionOk(status)) return true;

    showPermissionAlert(
      'Photos needed',
      'Allow photo library access in Settings so CDRMS can pick site images or video.'
    );
    return false;
  } catch {
    Alert.alert('Photos error', 'Could not request photo library permission.');
    return false;
  }
}

function offerLibraryFallback(
  kind: 'photo' | 'video'
): Promise<MediaAsset | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Camera unavailable',
      'No camera on this device (simulator). Choose from your library instead?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        {
          text: kind === 'photo' ? 'Choose photo' : 'Choose video',
          onPress: () => {
            void (kind === 'photo' ? pickPhoto() : pickVideo()).then(resolve);
          },
        },
      ]
    );
  });
}

export async function capturePhoto(): Promise<MediaAsset | null> {
  try {
    if (!(await ensureCameraPermission())) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      exif: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    return toAsset(result.assets[0], 'image');
  } catch (e) {
    if (isCameraUnavailable(e)) return offerLibraryFallback('photo');
    const message = e instanceof Error ? e.message : 'Could not open camera';
    Alert.alert('Camera error', message);
    return null;
  }
}

export async function pickPhoto(): Promise<MediaAsset | null> {
  try {
    if (!(await ensureLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return null;
    return toAsset(result.assets[0], 'image');
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not open photo library';
    Alert.alert('Photos error', message);
    return null;
  }
}

export async function captureVideo(): Promise<MediaAsset | null> {
  try {
    if (!(await ensureCameraPermission())) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 120,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return null;
    return toAsset(result.assets[0], 'video');
  } catch (e) {
    if (isCameraUnavailable(e)) return offerLibraryFallback('video');
    const message = e instanceof Error ? e.message : 'Could not record video';
    Alert.alert('Video error', message);
    return null;
  }
}

export async function pickVideo(): Promise<MediaAsset | null> {
  try {
    if (!(await ensureLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return null;
    return toAsset(result.assets[0], 'video');
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not open video library';
    Alert.alert('Video error', message);
    return null;
  }
}
