import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { AuthProvider } from '@/src/auth/AuthContext';
import { DeviceCameraHost } from '@/src/cdrms/components/DeviceCameraHost';
import { PdfDownloadBannerHost } from '@/src/cdrms/components/PdfDownloadBannerHost';
import { useCdrmsFonts } from '@/src/cdrms/fonts';
import { COLORS } from '@/src/cdrms/theme';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import '@/global.css';
import { useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaListener,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

export default function App() {
  const [fontsLoaded] = useCdrmsFonts();
  // Keyboard open/close changes bottom inset. Pushing that into Uniwind
  // restyles the tree and remounts TextInputs → keyboard blinks shut on Expo Go.
  const lastInsets = useRef({ top: -1, left: -1, right: -1, bottom: -1 });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.soft,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          const prev = lastInsets.current;
          const frameChanged =
            insets.top !== prev.top ||
            insets.left !== prev.left ||
            insets.right !== prev.right;
          // Ignore bottom-only changes (keyboard).
          if (!frameChanged && prev.top !== -1) return;
          lastInsets.current = {
            top: insets.top,
            left: insets.left,
            right: insets.right,
            bottom: insets.bottom,
          };
          Uniwind.updateInsets(insets);
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GluestackUIProvider mode="light">
            <AuthProvider>
              <ThemeProvider>
                <RootNavigator />
                <PdfDownloadBannerHost />
                <DeviceCameraHost />
              </ThemeProvider>
            </AuthProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
