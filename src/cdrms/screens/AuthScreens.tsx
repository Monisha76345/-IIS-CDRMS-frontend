import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Compass,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOut,
  ZoomIn,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from '@/components/ui/checkbox';
import { HStack } from '@/components/ui/hstack';
import { CheckIcon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  AppBtn,
  AppCard,
  AppHeader,
  Field,
  GradientHeader,
  IconBox,
  ScreenShell,
  StatusChip,
} from '@/src/cdrms/components/primitives';
import { KarnatakaMap } from '@/src/cdrms/components/KarnatakaMap';
import { KARNATAKA } from '@/src/cdrms/location';
import {
  ensureForegroundLocationPermission,
  hasForegroundLocationPermission,
} from '@/src/cdrms/locationPermission';
import {
  COLORS,
  GRADIENT_HEADER,
} from '@/src/cdrms/theme';
import { TERMS } from '@/src/cdrms/terminology';
import type { Go } from '@/src/cdrms/types';
import { useAuth } from '@/src/auth/AuthContext';
import { ApiError } from '@/src/api/client';
import { homeScreenForRole } from '@/src/auth/roles';

const SPLASH_HOLD_MS = 3200;
const OTP_LENGTH = 6;
const OTP_TTL_SEC = 60;

export function SplashScreen({ go }: { go: Go }) {
  const insets = useSafeAreaInsets();

  const logoScale = useSharedValue(0.55);
  const logoOpacity = useSharedValue(0);
  const ring = useSharedValue(0);
  const progress = useSharedValue(0);
  const orbDrift = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.85 });

    ring.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    orbDrift.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    progress.value = withDelay(
      700,
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
    );

    const leave = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(go)('login');
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(leave);
  }, [go, logoOpacity, logoScale, orbDrift, progress, ring, screenOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.15, 1], [0.55, 0.35, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [1, 1.55]) }],
  }));

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orbDrift.value, [0, 1], [0, 18]) },
      { translateY: interpolate(orbDrift.value, [0, 1], [0, -14]) },
    ],
  }));

  const orbBStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orbDrift.value, [0, 1], [0, -16]) },
      { translateY: interpolate(orbDrift.value, [0, 1], [0, 12]) },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [12, 180]),
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <ScreenShell>
      <Animated.View style={[{ flex: 1 }, screenStyle]}>
        <LinearGradient
          colors={[...GRADIENT_HEADER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <Box className="flex-1 items-center justify-center px-6">
            {/* Orbs clipped in their own layer so title text is never cut off */}
            <Box
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}
            >
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: -90,
                    right: -80,
                    width: 280,
                    height: 280,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  },
                  orbAStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    bottom: -110,
                    left: -70,
                    width: 300,
                    height: 300,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  orbBStyle,
                ]}
              />
              <Box
                style={{
                  position: 'absolute',
                  alignSelf: 'center',
                  top: '32%',
                  width: 220,
                  height: 220,
                  marginTop: -110,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              />
            </Box>

            <Box className="relative items-center justify-center" style={{ width: 112, height: 112 }}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 112,
                    height: 112,
                    borderRadius: 32,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.45)',
                  },
                  ringStyle,
                ]}
              />
              <Animated.View style={logoStyle}>
                <Box
                  className="items-center justify-center overflow-hidden"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 28,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Image
                    source={require('../../../assets/bda-logo.png')}
                    style={{ width: 88, height: 88 }}
                    resizeMode="contain"
                    accessibilityLabel="BDA"
                  />
                </Box>
              </Animated.View>
            </Box>

            <Animated.View
              entering={FadeIn.delay(380).duration(520)}
              style={{ marginTop: 28, paddingHorizontal: 8 }}
            >
              <Text
                className="text-center font-extrabold text-white"
                style={{
                  fontSize: 36,
                  lineHeight: 44,
                  letterSpacing: 2,
                  includeFontPadding: false,
                }}
              >
                {TERMS.app.shortName}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(560).duration(520)}>
              <Text className="mt-2 text-sm text-white/88 font-medium text-center px-4">
                {TERMS.app.tagline}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(760).duration(500)}>
              <Text className="mt-2 text-[11px] text-white/60 text-center tracking-wide">
                {TERMS.app.department}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(900).duration(500)}
              style={{ position: 'absolute', bottom: 36, left: 28, right: 28, alignItems: 'center' }}
            >
              <Box
                className="overflow-hidden"
                style={{
                  height: 4,
                  width: '100%',
                  maxWidth: 180,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                }}
              >
                <Animated.View
                  style={[
                    {
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: '#FFFFFF',
                    },
                    progressStyle,
                  ]}
                />
              </Box>
              <Text className="mt-3 text-[11px] text-white/65">v 4.2.1 · Engineer Build</Text>
            </Animated.View>
          </Box>
        </LinearGradient>
      </Animated.View>
    </ScreenShell>
  );
}

export function LoginScreen({ go }: { go: Go }) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSecureLogin() {
    setError('');
    if (!loginId.trim() || !password.trim()) {
      setError('Enter Login ID / email and password');
      return;
    }
    setLoading(true);
    try {
      await login(loginId, password);
      go('permission');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Unable to reach API. Set EXPO_PUBLIC_API_URL to your machine IP.';
      setError(msg);
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flexGrow: 1 }}>
            <GradientHeader rounded>
              <Box className="px-6 pb-10">
                <HStack className="items-center justify-between pt-2">
                  <Box className="h-12 w-12 rounded-2xl bg-white border border-white/25 items-center justify-center overflow-hidden">
                    <Image
                      source={require('../../../assets/bda-logo.png')}
                      style={{ width: 42, height: 42 }}
                      resizeMode="contain"
                      accessibilityLabel="BDA"
                    />
                  </Box>
                  <Pressable className="bg-white/15 px-3 py-2 rounded-full border border-white/20">
                    <Text className="text-xs font-semibold text-white">Need Help?</Text>
                  </Pressable>
                </HStack>

                <VStack className="mt-8" space="xs">
                  <Text className="text-3xl font-extrabold leading-tight text-white">
                    Welcome back
                  </Text>
                  <Text className="mt-2 text-sm text-white/85">
                    Sign in with your CDRMS Login ID to continue.
                  </Text>
                </VStack>

                <HStack className="mt-6 items-center gap-3">
                  <Box className="h-16 w-16 rounded-2xl bg-white/15 border border-white/25 items-center justify-center">
                    <MapPinned size={32} color={COLORS.white} />
                  </Box>
                  <VStack>
                    <Text className="text-xs font-semibold text-white">
                      CDRMS Mobile
                    </Text>
                    <Text className="text-xs text-white/80">
                      Secure Government Access · TLS 1.3
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </GradientHeader>

            <Box className="flex-1 -mt-6 px-5 pb-8">
              <AppCard>
                <VStack space="md">
                  <Field
                    label="Login ID / Email"
                    icon={User}
                    value={loginId}
                    onChangeText={setLoginId}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    placeholder="Enter login ID or email"
                    showCheck={false}
                  />
                  <Field
                    label="Password"
                    icon={Lock}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    importantForAutofill="no"
                    passwordRules=""
                    placeholder="Enter password"
                    showCheck={false}
                    endAdornment={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="#64748B" />
                        ) : (
                          <Eye size={18} color="#64748B" />
                        )}
                      </Pressable>
                    }
                  />

                  {error ? (
                    <Text className="text-sm text-red-600">{error}</Text>
                  ) : null}

                  <Checkbox
                    value="remember"
                    isChecked={remember}
                    onChange={(v) => setRemember(!!v)}
                    className="mt-1"
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel className="text-sm text-muted-foreground">
                      Remember this device
                    </CheckboxLabel>
                  </Checkbox>

                  <AppBtn onPress={onSecureLogin} icon={Lock} disabled={loading}>
                    {loading ? 'Signing in…' : 'Secure Login'}
                  </AppBtn>
                </VStack>
              </AppCard>

              <HStack className="mt-4 items-center justify-between">
                <Pressable>
                  <Text className="text-sm text-primary font-semibold">Forgot Login ID?</Text>
                </Pressable>
                <Pressable>
                  <Text className="text-sm text-muted-foreground font-medium">Contact Admin</Text>
                </Pressable>
              </HStack>

              <Text className="text-center text-[11px] text-muted-foreground mt-8">
                {TERMS.app.copyright} · {TERMS.app.version}
              </Text>
            </Box>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </ScreenShell>
  );
}

function OtpDigitBox({
  value,
  index,
  focused,
  success,
  onChangeText,
  onKeyPress,
  onFocus,
  inputRef,
}: {
  value: string;
  index: number;
  focused: boolean;
  success: boolean;
  onChangeText: (v: string) => void;
  onKeyPress: (key: string) => void;
  onFocus: () => void;
  inputRef: (el: TextInput | null) => void;
}) {
  const scale = useSharedValue(1);
  const filled = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    filled.value = withTiming(value ? 1 : 0, { duration: 180 });
    if (value) {
      scale.value = withSequence(
        withSpring(1.12, { damping: 10, stiffness: 320 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      );
    }
  }, [value, filled, scale]);

  useEffect(() => {
    if (focused && !success) {
      scale.value = withSpring(1.06, { damping: 16, stiffness: 260 });
    } else if (!value) {
      scale.value = withSpring(1, { damping: 16, stiffness: 220 });
    }
  }, [focused, success, value, scale]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      filled.value,
      [0, 1],
      [focused ? '#EFF6FF' : '#F4F5F9', '#FFFFFF']
    ),
    borderColor: interpolateColor(
      filled.value,
      [0, 1],
      [focused ? COLORS.primary : '#E4E7EF', COLORS.primary]
    ),
    shadowOpacity: interpolate(filled.value, [0, 1], [0, 0.14]),
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 55)
        .duration(380)
        .springify()
        .damping(16)}
    >
      <Animated.View
        style={[
          {
            height: 58,
            width: 48,
            borderRadius: 16,
            borderWidth: 1.5,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 10,
            elevation: value ? 3 : 0,
            overflow: 'hidden',
          },
          boxStyle,
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key)}
          onFocus={onFocus}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={OTP_LENGTH}
          selectTextOnFocus
          editable={!success}
          showSoftInputOnFocus
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '800',
            color: '#0F172A',
            padding: 0,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function OtpScreen({ go }: { go: Go }) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focused, setFocused] = useState(0);
  const [seconds, setSeconds] = useState(OTP_TTL_SEC);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const refs = useRef<Array<TextInput | null>>([]);

  const iconFloat = useSharedValue(0);
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);
  const timerProgress = useSharedValue(1);
  const timerTrackW = useSharedValue(0);
  const btnReady = useSharedValue(0);
  const successPop = useSharedValue(0);

  useEffect(() => {
    iconFloat.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    ringA.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    ringB.value = withDelay(
      700,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  }, [iconFloat, ringA, ringB]);

  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 480);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (seconds <= 0 || success) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, success]);

  useEffect(() => {
    timerProgress.value = withTiming(Math.max(seconds / OTP_TTL_SEC, 0), {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [seconds, timerProgress]);

  const filled = otp.every(Boolean);

  useEffect(() => {
    btnReady.value = withSpring(filled && !success ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [filled, success, btnReady]);

  useEffect(() => {
    if (!success) return;
    successPop.value = withSpring(1, { damping: 12, stiffness: 160 });
  }, [success, successPop]);

  const applyDigits = useCallback((raw: string, startIndex = 0) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH - startIndex);
    if (!digits) return;
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < digits.length; i++) {
        next[startIndex + i] = digits[i];
      }
      return next;
    });
    const nextFocus = Math.min(startIndex + digits.length, OTP_LENGTH - 1);
    refs.current[nextFocus]?.focus();
    setFocused(nextFocus);
  }, []);

  const setDigit = (i: number, v: string) => {
    if (v.length > 1) {
      applyDigits(v, i);
      return;
    }
    const val = v.replace(/\D/g, '').slice(0, 1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
    if (val && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus();
      setFocused(i + 1);
    }
  };

  const onKeyPress = (i: number, key: string) => {
    if (key !== 'Backspace') return;
    if (otp[i]) {
      setOtp((prev) => {
        const next = [...prev];
        next[i] = '';
        return next;
      });
      return;
    }
    if (i > 0) {
      refs.current[i - 1]?.focus();
      setFocused(i - 1);
      setOtp((prev) => {
        const next = [...prev];
        next[i - 1] = '';
        return next;
      });
    }
  };

  const verify = async () => {
    if (verifying || success) return;
    setVerifying(true);
    setSuccess(true);
    Keyboard.dismiss();
    setTimeout(() => go('permission'), 1250);
  };

  const resend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setSeconds(OTP_TTL_SEC);
    setFocused(0);
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  const timerUrgent = seconds > 0 && seconds <= 10;

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(iconFloat.value, [0, 1], [0, -5]) }],
  }));

  const ringAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringA.value, [0, 0.15, 1], [0.28, 0.18, 0]),
    transform: [{ scale: interpolate(ringA.value, [0, 1], [1, 1.55]) }],
  }));

  const ringBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringB.value, [0, 0.15, 1], [0.22, 0.14, 0]),
    transform: [{ scale: interpolate(ringB.value, [0, 1], [1, 1.75]) }],
  }));

  const timerBarStyle = useAnimatedStyle(() => ({
    width: Math.max(timerProgress.value * timerTrackW.value, 0),
    backgroundColor: interpolateColor(
      timerProgress.value,
      [0, 0.18, 1],
      [COLORS.destructive, COLORS.warning, COLORS.primary]
    ),
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: interpolate(btnReady.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(btnReady.value, [0, 1], [0.97, 1]) }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    opacity: successPop.value,
    transform: [
      { scale: interpolate(successPop.value, [0, 1], [0.72, 1]) },
      { translateY: interpolate(successPop.value, [0, 1], [18, 0]) },
    ],
  }));

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flexGrow: 1 }}>
            <AppHeader
              title="Verify OTP"
              subtitle="Enter the 6-digit code"
              onBack={() => go('login')}
              showLogout={false}
            />

            <Box className="flex-1 -mt-6 px-5 pb-8">
              <Animated.View
                entering={FadeInUp.duration(520).springify().damping(15).stiffness(140)}
              >
                <AppCard className="pt-6">
                  <VStack className="items-center">
                    <Animated.View style={[{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }, iconWrapStyle]}>
                      <Animated.View
                        style={[
                          {
                            position: 'absolute',
                            width: 72,
                            height: 72,
                            borderRadius: 999,
                            borderWidth: 1.5,
                            borderColor: COLORS.primaryGlow,
                          },
                          ringAStyle,
                        ]}
                      />
                      <Animated.View
                        style={[
                          {
                            position: 'absolute',
                            width: 72,
                            height: 72,
                            borderRadius: 999,
                            borderWidth: 1.5,
                            borderColor: COLORS.primary,
                          },
                          ringBStyle,
                        ]}
                      />
                      <LinearGradient
                        colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(37,99,235,0.25)',
                        }}
                      >
                        <Lock size={26} color={COLORS.primaryDeep} strokeWidth={2.3} />
                      </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(180).duration(400)}>
                      <Text className="mt-4 font-extrabold text-[17px] text-foreground text-center tracking-tight">
                        OTP sent to +91 98765 43210
                      </Text>
                      <Text className="mt-1.5 text-sm text-muted-foreground text-center px-3 leading-5">
                        Enter the code to unlock your field session.
                      </Text>
                    </Animated.View>
                  </VStack>

                  <HStack className="mt-7 justify-between">
                    {otp.map((d, i) => (
                      <OtpDigitBox
                        key={i}
                        index={i}
                        value={d}
                        focused={focused === i && !success}
                        success={success}
                        onChangeText={(v) => setDigit(i, v)}
                        onKeyPress={(key) => onKeyPress(i, key)}
                        onFocus={() => setFocused(i)}
                        inputRef={(el) => {
                          refs.current[i] = el;
                        }}
                      />
                    ))}
                  </HStack>

                  <Box
                    className="mt-6 overflow-hidden rounded-full"
                    style={{ height: 5, backgroundColor: '#EFF6FF' }}
                    onLayout={(e) => {
                      timerTrackW.value = e.nativeEvent.layout.width;
                    }}
                  >
                    <Animated.View
                      style={[
                        {
                          height: '100%',
                          borderRadius: 999,
                        },
                        timerBarStyle,
                      ]}
                    />
                  </Box>

                  <HStack className="mt-4 items-center justify-between">
                    <HStack className="items-center gap-2">
                      <Box
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: timerUrgent
                            ? COLORS.warning
                            : seconds <= 0
                              ? COLORS.destructive
                              : COLORS.success,
                        }}
                      />
                      {seconds > 0 ? (
                        <Text className="text-sm text-muted-foreground">
                          Expires in{' '}
                          <Text
                            className="font-extrabold"
                            style={{ color: timerUrgent ? COLORS.warning : '#0F172A' }}
                          >
                            0:{seconds.toString().padStart(2, '0')}
                          </Text>
                        </Text>
                      ) : (
                        <Text className="text-sm font-semibold" style={{ color: COLORS.destructive }}>
                          Code expired
                        </Text>
                      )}
                    </HStack>
                    <Pressable
                      disabled={seconds > 0 || success}
                      onPress={resend}
                      className={`flex-row items-center gap-1.5 px-2 py-1 rounded-lg ${seconds > 0 || success ? 'opacity-35' : 'active:opacity-70'}`}
                    >
                      <RefreshCw size={13} color={COLORS.primary} />
                      <Text className="text-sm text-primary font-bold">Resend</Text>
                    </Pressable>
                  </HStack>
                </AppCard>
              </Animated.View>

              <Box style={{ marginTop: 18, minHeight: 120 }}>
                {success ? (
                  <Animated.View style={successStyle}>
                    <AppCard className="items-center py-8">
                      <Animated.View entering={ZoomIn.springify().damping(12).stiffness(180)}>
                        <LinearGradient
                          colors={['#D1FAE5', '#A7F3D0']}
                          style={{
                            width: 76,
                            height: 76,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={36} color={COLORS.success} strokeWidth={3} />
                        </LinearGradient>
                      </Animated.View>
                      <Text className="mt-4 font-extrabold text-lg text-foreground">
                        Verified Successfully
                      </Text>
                      <Text className="mt-1 text-sm text-muted-foreground">
                        Opening secure session…
                      </Text>
                    </AppCard>
                  </Animated.View>
                ) : (
                  <Animated.View
                    entering={FadeInUp.delay(160).duration(420)}
                    exiting={FadeOut.duration(180)}
                  >
                    <Animated.View style={btnStyle}>
                      <AppBtn disabled={!filled || verifying} onPress={verify} icon={ShieldCheck}>
                        Verify & Continue
                      </AppBtn>
                    </Animated.View>
                  </Animated.View>
                )}
              </Box>

              <Animated.View entering={FadeIn.delay(500).duration(500)}>
                <Text className="text-center text-[11px] text-muted-foreground mt-6">
                  Never share this code · Government secure channel
                </Text>
              </Animated.View>
            </Box>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </ScreenShell>
  );
}

export function PermissionScreen({ go }: { go: Go }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [alreadyGranted, setAlreadyGranted] = useState(false);

  const iconFloat = useSharedValue(0);
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);
  const orbDrift = useSharedValue(0);
  const btnPulse = useSharedValue(0);

  const items = [
    {
      icon: Navigation,
      title: TERMS.permissions.gpsTitle,
      desc: 'Required for accurate survey geo-tagging',
      accent: '#2563EB',
      soft: '#EFF6FF',
    },
    {
      icon: MapPinned,
      title: TERMS.permissions.foregroundTitle,
      desc: TERMS.permissions.foregroundDesc,
      accent: '#3B82F6',
      soft: '#DBEAFE',
    },
    {
      icon: Compass,
      title: TERMS.permissions.backgroundTitle,
      desc: 'Auto check-in when you reach the survey site',
      accent: '#3B82F6',
      soft: '#EFF6FF',
    },
  ] as const;

  useEffect(() => {
    iconFloat.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    ringA.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    ringB.value = withDelay(
      800,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }), -1, false)
    );
    orbDrift.value = withRepeat(
      withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    btnPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [btnPulse, iconFloat, orbDrift, ringA, ringB]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const allowed = await hasForegroundLocationPermission();
      if (alive) setAlreadyGranted(allowed);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enableGps = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (alreadyGranted) {
        go('geo');
        return;
      }
      const granted = await ensureForegroundLocationPermission();
      if (!granted) {
        Alert.alert(
          'Location needed',
          `Allow location access in Settings so ${TERMS.app.shortName} can verify field surveys.`,
          [
            { text: 'Not now', style: 'cancel', onPress: () => go('error') },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings().catch(() => undefined);
              },
            },
          ]
        );
        return;
      }
      go('geo');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not enable GPS';
      Alert.alert('GPS error', message);
    } finally {
      setBusy(false);
    }
  }, [alreadyGranted, busy, go]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(iconFloat.value, [0, 1], [0, -8]) }],
  }));

  const ringAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringA.value, [0, 0.15, 1], [0.4, 0.22, 0]),
    transform: [{ scale: interpolate(ringA.value, [0, 1], [1, 1.7]) }],
  }));

  const ringBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringB.value, [0, 0.15, 1], [0.28, 0.14, 0]),
    transform: [{ scale: interpolate(ringB.value, [0, 1], [1, 2.05]) }],
  }));

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orbDrift.value, [0, 1], [0, 22]) },
      { translateY: interpolate(orbDrift.value, [0, 1], [0, -16]) },
    ],
  }));

  const orbBStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orbDrift.value, [0, 1], [0, -18]) },
      { translateY: interpolate(orbDrift.value, [0, 1], [0, 14]) },
    ],
  }));

  const btnGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(btnPulse.value, [0, 1], [0.22, 0.42]),
    transform: [{ scale: interpolate(btnPulse.value, [0, 1], [1, 1.015]) }],
  }));

  return (
    <ScreenShell>
      <LinearGradient
        colors={['#F7F8FD', '#EFF6FF', '#E8ECF9']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1 }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: -40,
              right: -50,
              width: 220,
              height: 220,
              borderRadius: 999,
              backgroundColor: 'rgba(59,130,246,0.18)',
            },
            orbAStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              bottom: 120,
              left: -70,
              width: 200,
              height: 200,
              borderRadius: 999,
              backgroundColor: 'rgba(37,99,235,0.1)',
            },
            orbBStyle,
          ]}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <VStack className="px-6 items-center">
            <Animated.View entering={FadeInDown.duration(480).springify().damping(16)}>
              <Box
                className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(37,99,235,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(37,99,235,0.18)',
                }}
              >
                <ShieldCheck size={13} color={COLORS.primaryDeep} strokeWidth={2.4} />
                <Text className="text-[11px] font-bold tracking-wide" style={{ color: COLORS.primaryDeep }}>
                  REQUIRED FOR FIELD WORK
                </Text>
              </Box>
            </Animated.View>

            <Animated.View
              entering={ZoomIn.delay(80).duration(520).springify().damping(14)}
              style={{ marginTop: 28 }}
            >
              <Animated.View
                style={[
                  { width: 148, height: 148, alignItems: 'center', justifyContent: 'center' },
                  iconWrapStyle,
                ]}
              >
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 112,
                      height: 112,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: '#6EE7B7',
                    },
                    ringAStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 112,
                      height: 112,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: '#10B981',
                    },
                    ringBStyle,
                  ]}
                />
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5', '#A7F3D0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(16,185,129,0.35)',
                    shadowColor: '#059669',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.28,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
                >
                  <Box
                    className="items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 22,
                      backgroundColor: 'rgba(255,255,255,0.85)',
                      shadowColor: '#059669',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                    }}
                  >
                    <MapPin size={32} color="#059669" strokeWidth={2.3} fill="#D1FAE5" />
                  </Box>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(160).duration(480)} style={{ marginTop: 22 }}>
              <Text className="text-[26px] font-extrabold text-foreground text-center tracking-tight leading-8">
                Enable Location Access
              </Text>
              <Text className="mt-2.5 text-[14px] text-muted-foreground text-center leading-5 px-2">
                {TERMS.app.shortName} needs GPS to verify field surveys and geo-tag dimension reports
                inside your assigned jurisdiction.
              </Text>
            </Animated.View>
          </VStack>

          <VStack className="px-5 mt-8" space="sm">
            {items.map((it, i) => {
              const Icon = it.icon;
              return (
                <Animated.View
                  key={it.title}
                  entering={FadeInRight.delay(220 + i * 90).duration(420).springify().damping(16)}
                >
                  <Box
                    className="overflow-hidden"
                    style={{
                      borderRadius: 20,
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: 'rgba(226,229,240,0.9)',
                      shadowColor: '#2563EB',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.06,
                      shadowRadius: 14,
                      elevation: 2,
                    }}
                  >
                    <HStack className="items-center" style={{ paddingVertical: 14, paddingRight: 14 }}>
                      <Box
                        style={{
                          width: 4,
                          alignSelf: 'stretch',
                          backgroundColor: it.accent,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          marginRight: 14,
                        }}
                      />
                      <Box
                        className="items-center justify-center"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: it.soft,
                        }}
                      >
                        <Icon size={20} color={it.accent} strokeWidth={2.2} />
                      </Box>
                      <VStack className="flex-1 min-w-0 ml-3.5 mr-2">
                        <Text className="font-bold text-[14px] text-foreground tracking-tight">
                          {it.title}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground mt-0.5 leading-4">
                          {it.desc}
                        </Text>
                      </VStack>
                      <Box
                        className="items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          backgroundColor: '#D1FAE5',
                        }}
                      >
                        <Check size={15} color={COLORS.success} strokeWidth={2.8} />
                      </Box>
                    </HStack>
                  </Box>
                </Animated.View>
              );
            })}
          </VStack>

          <Animated.View
            entering={FadeInUp.delay(520).duration(450)}
            style={{ paddingHorizontal: 20, marginTop: 28 }}
          >
            <Animated.View
              style={[
                {
                  borderRadius: 18,
                  shadowColor: '#1D4ED8',
                  shadowOffset: { width: 0, height: 12 },
                  shadowRadius: 18,
                  elevation: 6,
                },
                btnGlowStyle,
              ]}
            >
              <AppBtn onPress={enableGps} icon={Navigation} disabled={busy}>
                {busy ? 'Requesting…' : alreadyGranted ? 'Continue' : 'Enable GPS'}
              </AppBtn>
            </Animated.View>

            <Pressable
              onPress={() => go('error')}
              className="mt-3 py-3.5 items-center active:opacity-60"
            >
              <Text className="text-sm text-muted-foreground font-semibold">Not now</Text>
            </Pressable>

            <HStack className="items-center justify-center gap-2 mt-2 mb-2">
              <Lock size={12} color="#94A3B8" strokeWidth={2.2} />
              <Text className="text-[11px] text-muted-foreground text-center">
                Used only for survey verification · Encrypted
              </Text>
            </HStack>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </ScreenShell>
  );
}

export function GeoScreen({ go }: { go: Go }) {
  const { user } = useAuth();
  const [outside, setOutside] = useState(false);
  const [scanning, setScanning] = useState(true);

  const radar = useSharedValue(0);
  const radar2 = useSharedValue(0);
  const distance = useSharedValue(0.42 / 2.5);
  const distanceTrackW = useSharedValue(0);
  const cardLift = useSharedValue(0);
  const verifyBadge = useSharedValue(0);

  useEffect(() => {
    radar.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    radar2.value = withDelay(
      900,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }), -1, false)
    );
    cardLift.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    const done = setTimeout(() => {
      setScanning(false);
      verifyBadge.value = withSpring(1, { damping: 12, stiffness: 170 });
    }, 1400);

    return () => clearTimeout(done);
  }, [radar, radar2, cardLift, verifyBadge]);

  useEffect(() => {
    const target = outside ? 4.82 / 2.5 : 0.42 / 2.5;
    distance.value = withSpring(Math.min(target, 1.05), { damping: 16, stiffness: 120 });
    verifyBadge.value = withSpring(outside ? 0 : 1, { damping: 12, stiffness: 170 });
  }, [outside, distance, verifyBadge]);

  const radarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(radar.value, [0, 0.2, 1], [0.45, 0.25, 0]),
    transform: [{ scale: interpolate(radar.value, [0, 1], [0.55, 1.9]) }],
  }));

  const radar2Style = useAnimatedStyle(() => ({
    opacity: interpolate(radar2.value, [0, 0.2, 1], [0.35, 0.18, 0]),
    transform: [{ scale: interpolate(radar2.value, [0, 1], [0.55, 2.15]) }],
  }));

  const mapCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(cardLift.value, [0, 1], [0, -3]) }],
  }));

  const distanceBarStyle = useAnimatedStyle(() => ({
    width: Math.min(distance.value, 1) * distanceTrackW.value,
    backgroundColor: interpolateColor(
      distance.value,
      [0.2, 0.7, 1],
      [COLORS.success, COLORS.warning, COLORS.destructive]
    ),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(verifyBadge.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(verifyBadge.value, [0, 1], [0.86, 1]) }],
  }));

  const distanceLabel = outside ? '4.82 km' : '0.42 km';

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title={TERMS.permissions.geoValidation}
          subtitle={scanning ? 'Scanning jurisdiction…' : TERMS.permissions.geoValidationSubtitle}
          onBack={() => go('login')}
          showLogout={false}
        />

        <Box className="flex-1 -mt-6 px-5 pb-10">
          <Animated.View
            entering={FadeInUp.duration(560).springify().damping(14).stiffness(130)}
          >
            <Animated.View style={mapCardStyle}>
              <AppCard className="p-0 overflow-hidden">
                <Box className="p-3">
                  <Box
                    className="relative overflow-hidden"
                    style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: 'rgba(226,229,240,0.95)',
                    }}
                  >
                    <KarnatakaMap
                      height={236}
                      rounded={20}
                      mode="site"
                      showBadge={false}
                      interactive={false}
                      latitude={KARNATAKA.site.latitude}
                      longitude={KARNATAKA.site.longitude}
                      latitudeDelta={0.032}
                    />

                    {/* Soft radar overlay near pin area */}
                    <Box
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        right: '28%',
                        top: '38%',
                        width: 54,
                        height: 54,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                      }}
                    >
                      <Animated.View
                        style={[
                          {
                            position: 'absolute',
                            width: 54,
                            height: 54,
                            borderRadius: 999,
                            borderWidth: 2,
                            borderColor: outside ? COLORS.destructive : '#34D399',
                          },
                          radarStyle,
                        ]}
                      />
                      <Animated.View
                        style={[
                          {
                            position: 'absolute',
                            width: 54,
                            height: 54,
                            borderRadius: 999,
                            borderWidth: 1.5,
                            borderColor: outside ? COLORS.destructive : '#6EE7B7',
                          },
                          radar2Style,
                        ]}
                      />
                      <Box
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          backgroundColor: outside ? COLORS.destructive : '#10B981',
                          borderWidth: 2,
                          borderColor: '#FFFFFF',
                        }}
                      />
                    </Box>

                    <Box
                      className="absolute top-2.5 left-2.5 right-2.5 flex-row items-start justify-between"
                      style={{ zIndex: 5 }}
                      pointerEvents="none"
                    >
                      <Animated.View
                        entering={FadeInRight.delay(220).duration(420)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: 999,
                          backgroundColor: 'rgba(15,23,42,0.86)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 7,
                          maxWidth: '86%',
                        }}
                      >
                        <Box
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: outside ? COLORS.destructive : scanning ? COLORS.warning : '#34D399' }}
                        />
                        <Text className="text-[10px] font-bold text-white" numberOfLines={1}>
                          {outside
                            ? `${KARNATAKA.state} · Outside fence`
                            : scanning
                              ? `${KARNATAKA.state} · Acquiring GPS…`
                              : `${KARNATAKA.state} · GPS Locked ±3m`}
                        </Text>
                      </Animated.View>
                    </Box>

                    <Animated.View
                      entering={FadeInUp.delay(280).duration(420)}
                      style={{
                        position: 'absolute',
                        left: 10,
                        bottom: 10,
                        zIndex: 5,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      pointerEvents="none"
                    >
                      <MapPin size={12} color={COLORS.primary} />
                      <Text className="text-[10px] font-bold text-foreground">
                        {KARNATAKA.site.latitude.toFixed(4)}, {KARNATAKA.site.longitude.toFixed(4)}
                      </Text>
                    </Animated.View>
                  </Box>
                </Box>
              </AppCard>
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(120).duration(500).springify().damping(15)}
            style={{ marginTop: 14 }}
          >
            <AppCard>
              <HStack className="items-stretch">
                <Box className="flex-1 pr-3">
                  <HStack className="items-center gap-1.5 mb-1.5">
                    <Navigation size={12} color={COLORS.primary} />
                    <Text className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Current Location
                    </Text>
                  </HStack>
                  <Text className="font-extrabold text-[13px] text-foreground leading-5">
                    {KARNATAKA.site.coordsDisplay.lat}, {KARNATAKA.site.coordsDisplay.lng}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {KARNATAKA.site.village}, {KARNATAKA.state}
                  </Text>
                </Box>

                <Box className="w-px bg-border self-stretch mx-1" />

                <Box className="flex-1 pl-3">
                  <HStack className="items-center gap-1.5 mb-1.5">
                    <MapPinned size={12} color={COLORS.primary} />
                    <Text className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Assigned Zone
                    </Text>
                  </HStack>
                  <Text className="font-extrabold text-[13px] text-foreground">
                    {KARNATAKA.site.zone}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Radius 2.5 km</Text>
                </Box>
              </HStack>

              <Box className="mt-4 pt-4 border-t border-border">
                <HStack className="items-center justify-between">
                  <VStack className="flex-1 min-w-0 pr-3">
                    <Text className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Distance to Center
                    </Text>
                    <HStack className="items-end gap-2 mt-1">
                      <Text
                        className="font-extrabold text-xl"
                        style={{ color: outside ? COLORS.destructive : '#0F172A' }}
                      >
                        {distanceLabel}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mb-1">
                        of 2.5 km fence
                      </Text>
                    </HStack>
                    <Box
                      className="mt-2.5 overflow-hidden rounded-full"
                      style={{ height: 7, backgroundColor: '#EFF6FF' }}
                      onLayout={(e) => {
                        distanceTrackW.value = e.nativeEvent.layout.width;
                      }}
                    >
                      <Animated.View
                        style={[
                          {
                            height: '100%',
                            borderRadius: 999,
                          },
                          distanceBarStyle,
                        ]}
                      />
                    </Box>
                  </VStack>
                  <Animated.View style={badgeStyle}>
                    {scanning && !outside ? (
                      <Box className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
                        <Text className="text-[11px] font-bold" style={{ color: '#B45309' }}>
                          Checking
                        </Text>
                      </Box>
                    ) : (
                      <StatusChip status={outside ? 'Rejected' : 'Verified'} />
                    )}
                  </Animated.View>
                </HStack>
              </Box>
            </AppCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(220).duration(480)}
            style={{ marginTop: 14 }}
          >
            {outside ? (
              <Animated.View entering={FadeInDown.duration(360).springify().damping(15)}>
                <AppCard className="bg-destructive/5 border border-destructive/20">
                  <HStack className="items-start gap-3">
                    <IconBox size="lg" className="bg-destructive/15">
                      <AlertTriangle size={20} color={COLORS.destructive} />
                    </IconBox>
                    <VStack className="flex-1">
                      <Text className="font-extrabold text-destructive">
                        Outside Assigned Location
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1 leading-5">
                        Move inside your assigned geo-fence to continue field work.
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack className="mt-4 gap-2">
                    <Box className="flex-1">
                      <AppBtn
                        variant="outline"
                        onPress={() => setOutside(false)}
                        icon={RefreshCw}
                      >
                        Retry
                      </AppBtn>
                    </Box>
                    <Box className="flex-1">
                      <AppBtn variant="outline" icon={Navigation}>
                        Refresh GPS
                      </AppBtn>
                    </Box>
                  </HStack>
                  <Pressable onPress={() => go('login')} className="mt-2 py-2.5 items-center">
                    <Text className="text-sm text-destructive font-semibold">Logout</Text>
                  </Pressable>
                </AppCard>
              </Animated.View>
            ) : (
              <VStack space="sm">
                <Animated.View entering={ZoomIn.delay(scanning ? 900 : 0).springify().damping(14)}>
                  <AppBtn
                    onPress={() => go(homeScreenForRole(user))}
                    icon={ArrowRight}
                    disabled={scanning}
                  >
                    {scanning ? 'Validating location…' : 'Continue'}
                  </AppBtn>
                </Animated.View>
                <Pressable
                  onPress={() => setOutside(true)}
                  className="py-2.5 items-center active:opacity-70"
                  disabled={scanning}
                >
                  <Text className="text-xs text-muted-foreground font-medium">
                    Simulate: outside geo-fence
                  </Text>
                </Pressable>
              </VStack>
            )}
          </Animated.View>
        </Box>
      </ScrollView>
    </ScreenShell>
  );
}
