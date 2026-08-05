export type PdfDownloadItem = {
  appId: string;
  fileName: string;
  percent: number;
  label: string;
};

export type PdfDownloadsState = Record<string, PdfDownloadItem>;

type Listener = (state: PdfDownloadsState) => void;

const downloads: PdfDownloadsState = {};
const listeners = new Set<Listener>();

function snapshot(): PdfDownloadsState {
  return { ...downloads };
}

function publish() {
  const next = snapshot();
  listeners.forEach((listener) => listener(next));
}

export function getPdfDownloads(): PdfDownloadsState {
  return snapshot();
}

export function subscribePdfDownloads(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function isAppPdfDownloading(appId: string): boolean {
  return appId in downloads;
}

export function getAppPdfDownload(appId: string): PdfDownloadItem | null {
  return downloads[appId] ?? null;
}

export function setAppPdfDownload(
  appId: string,
  patch: Partial<Omit<PdfDownloadItem, 'appId'>> & Pick<PdfDownloadItem, 'fileName'>,
) {
  const current = downloads[appId];
  downloads[appId] = {
    appId,
    fileName: patch.fileName,
    percent: Math.max(0, Math.min(100, patch.percent ?? current?.percent ?? 0)),
    label: patch.label ?? current?.label ?? '',
  };
  publish();
}

export function clearAppPdfDownload(appId: string, delayMs = 0) {
  const clear = () => {
    if (!(appId in downloads)) return;
    delete downloads[appId];
    publish();
  };
  if (delayMs > 0) {
    setTimeout(clear, delayMs);
    return;
  }
  clear();
}

export type PdfDownloadProgressHandler = (update: { percent: number; label: string }) => void;
