import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CdrmsApp } from '@/src/cdrms/CdrmsApp';
import type { RootStackParamList } from '@/src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainScreen() {
  return <CdrmsApp />;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
