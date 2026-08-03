import {
  downloadApplicationPdf,
  type PdfDownloadResult,
} from '@/src/cdrms/lib/downloadApplicationPdf';
import { showPdfDownloadBanner } from '@/src/cdrms/lib/pdfDownloadBanner';
import type { MobileApplication } from '@/src/api/applications';

function pdfLabel(app: MobileApplication) {
  return `${app.applicationNumber.replace(/[^\w.-]+/g, '_')}-CDR.pdf`;
}

/** Download PDF and show a Chrome-style top banner for progress / completion / errors. */
export async function downloadApplicationPdfWithFeedback(
  app: MobileApplication,
  token: string,
): Promise<PdfDownloadResult> {
  const label = pdfLabel(app);

  showPdfDownloadBanner({
    title: 'Downloading…',
    body: label,
    variant: 'progress',
  });

  try {
    const result = await downloadApplicationPdf(app, token);
    showPdfDownloadBanner({
      title: 'Download complete',
      body: result.fileName,
      variant: 'complete',
      openUri: result.openUri || result.savedPath,
    });
    return result;
  } catch (e) {
    showPdfDownloadBanner({
      title: 'Download failed',
      body: e instanceof Error ? e.message : 'Could not generate PDF',
      variant: 'error',
    });
    throw e;
  }
}
