import type { MobileApplication } from '@/src/api/applications';
import { downloadApplicationPdfWithFeedback } from '@/src/cdrms/lib/downloadApplicationPdfWithFeedback';
import type { PdfDownloadResult } from '@/src/cdrms/lib/downloadApplicationPdf';
import {
  clearAppPdfDownload,
  isAppPdfDownloading,
  setAppPdfDownload,
} from '@/src/cdrms/lib/pdfDownloadProgress';

function pdfLabel(app: MobileApplication) {
  return `${app.applicationNumber.replace(/[^\w.-]+/g, '_')}-CDR.pdf`;
}

/** Start PDF download — only blocks repeat taps on the same application. */
export async function runApplicationPdfDownload(
  app: MobileApplication,
  accessToken: string,
): Promise<PdfDownloadResult | null> {
  if (!accessToken?.trim() || isAppPdfDownloading(app.id)) return null;

  const fileName = pdfLabel(app);
  setAppPdfDownload(app.id, {
    fileName,
    percent: 0,
    label: 'Starting…',
  });

  try {
    const result = await downloadApplicationPdfWithFeedback(app, accessToken, (update) => {
      setAppPdfDownload(app.id, {
        fileName,
        percent: update.percent,
        label: update.label,
      });
    });
    setAppPdfDownload(app.id, {
      fileName,
      percent: 100,
      label: 'Complete',
    });
    return result;
  } catch {
    return null;
  } finally {
    clearAppPdfDownload(app.id, 900);
  }
}
