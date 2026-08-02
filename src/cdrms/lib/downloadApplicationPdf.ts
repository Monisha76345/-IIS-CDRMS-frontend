import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  applicationStatusLabel,
  fetchApplication,
  type MobileApplication,
} from '@/src/api/applications';

/** Persisted Android SAF URI for the user-chosen Downloads (or other) folder. */
const PDF_DOWNLOADS_DIR_KEY = 'cdrms_pdf_downloads_dir';

export type PdfDownloadResult = {
  fileName: string;
  savedPath: string;
  message: string;
  /** Local file:// URI that can be opened / re-shared (sandbox or temp). */
  openUri?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(value?: string | number | null) {
  if (value == null || value === '') return '—';
  return escapeHtml(String(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function scheduleNoteLine(app: MobileApplication, side: 'N' | 'S' | 'E' | 'W') {
  const note = app.engineerScheduleNotes?.[side]?.trim() || '';
  const road = Boolean(app.scheduleRoadFlags?.[side]);
  if (!note && !road) return '—';
  if (note && road) return `${note} · Road`;
  if (road) return 'Road';
  return note;
}

function isVideoMedia(url: string) {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url) || /\/video/i.test(url);
}

function collectPhotoLabels(app: MobileApplication): string[] {
  const out: string[] = [];
  if (app.selfieUrl?.trim() && !isVideoMedia(app.selfieUrl)) out.push('Selfie');
  (app.photoUrls ?? []).filter(Boolean).forEach((_, i) => {
    out.push(`Site photo ${i + 1}`);
  });
  const raw = app.schedulePhotoUrls ?? {};
  const schedule = {
    N: raw.N || raw.n || '',
    S: raw.S || raw.s || '',
    E: raw.E || raw.e || '',
    W: raw.W || raw.w || '',
  };
  (
    [
      ['N', 'North photo'],
      ['S', 'South photo'],
      ['E', 'East photo'],
      ['W', 'West photo'],
    ] as const
  ).forEach(([key, label]) => {
    if (schedule[key]) out.push(label);
  });
  return out;
}

function cardOpen(title: string) {
  return `<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #cbd5e1;margin:0 0 12px;background:#fff;">
    <tr><td style="background:#eff6ff;color:#2563eb;font-size:12px;font-weight:bold;padding:8px 10px;border-bottom:1px solid #dbeafe;">${escapeHtml(title)}</td></tr>
    <tr><td style="padding:0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">`;
}

function cardClose() {
  return `</table></td></tr></table>`;
}

function formRowPair(a: [string, string], b?: [string, string]) {
  const cellL =
    'width:22%;background:#f8fafc;color:#64748b;font-weight:600;font-size:9px;border-top:1px solid #e2e8f0;padding:7px 8px;vertical-align:top;';
  const cellV =
    'width:28%;color:#0f172a;font-size:10px;font-weight:700;border-top:1px solid #e2e8f0;padding:7px 8px;vertical-align:top;';
  if (b) {
    return `<tr>
      <td style="${cellL}">${escapeHtml(a[0])}</td><td style="${cellV}">${a[1]}</td>
      <td style="${cellL}">${escapeHtml(b[0])}</td><td style="${cellV}">${b[1]}</td>
    </tr>`;
  }
  return `<tr><td style="${cellL}">${escapeHtml(a[0])}</td><td style="${cellV}" colspan="3">${a[1]}</td></tr>`;
}

function zcFormTable(app: MobileApplication, engineer: string, address: string) {
  return `
    ${cardOpen('ZC details')}
      ${formRowPair(['Application no', fmt(app.applicationNumber)], ['Status', fmt(applicationStatusLabel(app.status))])}
      ${formRowPair(['Site no', fmt(app.siteNo)], ['Site type', fmt(app.siteDimensionType)])}
      ${formRowPair(['Site dimension', fmt(app.siteDimension)], ['Zone', fmt(`${app.zoneCode} (#${app.zoneId})`)])}
      ${formRowPair(['Area', fmt(app.addressArea)], ['Block', fmt(app.addressBlock)])}
      ${formRowPair(['Pincode', fmt(app.addressPincode)], ['Assigned CAO', fmt(app.assignedCaoName)])}
      ${formRowPair(['Created by ZC', fmt(app.createdByZcName)], ['ZC submitted', fmt(formatDateTime(app.createdAt))])}
      ${formRowPair(['Assigned engineer', fmt(engineer)])}
      ${formRowPair(['Address', fmt(address || '—')])}
      ${formRowPair(['ZC comments', fmt(app.siteDimensionComment)])}
    ${cardClose()}

    ${cardOpen('ZC — Site schedules')}
      ${formRowPair(['Schedule N', fmt(app.scheduleNorth)], ['Schedule S', fmt(app.scheduleSouth)])}
      ${formRowPair(['Schedule W', fmt(app.scheduleWest)], ['Schedule E', fmt(app.scheduleEast)])}
    ${cardClose()}
  `;
}

function diagramBlock(app: MobileApplication) {
  // expo-print WebView often blanks the whole PDF when SVG/images are embedded.
  const hasDims = [app.dimNorth, app.dimSouth, app.dimEast, app.dimWest, app.siteDimension].some(
    (v) => v != null && String(v).trim() !== '',
  );
  if (!hasDims) return '';
  return `
    ${cardOpen('Site dimensions')}
      ${formRowPair(['Site dimension', fmt(app.siteDimension)], ['Total area', fmt(app.totalSiteArea)])}
      ${formRowPair(['Dim North', fmt(app.dimNorth)], ['Dim South', fmt(app.dimSouth)])}
      ${formRowPair(['Dim East', fmt(app.dimEast)], ['Dim West', fmt(app.dimWest)])}
    ${cardClose()}
  `;
}

function engineerBlock(app: MobileApplication) {
  return `
    ${cardOpen('Engineer details')}
      ${formRowPair(['Assigned engineer', fmt(app.assignedEngineerName)], ['Engineer submitted', fmt(formatDateTime(app.engineerSubmittedAt))])}
      ${formRowPair(['Site verification', fmt(app.engineerSiteDetails)])}
      ${formRowPair(
        ['Schedule N', fmt(scheduleNoteLine(app, 'N'))],
        ['Schedule S', fmt(scheduleNoteLine(app, 'S'))],
      )}
      ${formRowPair(
        ['Schedule W', fmt(scheduleNoteLine(app, 'W'))],
        ['Schedule E', fmt(scheduleNoteLine(app, 'E'))],
      )}
      ${formRowPair(['Compass', fmt(app.compass)], ['Occupancy', fmt(app.occupancy)])}
      ${formRowPair(['Occupancy reason', fmt(app.occupancyReason)])}
      ${formRowPair([
        'Location',
        fmt(
          app.engineerGeoAddress?.displayName ||
            app.engineerGeoAddress?.village ||
            null,
        ),
      ])}
      ${formRowPair([
        'Area',
        fmt(
          [
            app.engineerGeoAddress?.area,
            app.engineerGeoAddress?.block,
            app.engineerGeoAddress?.district,
            app.engineerGeoAddress?.state,
            app.engineerGeoAddress?.postalCode,
          ]
            .filter(Boolean)
            .join(' · ') || null,
        ),
      ])}
      ${formRowPair(['Latitude', fmt(app.latitude)], ['Longitude', fmt(app.longitude)])}
      ${formRowPair(['Engineer comments', fmt(app.engineerComments)])}
    ${cardClose()}
  `;
}

function photosSummary(app: MobileApplication) {
  const photos = collectPhotoLabels(app);
  const hasVideo = Boolean(app.videoUrl?.trim());
  if (photos.length === 0 && !hasVideo) return '';
  return `
    ${cardOpen('Media')}
      ${formRowPair(['Photos', fmt(photos.join(', ') || '—')])}
      ${formRowPair(['Site video', fmt(hasVideo ? 'Captured' : '—')])}
    ${cardClose()}
  `;
}

function buildHtml(app: MobileApplication) {
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');
  const engineer = [app.assignedEngineerName || 'Engineer', app.assignedEngineerLoginId]
    .filter(Boolean)
    .join(' · ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(app.applicationNumber)} CDR</title>
</head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:11px;line-height:1.4;background:#ffffff;">
  <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;background-color:#2563eb;">
    <tr>
      <td style="padding:12px 14px;">
        <div style="color:#dbeafe;font-size:9px;font-weight:bold;">BDA</div>
        <div style="color:#ffffff;font-size:18px;font-weight:bold;">CDRMS</div>
        <div style="color:#e0e7ff;font-size:10px;margin-top:4px;">${escapeHtml(app.applicationNumber)} · ${escapeHtml(applicationStatusLabel(app.status))}</div>
      </td>
    </tr>
  </table>
  ${zcFormTable(app, engineer, address)}
  ${diagramBlock(app)}
  ${engineerBlock(app)}
  ${photosSummary(app)}
  <div style="margin-top:12px;color:#64748b;font-size:9px;">Generated by CDRMS mobile · ${escapeHtml(new Date().toLocaleString())}</div>
</body>
</html>`;
}

async function resolvePdfApplication(
  app: MobileApplication,
  token: string,
): Promise<MobileApplication> {
  try {
    return await fetchApplication(token, app.id);
  } catch {
    return app;
  }
}

function pdfFileName(app: MobileApplication) {
  return `${app.applicationNumber.replace(/[^\w.-]+/g, '_')}-CDR.pdf`;
}

async function assertPdfFile(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  const size = info.exists && 'size' in info ? Number(info.size ?? 0) : 0;
  if (!info.exists || size < 200) {
    throw new Error('PDF generation failed (empty file). Try again.');
  }
  return size;
}

async function keepSandboxCopy(tempUri: string, fileName: string): Promise<string | null> {
  const root = FileSystem.documentDirectory;
  if (!root) return null;
  const dir = `${root}CDRMS/Downloads/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${fileName}`;
  await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => undefined);
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

async function resolveAndroidDownloadsDir(): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;
  if (!saf) return null;

  const cached = await SecureStore.getItemAsync(PDF_DOWNLOADS_DIR_KEY).catch(() => null);
  if (cached) {
    try {
      await saf.readDirectoryAsync(cached);
      return cached;
    } catch {
      await SecureStore.deleteItemAsync(PDF_DOWNLOADS_DIR_KEY).catch(() => undefined);
    }
  }

  // Prefer the public Download folder when the system supports it.
  let initialUri: string | undefined;
  try {
    initialUri = saf.getUriForDirectoryInRoot('Download');
  } catch {
    initialUri = undefined;
  }

  const permissions = await saf.requestDirectoryPermissionsAsync(initialUri);
  if (!permissions.granted || !permissions.directoryUri) return null;

  await SecureStore.setItemAsync(PDF_DOWNLOADS_DIR_KEY, permissions.directoryUri).catch(
    () => undefined,
  );
  return permissions.directoryUri;
}

async function savePdfViaAndroidSaf(
  tempUri: string,
  fileName: string,
): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;
  if (!saf) return null;

  const dirUri = await resolveAndroidDownloadsDir();
  if (!dirUri) return null;

  const base64 = await FileSystem.readAsStringAsync(tempUri, {
    encoding: 'base64',
  });
  const destUri = await saf.createFileAsync(dirUri, fileName, 'application/pdf');
  await FileSystem.writeAsStringAsync(destUri, base64, {
    encoding: 'base64',
  });
  return destUri;
}

async function sharePdf(uri: string, fileName: string) {
  let Sharing: typeof import('expo-sharing');
  try {
    Sharing = require('expo-sharing');
  } catch {
    return false;
  }
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Save ${fileName}`,
    UTI: 'com.adobe.pdf',
  });
  return true;
}

/**
 * Save PDF to a folder the user can see (Android Downloads via SAF),
 * then open the system share sheet so they get the usual save / open UI.
 */
async function savePdfToDevice(
  tempUri: string,
  fileName: string,
): Promise<{ savedPath: string; openUri: string; message: string }> {
  await assertPdfFile(tempUri);

  const sandboxUri = (await keepSandboxCopy(tempUri, fileName)) || tempUri;
  let publicPath: string | null = null;

  if (Platform.OS === 'android') {
    try {
      publicPath = await savePdfViaAndroidSaf(tempUri, fileName);
    } catch {
      publicPath = null;
    }
  }

  // System share / “save to Files / Downloads” sheet — also acts as the
  // completion UI users expect after a download (Android + iOS).
  const shared = await sharePdf(sandboxUri, fileName).catch(() => false);

  if (publicPath) {
    return {
      savedPath: publicPath,
      openUri: sandboxUri,
      message: shared
        ? `${fileName} saved. Use the share sheet to open or send it.`
        : `${fileName} saved to your Downloads folder.`,
    };
  }

  if (shared) {
    return {
      savedPath: sandboxUri,
      openUri: sandboxUri,
      message: `${fileName} ready — choose Save to Files / Downloads in the share sheet.`,
    };
  }

  return {
    savedPath: sandboxUri,
    openUri: sandboxUri,
    message: `${fileName} saved in the app. Open Files and look under CDRMS / Downloads.`,
  };
}

/** Generate and save a CDR application PDF on the device (public Downloads when possible). */
export async function downloadApplicationPdf(
  app: MobileApplication,
  token: string,
): Promise<PdfDownloadResult> {
  if (!token?.trim()) throw new Error('Sign in required to download PDF');

  let Print: typeof import('expo-print');
  try {
    Print = require('expo-print');
  } catch {
    throw new Error(
      'PDF engine is not available in this build. Open with Expo Go, or rebuild the app with expo-print.',
    );
  }

  const full = await resolvePdfApplication(app, token);
  const html = buildHtml(full);
  if (!html || html.length < 100) {
    throw new Error('Could not build PDF content');
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (!uri) throw new Error('PDF engine returned no file');

  const size = await assertPdfFile(uri);
  if (size < 800) {
    throw new Error('PDF looks empty. Please try Download again.');
  }

  const fileName = pdfFileName(full);
  const result = await savePdfToDevice(uri, fileName);
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);

  return {
    fileName,
    savedPath: result.savedPath,
    openUri: result.openUri,
    message: result.message,
  };
}
