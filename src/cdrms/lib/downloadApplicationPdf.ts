import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/src/api/config';
import {
  applicationStatusLabel,
  fetchApplication,
  type MobileApplication,
} from '@/src/api/applications';
import { buildSiteDimensionPlotSvgFromApp } from '@/src/cdrms/lib/buildSiteDimensionPlotSvg';

const BDA_LOGO = require('../../../assets/bda-logo.png');

const { StorageAccessFramework } = FileSystem;
const PDF_DOWNLOADS_DIR_KEY = 'cdrms_pdf_downloads_dir';

export type PdfDownloadResult = {
  fileName: string;
  savedPath: string;
  message: string;
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
  if (Number.isNaN(d.getTime())) return escapeHtml(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${hours}:${minutes} ${ampm}`;
}

function isVideoMedia(url: string) {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url) || /\/video/i.test(url);
}

function normalizeSchedulePhotos(app: MobileApplication) {
  const raw = app.schedulePhotoUrls ?? {};
  return {
    N: raw.N || raw.n || '',
    S: raw.S || raw.s || '',
    E: raw.E || raw.e || '',
    W: raw.W || raw.w || '',
  };
}

type PhotoEntry = { label: string; url: string; refId: string };

function collectPhotos(app: MobileApplication): PhotoEntry[] {
  const out: PhotoEntry[] = [];
  const id = app.id;

  const pushImage = (label: string, url: string, refId: string) => {
    const trimmed = url.trim();
    if (!trimmed || isVideoMedia(trimmed) || refId.endsWith(':video')) return;
    out.push({ label, url: trimmed, refId });
  };

  if (app.selfieUrl?.trim()) {
    pushImage('Selfie', app.selfieUrl, `${id}:selfie`);
  }
  ;(app.photoUrls ?? []).filter(Boolean).forEach((url, i) => {
    pushImage(`Site photo ${i + 1}`, url!, `${id}:photo-${i}`);
  });
  const schedule = normalizeSchedulePhotos(app);
  ;(
    [
      ['N', 'North photo'],
      ['S', 'South photo'],
      ['E', 'East photo'],
      ['W', 'West photo'],
    ] as const
  ).forEach(([key, label]) => {
    if (schedule[key]) pushImage(label, schedule[key], `${id}:schedule-${key}`);
  });
  return out;
}

async function downloadToDataUrl(token: string, apiPath: string): Promise<string | null> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return null;

  const dest = `${cacheDir}pdf-img-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const url = apiPath.startsWith('http') ? apiPath : `${API_BASE_URL}${apiPath}`;

  try {
    const result = await FileSystem.downloadAsync(url, dest, {
      headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
    });
    if (result.status < 200 || result.status >= 300) return null;
    const info = await FileSystem.getInfoAsync(dest);
    if (!info.exists || ('size' in info && (info.size ?? 0) < 64)) return null;
    const base64 = await FileSystem.readAsStringAsync(dest, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  } finally {
    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => undefined);
  }
}

async function loadImageDataUrl(
  token: string,
  opts: { url?: string | null; refId?: string },
): Promise<string | null> {
  if (opts.refId?.endsWith(':video')) return null;
  if (opts.url && isVideoMedia(opts.url)) return null;
  if (opts.refId) {
    const byRef = await downloadToDataUrl(
      token,
      `/object-store/view-by-ref?refId=${encodeURIComponent(opts.refId)}`,
    );
    if (byRef) return byRef;
  }
  if (opts.url?.trim()) {
    return downloadToDataUrl(
      token,
      `/object-store/view-by-url?url=${encodeURIComponent(opts.url.trim())}`,
    );
  }
  return null;
}

async function loadBdaLogoSrc(): Promise<string | null> {
  const toDataUrl = async (uri: string) => {
    const path = uri.startsWith('file://') ? uri : uri.startsWith('/') ? uri : `file://${uri}`;
    const base64 = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  };

  let sourceUri: string | null = null;
  try {
    const asset = Asset.fromModule(BDA_LOGO);
    await asset.downloadAsync();
    sourceUri = asset.localUri ?? asset.uri ?? null;
  } catch {
    /* try resolveAssetSource */
  }

  if (!sourceUri) {
    try {
      sourceUri = Image.resolveAssetSource(BDA_LOGO)?.uri ?? null;
    } catch {
      /* ignore */
    }
  }

  if (!sourceUri) return null;

  try {
    return await toDataUrl(sourceUri);
  } catch {
    const cachePath = `${FileSystem.cacheDirectory}bda-logo-pdf.png`;
    try {
      await FileSystem.copyAsync({ from: sourceUri, to: cachePath });
      return cachePath;
    } catch {
      return null;
    }
  }
}

function formRowPair(a: [string, string], b?: [string, string]) {
  if (b) {
    return `<tr>
      <td class="fl">${escapeHtml(a[0])}</td><td class="fv">${a[1]}</td>
      <td class="fl">${escapeHtml(b[0])}</td><td class="fv">${b[1]}</td>
    </tr>`;
  }
  return `<tr><td class="fl">${escapeHtml(a[0])}</td><td class="fv" colspan="3">${a[1]}</td></tr>`;
}

function pdfHeaderTable(app: MobileApplication, logoSrc: string | null) {
  const logoCell = logoSrc
    ? `<img src="${logoSrc}" width="44" height="44" style="display:block;border-radius:22px;" alt="BDA" />`
    : `<div style="width:44px;height:44px;border-radius:22px;background:#fff;color:#2563eb;font-weight:bold;font-size:11px;line-height:44px;text-align:center;">BDA</div>`;

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;">
      <tr>
        <td style="background-color:#2563eb;padding:12px 16px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="54" valign="middle">${logoCell}</td>
              <td valign="middle" style="padding-left:10px;">
                <div style="color:#dbeafe;font-size:9px;font-weight:bold;letter-spacing:0.1em;">BDA</div>
                <div style="color:#ffffff;font-size:18px;font-weight:bold;line-height:1.15;">CDRMS</div>
                <div style="color:#e0e7ff;font-size:9px;">Official officer portal</div>
              </td>
              <td valign="middle" align="right">
                <div style="color:#dbeafe;font-size:9px;font-weight:bold;">Correct Dimension Report</div>
                <div style="color:#ffffff;font-size:13px;font-weight:bold;">${escapeHtml(app.applicationNumber)}</div>
                <div style="color:#e0e7ff;font-size:9px;">${escapeHtml(applicationStatusLabel(app.status))}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function cardOpen(title: string) {
  return `<table width="100%" cellspacing="0" cellpadding="0" class="card"><tr><td class="card-title">${escapeHtml(title)}</td></tr><tr><td class="card-body"><table width="100%" cellspacing="0" cellpadding="0" class="form">`;
}

function cardClose() {
  return `</table></td></tr></table>`;
}

function zcFormTable(app: MobileApplication, engineer: string, address: string) {
  return `
    ${cardOpen('ZC application details')}
      ${formRowPair(['Application no', fmt(app.applicationNumber)], ['Status', fmt(applicationStatusLabel(app.status))])}
      ${formRowPair(['Site no', fmt(app.siteNo)], ['Site type', fmt(app.siteDimensionType)])}
      ${formRowPair(['Site dimension', fmt(app.siteDimension)], ['Zone', fmt(`${app.zoneCode} (#${app.zoneId})`)])}
      ${formRowPair(['Area', fmt(app.addressArea)], ['Block', fmt(app.addressBlock)])}
      ${formRowPair(['Pincode', fmt(app.addressPincode)], ['Created by ZC', fmt(app.createdByZcName)])}
      ${formRowPair(['Assigned engineer', fmt(engineer)], ['Assigned CAO', fmt(app.assignedCaoName)])}
      ${formRowPair(['Address', fmt(address || '—')])}
      ${formRowPair(['ZC comments', fmt(app.siteDimensionComment)])}
    ${cardClose()}

    ${cardOpen('Site Schedules')}
      ${formRowPair(['Schedule N', fmt(app.scheduleNorth)], ['Schedule S', fmt(app.scheduleSouth)])}
      ${formRowPair(['Schedule W', fmt(app.scheduleWest)], ['Schedule E', fmt(app.scheduleEast)])}
    ${cardClose()}
  `;
}

function diagramBlock(plotMarkup: string | null) {
  if (!plotMarkup) return '';
  const svgRaw = plotMarkup.match(/<svg[\s\S]*?<\/svg>/i)?.[0];
  if (!svgRaw) return '';
  const svg = svgRaw.replace(/height="340"/, 'height="200"');
  const footer = plotMarkup.match(/<div class="plot-footer"[\s\S]*?<\/div>/i)?.[0] ?? '';
  return `
    ${cardOpen('Site dimensions')}
      <tr><td align="center" style="padding:8px;background:#fafbfc;">
        ${svg}
        ${footer}
      </td></tr>
    ${cardClose()}
  `;
}

function engineerBlock(app: MobileApplication) {
  return `
    ${cardOpen('Engineer — site details')}
      ${formRowPair(['Site verification', fmt(app.engineerSiteDetails)])}
      ${formRowPair(['Compass', fmt(app.compass)], ['Occupancy', fmt(app.occupancy)])}
      ${formRowPair(['Occupancy reason', fmt(app.occupancyReason)])}
      ${formRowPair(['Submitted on', fmt(formatDateTime(app.engineerSubmittedAt))])}
      ${formRowPair(['Engineer comments', fmt(app.engineerComments)])}
    ${cardClose()}

    ${cardOpen('Dimensions')}
      ${formRowPair(['Dim North', fmt(app.dimNorth)], ['Dim South', fmt(app.dimSouth)])}
      ${formRowPair(['Dim East', fmt(app.dimEast)], ['Dim West', fmt(app.dimWest)])}
      ${formRowPair(['Total site area', fmt(app.totalSiteArea)])}
    ${cardClose()}
  `;
}

function photoCellHtml(
  p: PhotoEntry & { dataUrl: string | null },
  widthPx: number,
  maxH: number,
) {
  const title = p.label.replace(' photo', '');
  return `<td valign="top" align="left" style="width:${widthPx}px;padding:0 2px 4px 0;">
    <div style="font-size:9px;font-weight:bold;margin-bottom:2px;color:#0f172a;">${escapeHtml(title)}</div>
    ${
      p.dataUrl
        ? `<img src="${p.dataUrl}" style="display:block;width:${widthPx}px;max-width:100%;height:auto;max-height:${maxH}px;object-fit:contain;" alt="${escapeHtml(title)}" />`
        : `<div style="color:#64748b;font-size:9px;padding:4px 0;">—</div>`
    }
  </td>`;
}

function photosTable(photos: Array<PhotoEntry & { dataUrl: string | null }>) {
  if (photos.length === 0) return '';

  const colW = 96
  const selfieW = colW * 2 + 4
  const selfie = photos.find((p) => p.label === 'Selfie') ?? null;
  const cardinalOrder = ['North photo', 'South photo', 'East photo', 'West photo'] as const;
  const cardinal = cardinalOrder.map((label) => photos.find((p) => p.label === label) ?? null);
  const site = photos.filter((p) => p.label.startsWith('Site photo'));

  let body = '';

  if (selfie) {
    body += `<table cellpadding="0" cellspacing="0" style="margin-bottom:4px;width:auto;">
      <tr>${photoCellHtml(selfie, selfieW, 140)}</tr>
    </table>`;
  }

  if (cardinal.some(Boolean)) {
    body += `<table cellpadding="0" cellspacing="0" style="margin-bottom:4px;width:auto;border-collapse:collapse;">
      <tr>${cardinal.map((p) => (p ? photoCellHtml(p, colW, 110) : `<td style="width:${colW}px;"></td>`)).join('')}</tr>
    </table>`;
  }

  for (let i = 0; i < site.length; i += 4) {
    const chunk = site.slice(i, i + 4);
    body += `<table cellpadding="0" cellspacing="0" style="margin-bottom:4px;width:auto;">
      <tr>${chunk.map((p) => photoCellHtml(p, colW, 90)).join('')}</tr>
    </table>`;
  }

  return `
    ${cardOpen('Photos')}
      ${body}
    ${cardClose()}
  `;
}

type LoadedPhoto = PhotoEntry & { dataUrl: string | null };

async function buildHtml(app: MobileApplication, token: string) {
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');
  const engineer = [app.assignedEngineerName || 'Engineer', app.assignedEngineerLoginId]
    .filter(Boolean)
    .join(' · ');
  const logoDataUrl = await loadBdaLogoSrc();
  const plotMarkup = buildSiteDimensionPlotSvgFromApp(app);
  const photos = collectPhotos(app);
  const loadedPhotos = await Promise.all(
    photos.map(async (p): Promise<LoadedPhoto> => ({
      ...p,
      dataUrl: await loadImageDataUrl(token, { url: p.url, refId: p.refId }),
    })),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(app.applicationNumber)} CDR</title>
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .content { padding: 0 14px 14px; }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      background: #fff;
    }
    .card-title {
      background: #eff6ff;
      color: #2563eb;
      font-size: 12px;
      font-weight: bold;
      padding: 8px 10px;
      border-bottom: 1px solid #dbeafe;
    }
    .card-body { padding: 0; }
    .form { border-collapse: collapse; }
    .form td { border-top: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: top; }
    .form tr:first-child td { border-top: none; }
    .fl { width: 22%; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 9px; }
    .fv { width: 28%; color: #0f172a; font-size: 10px; font-weight: 700; }
    .plot-footer { text-align: center; margin-top: 6px; }
    .plot-tag {
      display: inline-block; margin: 0 3px 4px; padding: 3px 8px;
      border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9px; background: #fff;
    }
    .plot-area {
      margin-top: 4px; padding: 6px 8px; border-radius: 8px;
      background: #fffbeb; border: 1px solid #fde68a; font-size: 11px; font-weight: bold; color: #92400e;
    }
  </style>
</head>
<body>
  ${pdfHeaderTable(app, logoDataUrl)}
  <div class="content">
  ${zcFormTable(app, engineer, address)}
  ${diagramBlock(plotMarkup)}
  ${engineerBlock(app)}
  ${photosTable(loadedPhotos)}
  </div>
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

async function getAndroidDownloadsDirectory(): Promise<string> {
  const cached = await SecureStore.getItemAsync(PDF_DOWNLOADS_DIR_KEY);
  if (cached) return cached;
  const initialUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
  if (!permission.granted || !permission.directoryUri) {
    throw new Error('Allow access to Downloads folder to save the PDF');
  }
  await SecureStore.setItemAsync(PDF_DOWNLOADS_DIR_KEY, permission.directoryUri);
  return permission.directoryUri;
}

async function savePdfToDevice(tempUri: string, fileName: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(tempUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (Platform.OS === 'android') {
    try {
      const directoryUri = await getAndroidDownloadsDirectory();
      const destUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        fileName.replace(/\.pdf$/i, ''),
        'application/pdf',
      );
      await StorageAccessFramework.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return destUri;
    } catch {
      /* fall through */
    }
  }

  const dir = `${FileSystem.documentDirectory}CDRMS/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
  return dest;
}

/** Generate and save a CDR application PDF directly on the device. */
export async function downloadApplicationPdf(
  app: MobileApplication,
  token: string,
): Promise<PdfDownloadResult> {
  if (!token?.trim()) throw new Error('Sign in required to download PDF');

  const full = await resolvePdfApplication(app, token);
  const html = await buildHtml(full, token);
  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
    base64: false,
  });

  const fileName = pdfFileName(full);
  const savedPath = await savePdfToDevice(uri, fileName);
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);

  return {
    fileName,
    savedPath,
    message:
      Platform.OS === 'android'
        ? `${fileName} saved to Downloads.`
        : `${fileName} saved on this device.`,
  };
}
