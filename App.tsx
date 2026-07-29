import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import '@/global.css';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaListener,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

export default function App() {
  // Keyboard open/close changes bottom inset. Pushing that into Uniwind
  // restyles the tree and remounts TextInputs → keyboard blinks shut on Expo Go.
  const lastInsets = useRef({ top: -1, left: -1, right: -1, bottom: -1 });

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
            <RootNavigator />
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
