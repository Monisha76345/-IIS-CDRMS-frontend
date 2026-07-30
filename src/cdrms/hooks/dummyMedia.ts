import { Asset } from 'expo-asset';

import type { MediaAsset } from '@/src/cdrms/project/types';

function toAsset(
  uri: string,
  type: 'image' | 'video',
  extra?: { width?: number; height?: number; durationMs?: number | null }
): MediaAsset {
  return {
    id: `dummy-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    uri,
    type,
    width: extra?.width ?? (type === 'image' ? 512 : 640),
    height: extra?.height ?? (type === 'image' ? 512 : 360),
    durationMs: extra?.durationMs ?? (type === 'video' ? 8000 : null),
    createdAt: Date.now(),
  };
}

async function localUriFromModule(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) throw new Error('Could not load sample media file');
  return uri;
}

/** Local sample photo (app icon) — for selfie / site photo upload while testing. */
export async function createDummyImageAsset(): Promise<MediaAsset> {
  const uri = await localUriFromModule(require('../../../assets/icon.png'));
  return toAsset(uri, 'image', { width: 512, height: 512 });
}

/** Local sample video — for inspection video upload while testing. */
export async function createDummyVideoAsset(): Promise<MediaAsset> {
  const uri = await localUriFromModule(require('../../../assets/dummy-sample.mp4'));
  return toAsset(uri, 'video', { width: 640, height: 360, durationMs: 8000 });
}
