import { useEffect, useState } from 'react';

import {
  getAppPdfDownload,
  getPdfDownloads,
  subscribePdfDownloads,
  type PdfDownloadItem,
  type PdfDownloadsState,
} from '@/src/cdrms/lib/pdfDownloadProgress';

export function usePdfDownloads(): PdfDownloadsState {
  const [items, setItems] = useState(getPdfDownloads);

  useEffect(() => subscribePdfDownloads(setItems), []);

  return items;
}

export function useAppPdfDownload(appId: string | null | undefined): PdfDownloadItem | null {
  const downloads = usePdfDownloads();
  if (!appId) return null;
  return downloads[appId] ?? null;
}

/** @deprecated Use usePdfDownloads / useAppPdfDownload */
export function usePdfDownloadProgress() {
  const downloads = usePdfDownloads();
  const first = Object.values(downloads)[0];
  return {
    active: Boolean(first),
    fileName: first?.fileName ?? '',
    percent: first?.percent ?? 0,
    label: first?.label ?? '',
    appId: first?.appId ?? null,
  };
}

export { getAppPdfDownload, isAppPdfDownloading } from '@/src/cdrms/lib/pdfDownloadProgress';
