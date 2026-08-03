import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

/** Open a downloaded PDF with the native app chooser (Drive, Adobe, etc.). */
export async function openPdfWithChooser(targetUri: string): Promise<boolean> {
  if (!targetUri?.trim()) return false;
  const uri = targetUri.trim();

  try {
    if (Platform.OS === 'android') {
      const dataUri = uri.startsWith('file://')
        ? await FileSystem.getContentUriAsync(uri)
        : uri;

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: dataUri,
        type: 'application/pdf',
        flags: 1,
      });
      return true;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Open PDF',
        UTI: 'com.adobe.pdf',
      });
      return true;
    }

    await Linking.openURL(uri);
    return true;
  } catch (err) {
    console.log('Could not open PDF:', err);
    return false;
  }
}
