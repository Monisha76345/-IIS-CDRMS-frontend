import { openPdfWithChooser } from '@/src/cdrms/lib/pdfFileShare';

export type PdfDownloadBannerVariant = 'progress' | 'complete' | 'error';

export type PdfDownloadBannerState = {
  id: string;
  title: string;
  body: string;
  variant: PdfDownloadBannerVariant;
  openUri?: string;
};

type Listener = (state: PdfDownloadBannerState | null) => void;

let listener: Listener | null = null;
let current: PdfDownloadBannerState | null = null;
let lastCompletedPdfUri: string | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let opening = false;

function publish(state: PdfDownloadBannerState | null) {
  current = state;
  listener?.(state);
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

export function subscribePdfDownloadBanner(next: Listener): () => void {
  listener = next;
  next(current);
  return () => {
    if (listener === next) listener = null;
  };
}

export function hidePdfDownloadBanner() {
  clearHideTimer();
  publish(null);
}

export function showPdfDownloadBanner(input: Omit<PdfDownloadBannerState, 'id'> & { id?: string }) {
  clearHideTimer();
  const next: PdfDownloadBannerState = {
    id: input.id ?? `pdf-banner-${Date.now()}`,
    title: input.title,
    body: input.body,
    variant: input.variant,
    openUri: input.openUri,
  };

  if (input.variant === 'complete' && input.openUri) {
    lastCompletedPdfUri = input.openUri;
  }

  publish(next);

  if (input.variant !== 'progress') {
    hideTimer = setTimeout(() => hidePdfDownloadBanner(), input.variant === 'error' ? 6000 : 12000);
  }
}

export async function handlePdfDownloadBannerPress(state: PdfDownloadBannerState) {
  if (state.variant !== 'complete' || opening) return;

  const uri = state.openUri || lastCompletedPdfUri;
  if (!uri) return;

  opening = true;
  try {
    const opened = await openPdfWithChooser(uri);
    if (opened) hidePdfDownloadBanner();
  } finally {
    opening = false;
  }
}

export function getLatestCompletedPdfUri() {
  return lastCompletedPdfUri;
}
