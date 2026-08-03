import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import {
  applicationStatusLabel,
  fetchApplication,
  type MobileApplication,
} from '@/src/api/applications';
import { API_BASE_URL } from '@/src/api/config';
import { buildSiteDimensionPlotSvg } from '@/src/cdrms/lib/buildSiteDimensionPlotSvg';
import { BDA_LOGO_BASE64 } from './bdaLogoBase64';

/** Persisted Android SAF URI for the user-chosen Downloads (or other) folder. */
const PDF_DOWNLOADS_DIR_KEY = 'cdrms_pdf_downloads_dir';

export type PdfDownloadResult = {
  fileName: string;
  savedPath: string;
  message: string;
  openUri?: string;
};

/** Share a downloaded PDF file on the device using native share sheet */
export async function sharePdfFile(targetUri: string) {
  if (!targetUri) return;
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Linking.openURL(targetUri);
    }
  } catch (err) {
    console.log('Could not share PDF file:', err);
  }
}

export const openPdfFile = sharePdfFile;

function escapeHtml(value: string) {
  return (value || '')
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

function resolveFullMediaDownloadUrl(uri: string): string {
  if (!uri?.trim()) return '';
  const trimmed = uri.trim();
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:')) return trimmed;
  return `${API_BASE_URL}/object-store/view-by-url?url=${encodeURIComponent(trimmed)}`;
}

async function fetchImageAsBase64(url: string, token: string): Promise<string | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;

  if (trimmed.startsWith('file://')) {
    try {
      const b64 = await FileSystem.readAsStringAsync(trimmed, { encoding: 'base64' });
      const mime = trimmed.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${b64}`;
    } catch {
      return null;
    }
  }

  const downloadUrl = resolveFullMediaDownloadUrl(trimmed);
  try {
    const tempFile = `${FileSystem.cacheDirectory}pdf_img_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`;
    const downloadRes = await FileSystem.downloadAsync(downloadUrl, tempFile, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (downloadRes.status >= 200 && downloadRes.status < 300 && downloadRes.uri) {
      const info = await FileSystem.getInfoAsync(downloadRes.uri);
      if (info.exists && 'size' in info && (info.size ?? 0) > 100) {
        const b64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: 'base64' });
        await FileSystem.deleteAsync(downloadRes.uri, { idempotent: true }).catch(() => undefined);
        const mime = trimmed.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b64}`;
      }
    }
  } catch (e) {
    console.log('PDF photo download error for:', downloadUrl, e);
  }
  return null;
}

function cardOpen(title: string) {
  return `<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #cbd5e1;margin:0 0 8px;background:#fff;border-radius:6px;overflow:hidden;">
    <tr><td style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:bold;padding:5px 8px;border-bottom:1px solid #dbeafe;">${escapeHtml(title)}</td></tr>
    <tr><td style="padding:0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">`;
}

function cardClose() {
  return `</table></td></tr></table>`;
}

function formRowPair(a: [string, string], b?: [string, string]) {
  const cellL =
    'width:20%;background:#f8fafc;color:#64748b;font-weight:600;font-size:8.5px;border-top:1px solid #e2e8f0;padding:4px 6px;vertical-align:top;text-transform:uppercase;letter-spacing:0.2px;';
  const cellV =
    'width:30%;color:#0f172a;font-size:9.5px;font-weight:700;border-top:1px solid #e2e8f0;padding:4px 6px;vertical-align:top;';
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
      ${formRowPair(['Schedule N', fmt(app.scheduleNorth)], ['Schedule S', fmt(app.scheduleSouth)])}
      ${formRowPair(['Schedule W', fmt(app.scheduleWest)], ['Schedule E', fmt(app.scheduleEast)])}
      ${formRowPair(['ZC comments', fmt(app.siteDimensionComment)])}
    ${cardClose()}
  `;
}

function engineerBlock(app: MobileApplication) {
  let n = Number(app.dimNorth || app.engineerDimensions?.N) || 0;
  let s = Number(app.dimSouth || app.engineerDimensions?.S) || 0;
  let e = Number(app.dimEast || app.engineerDimensions?.E) || 0;
  let w = Number(app.dimWest || app.engineerDimensions?.W) || 0;

  if ((n <= 0 || e <= 0) && app.siteDimension) {
    const parts = app.siteDimension
      .split(/[*xX×]/)
      .map((p) => Number(p.trim()))
      .filter((v) => !Number.isNaN(v) && v > 0);
    if (parts.length >= 2) {
      if (n <= 0) n = parts[0];
      if (s <= 0) s = parts[0];
      if (e <= 0) e = parts[1];
      if (w <= 0) w = parts[1];
    }
  }

  const svgXml = buildSiteDimensionPlotSvg({
    north: n,
    south: s,
    east: e,
    west: w,
    odd: app.siteDimensionType === 'Odd',
    siteNo: app.siteNo,
    totalArea: Number(app.totalSiteArea) || null,
    scheduleNorth: app.scheduleNorth,
    scheduleSouth: app.scheduleSouth,
    scheduleEast: app.scheduleEast,
    scheduleWest: app.scheduleWest,
    roadNorth: Boolean(app.scheduleRoadFlags?.N),
    roadSouth: Boolean(app.scheduleRoadFlags?.S),
    roadEast: Boolean(app.scheduleRoadFlags?.E),
    roadWest: Boolean(app.scheduleRoadFlags?.W),
  });

  const cleanSvg = svgXml ? svgXml.replace(/<div class="plot-footer">[\s\S]*?<\/div>\s*$/, '') : '';
  const areaSqFt = app.totalSiteArea ? Number(app.totalSiteArea) : null;
  const areaSqM = areaSqFt ? (areaSqFt * 0.092903).toFixed(2) : null;

  const sectionSubHeader = (title: string) => `
    <tr>
      <td colspan="4" style="background:#eff6ff;color:#1d4ed8;font-size:9px;font-weight:bold;padding:4px 6px;border-top:1px solid #cbd5e1;border-bottom:1px solid #dbeafe;text-transform:uppercase;letter-spacing:0.4px;">
        ${escapeHtml(title)}
      </td>
    </tr>
  `;

  const dimSideBySideHtml = `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;">
      <tr>
        <td style="width:44%;vertical-align:middle;text-align:center;padding:6px;border-right:1px solid #e2e8f0;background:#ffffff;">
          ${
            cleanSvg
              ? `<div style="max-width:210px;margin:0 auto;">${cleanSvg}</div>`
              : '<div style="font-size:9px;color:#94a3b8;font-style:italic;">No plot diagram</div>'
          }
        </td>
        <td style="width:56%;vertical-align:top;padding:0;background:#ffffff;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${formRowPair(['Site dimension', fmt(app.siteDimension)], ['Total area', fmt(app.totalSiteArea ? `${app.totalSiteArea} Sq.Ft` : null)])}
            ${formRowPair(['Dim North', fmt(n || app.dimNorth)], ['Dim South', fmt(s || app.dimSouth)])}
            ${formRowPair(['Dim East', fmt(e || app.dimEast)], ['Dim West', fmt(w || app.dimWest)])}
          </table>
          ${
            areaSqFt
              ? `
            <div style="margin:5px 6px;padding:4px 6px;background:#fefce8;border:1px solid #fef08a;border-radius:4px;color:#854d0e;font-size:8.5px;font-weight:bold;text-align:center;">
              TOTAL AREA: ${areaSqFt.toFixed(2)} Sq. Ft ${areaSqM ? `(${areaSqM} Sq. M)` : ''}
            </div>
          `
              : ''
          }
          <div style="margin:5px 6px;padding:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;">
            <div style="font-size:8px;font-weight:bold;color:#475569;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:2px;">
              Boundary &amp; Schedule Overview
            </div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:8.5px;">
              <tr>
                <td style="padding:2px 4px;color:#64748b;font-weight:600;width:20%;">North:</td>
                <td style="padding:2px 4px;color:#0f172a;font-weight:700;width:30%;">${fmt(scheduleNoteLine(app, 'N'))}</td>
                <td style="padding:2px 4px;color:#64748b;font-weight:600;width:20%;">South:</td>
                <td style="padding:2px 4px;color:#0f172a;font-weight:700;width:30%;">${fmt(scheduleNoteLine(app, 'S'))}</td>
              </tr>
              <tr>
                <td style="padding:2px 4px;color:#64748b;font-weight:600;">East:</td>
                <td style="padding:2px 4px;color:#0f172a;font-weight:700;">${fmt(scheduleNoteLine(app, 'E'))}</td>
                <td style="padding:2px 4px;color:#64748b;font-weight:600;">West:</td>
                <td style="padding:2px 4px;color:#0f172a;font-weight:700;">${fmt(scheduleNoteLine(app, 'W'))}</td>
              </tr>
            </table>
            <div style="margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0;font-size:8px;color:#64748b;display:flex;justify-content:space-between;">
              <span><strong>Type:</strong> ${escapeHtml(app.siteDimensionType || 'Even')}</span>
              <span><strong>Site:</strong> #${escapeHtml(app.siteNo || '—')}</span>
              <span><strong>Zone:</strong> ${escapeHtml(app.zoneCode || '—')}</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;

  return `
    ${cardOpen('Engineer details')}
      ${formRowPair(['Assigned engineer', fmt(app.assignedEngineerName)], ['Engineer submitted', fmt(formatDateTime(app.engineerSubmittedAt))])}
      ${formRowPair(['Site verification', fmt(app.engineerSiteDetails)])}

      ${sectionSubHeader('Schedules')}
      ${formRowPair(
        ['Schedule N', fmt(scheduleNoteLine(app, 'N'))],
        ['Schedule S', fmt(scheduleNoteLine(app, 'S'))],
      )}
      ${formRowPair(
        ['Schedule W', fmt(scheduleNoteLine(app, 'W'))],
        ['Schedule E', fmt(scheduleNoteLine(app, 'E'))],
      )}

      ${sectionSubHeader('Compass & GPS')}
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

      ${sectionSubHeader('Site Dimensions & Plot Diagram')}
      <tr>
        <td colspan="4" style="padding:0;background:#ffffff;border-top:1px solid #e2e8f0;">
          ${dimSideBySideHtml}
        </td>
      </tr>

      ${sectionSubHeader('Field Remarks')}
      ${formRowPair(['Engineer comments', fmt(app.engineerComments)])}
    ${cardClose()}
  `;
}

async function photosMediaBlock(app: MobileApplication, token: string): Promise<string> {
  type PhotoEntry = { label: string; url: string };
  const rawEntries: PhotoEntry[] = [];

  if (app.selfieUrl?.trim() && !isVideoMedia(app.selfieUrl)) {
    rawEntries.push({ label: 'Engineer Live Selfie', url: app.selfieUrl.trim() });
  }

  const raw = app.schedulePhotoUrls ?? {};
  const schedule = {
    N: raw.N || raw.n || '',
    S: raw.S || raw.s || '',
    E: raw.E || raw.e || '',
    W: raw.W || raw.w || '',
  };

  if (schedule.N?.trim() && !isVideoMedia(schedule.N)) {
    rawEntries.push({ label: 'North Boundary Photo', url: schedule.N.trim() });
  }
  if (schedule.S?.trim() && !isVideoMedia(schedule.S)) {
    rawEntries.push({ label: 'South Boundary Photo', url: schedule.S.trim() });
  }
  if (schedule.E?.trim() && !isVideoMedia(schedule.E)) {
    rawEntries.push({ label: 'East Boundary Photo', url: schedule.E.trim() });
  }
  if (schedule.W?.trim() && !isVideoMedia(schedule.W)) {
    rawEntries.push({ label: 'West Boundary Photo', url: schedule.W.trim() });
  }

  (app.photoUrls ?? []).forEach((u, i) => {
    if (u?.trim() && !isVideoMedia(u)) {
      rawEntries.push({ label: `Site Photo ${i + 1}`, url: u.trim() });
    }
  });

  const hasVideo = Boolean(app.videoUrl?.trim());
  if (rawEntries.length === 0 && !hasVideo) return '';

  const resolvedPhotos: { label: string; b64: string }[] = [];
  for (const entry of rawEntries) {
    const b64 = await fetchImageAsBase64(entry.url, token);
    if (b64) {
      resolvedPhotos.push({ label: entry.label, b64 });
    }
  }

  let html = `
    <div style="page-break-before:always !important;break-before:page !important;margin-top:10px;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;background:#ffffff;">
      <div style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:bold;padding:6px 10px;border-bottom:1px solid #dbeafe;">
        Site Photos &amp; Field Media (${resolvedPhotos.length} photos)
      </div>
      <div style="padding:6px;">
  `;

  if (resolvedPhotos.length > 0) {
    html += `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">`;
    for (let i = 0; i < resolvedPhotos.length; i += 2) {
      const p1 = resolvedPhotos[i];
      const p2 = resolvedPhotos[i + 1];
      html += `<tr>`;
      html += `
        <td style="width:50%;padding:4px;vertical-align:top;">
          <div style="border:1px solid #e2e8f0;border-radius:5px;padding:4px;background:#f8fafc;text-align:center;">
            <img src="${p1.b64}" style="max-width:100%;height:140px;object-fit:cover;border-radius:4px;display:block;margin:0 auto;" alt="${escapeHtml(p1.label)}" />
            <div style="font-size:8.5px;font-weight:bold;color:#334155;margin-top:4px;">${escapeHtml(p1.label)}</div>
          </div>
        </td>
      `;
      if (p2) {
        html += `
          <td style="width:50%;padding:4px;vertical-align:top;">
            <div style="border:1px solid #e2e8f0;border-radius:5px;padding:4px;background:#f8fafc;text-align:center;">
              <img src="${p2.b64}" style="max-width:100%;height:140px;object-fit:cover;border-radius:4px;display:block;margin:0 auto;" alt="${escapeHtml(p2.label)}" />
              <div style="font-size:8.5px;font-weight:bold;color:#334155;margin-top:4px;">${escapeHtml(p2.label)}</div>
            </div>
          </td>
        `;
      } else {
        html += `<td style="width:50%;padding:4px;"></td>`;
      }
      html += `</tr>`;
    }
    html += `</table>`;
  }

  if (hasVideo) {
    html += `
      <div style="margin-top:6px;padding:5px 8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;color:#15803d;font-size:9px;font-weight:bold;">
        ✓ Site Walk-Through Video Recorded
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

async function buildHtml(app: MobileApplication, token: string): Promise<string> {
  const address = [app.addressArea, app.addressBlock, app.addressPincode]
    .filter(Boolean)
    .join(', ');
  const engineer = [app.assignedEngineerName || 'Engineer', app.assignedEngineerLoginId]
    .filter(Boolean)
    .join(' · ');

  const mediaHtml = await photosMediaBlock(app, token);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(app.applicationNumber)} CDR Report</title>
  <style>
    @page {
      size: A4;
      margin: 8mm;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 9px;
      line-height: 1.3;
      background: #ffffff;
    }
  </style>
</head>
<body style="margin:0;padding:8px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:9px;line-height:1.3;background:#ffffff;">

  <!-- Header Banner with BDA Logo -->
  <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;background:#0256d0;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="padding:8px 10px;vertical-align:middle;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="width:40px;vertical-align:middle;">
              <div style="width:36px;height:36px;border-radius:18px;background:#ffffff;display:flex;align-items:center;justify-content:center;padding:2px;box-sizing:border-box;">
                <img src="${BDA_LOGO_BASE64}" style="width:30px;height:30px;object-fit:contain;" alt="BDA Logo" />
              </div>
            </td>
            <td style="vertical-align:middle;padding-left:8px;">
              <div style="color:#93c5fd;font-size:8px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">BANGALORE DEVELOPMENT AUTHORITY</div>
              <div style="color:#ffffff;font-size:15px;font-weight:bold;line-height:18px;">CDRMS SITE SURVEY REPORT</div>
              <div style="color:#e0e7ff;font-size:9px;margin-top:1px;">Ministry of Public Works · </div>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <div style="background:#ffffff;color:#0256d0;font-size:9.5px;font-weight:bold;padding:3px 8px;border-radius:14px;display:inline-block;">
                ${escapeHtml(app.applicationNumber)}
              </div>
              <div style="color:#dbeafe;font-size:8.5px;font-weight:bold;margin-top:2px;">
                Status: ${escapeHtml(applicationStatusLabel(app.status))}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  ${zcFormTable(app, engineer, address)}
  ${engineerBlock(app)}
  ${mediaHtml}

  <div style="margin-top:8px;padding-top:4px;border-top:1px solid #cbd5e1;color:#64748b;font-size:8px;text-align:center;">
    Generated by CDRMS Mobile Portal · Bangalore Development Authority · ${escapeHtml(new Date().toLocaleString())}
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

/** Direct download without opening system share sheet drawer */
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

  if (publicPath) {
    return {
      savedPath: publicPath,
      openUri: sandboxUri,
      message: `${fileName} downloaded successfully to Downloads folder.`,
    };
  }

  return {
    savedPath: sandboxUri,
    openUri: sandboxUri,
    message: `${fileName} downloaded successfully. Saved in CDRMS / Downloads folder.`,
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
  const fileName = pdfFileName(full);

  const html = await buildHtml(full, token);
  const { uri } = await Print.printToFileAsync({ html });

  if (!uri) throw new Error('PDF engine returned no file');

  const size = await assertPdfFile(uri);
  if (size < 500) {
    throw new Error('PDF looks empty. Please try Download again.');
  }

  const result = await savePdfToDevice(uri, fileName);
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);

  return {
    fileName,
    savedPath: result.savedPath,
    openUri: result.openUri,
    message: result.message,
  };
}
