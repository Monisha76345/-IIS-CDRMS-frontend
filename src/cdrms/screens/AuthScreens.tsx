import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Camera,
  Check,
  Eye,
  EyeOff,
  Headphones,
  LocateFixed,
  Lock,
  MapPin,
  MapPinned,
  Mic,
  Minus,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react-native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type ScrollView as RNScrollView,
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
  IconBox,
  ScreenShell,
  ScreenLoader,
  StatusChip,
} from '@/src/cdrms/components/primitives';
import { KarnatakaMap } from '@/src/cdrms/components/KarnatakaMap';
import {
  GEO_FENCE_RADIUS_FT,
  distanceFeet,
} from '@/src/cdrms/location';
import {
  useDeviceLocation,
  type LocationResult,
} from '@/src/cdrms/hooks/useDeviceLocation';
import {
  ensureForegroundLocationPermission,
  hasForegroundLocationPermission,
} from '@/src/cdrms/locationPermission';
import {
  ensureCameraPermission,
  ensureMicrophonePermission,
} from '@/src/cdrms/mediaPermission';
import {
  COLORS,
  FONTS,
  GLASS,
  applyAuthTheme,
  AUTH_GRADIENT_HEADER,
  GRADIENT_MESH,
  GRADIENT_PRIMARY,
  gradientStops,
} from '@/src/cdrms/theme';
import { useTheme } from '@/src/theme/ThemeContext';
import { TERMS } from '@/src/cdrms/terminology';
import { showAppDialog } from '@/src/cdrms/components/AppDialog';
import type { Go } from '@/src/cdrms/types';
import { useAuth } from '@/src/auth/AuthContext';
import { ApiError } from '@/src/api/client';
import { homeScreenForRole, needsGeoValidation } from '@/src/auth/roles';

const SPLASH_HOLD_MS = 3200;
const OTP_LENGTH = 6;
const OTP_TTL_SEC = 60;

export function SplashScreen({ go }: { go: Go }) {
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    applyAuthTheme();
  }, []);

  const navigateAfterSplash = useCallback(() => {
    // Always show login after splash — do not auto-enter permission/home from a saved session.
    go('login');
  }, [go]);

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
        if (finished) runOnJS(navigateAfterSplash)();
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(leave);
  }, [go, logoOpacity, logoScale, navigateAfterSplash, orbDrift, progress, ring, screenOpacity]);

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
          colors={gradientStops(AUTH_GRADIENT_HEADER)}
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
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    applyAuthTheme();
  }, []);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<'loginId' | 'password' | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const loginIdRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<RNScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  async function onSecureLogin() {
    if (loading) return;
    Keyboard.dismiss();
    setError('');
    if (!loginId.trim() || !password.trim()) {
      setError('Enter Login ID / email and password');
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await login(loginId, password);
      // Geo validation is engineer-only — ZC / CAO go straight home.
      if (needsGeoValidation(loggedIn)) {
        go('permission');
      } else {
        go(homeScreenForRole(loggedIn));
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Unable to reach API. Set EXPO_PUBLIC_API_URL to your machine IP.';
      setError(msg);
      showAppDialog({
        variant: 'error',
        title: 'Login failed',
        message: msg,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell className="bg-[#F8FAFC]">
      {/* Background Header Ambient Glow & Gradient */}
      <Box pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#0A3E96', '#0256D0', '#0042B3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Soft floating background orb decorative overlays */}
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        <Box
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          }}
        />
      </Box>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + (keyboardOpen ? 12 : 28),
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            {/* Brand Header Hero */}
            <VStack className="items-center" style={{ gap: 6, marginBottom: 22 }}>
              <Box
                className="items-center justify-center overflow-hidden"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 3,
                  borderColor: 'rgba(255, 255, 255, 0.85)',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.18,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                <Image
                  source={require('../../../assets/bda-logo.png')}
                  style={{ width: 78, height: 78 }}
                  resizeMode="contain"
                  accessibilityLabel="BDA Seal"
                />
              </Box>

              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 22,
                  lineHeight: 28,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                BDA CDRMS PORTAL
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.92)',
                  textAlign: 'center',
                }}
              >
                Ministry of Public Works
              </Text>
            </VStack>

            {/* Login Card */}
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                paddingHorizontal: 22,
                paddingTop: 24,
                paddingBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(226, 232, 240, 0.9)',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
                elevation: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 22,
                  color: '#0F172A',
                  textAlign: 'center',
                }}
              >
                Welcome Back!
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 4,
                  marginBottom: 20,
                }}
              >
                Sign in with your Login ID to continue
              </Text>

              <VStack style={{ gap: 16 }}>
                {/* Login ID field */}
                <VStack style={{ gap: 6 }}>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#475569', letterSpacing: 0.5 }}>
                    LOGIN ID / EMAIL
                  </Text>
                  <Pressable
                    onPress={() => loginIdRef.current?.focus()}
                    style={{
                      height: 50,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: focusedInput === 'loginId' ? '#0256D0' : '#E2E8F0',
                      backgroundColor: focusedInput === 'loginId' ? '#FFFFFF' : '#F8FAFC',
                      paddingHorizontal: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: focusedInput === 'loginId' ? '#0256D0' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: focusedInput === 'loginId' ? 0.12 : 0,
                      shadowRadius: 6,
                    }}
                  >
                    <Box
                      pointerEvents="none"
                      className="items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: focusedInput === 'loginId' ? '#EFF6FF' : '#F1F5F9',
                        marginRight: 10,
                      }}
                    >
                      <User size={18} color="#0256D0" strokeWidth={2.2} />
                    </Box>
                    <TextInput
                      ref={loginIdRef}
                      value={loginId}
                      onChangeText={setLoginId}
                      onFocus={() => setFocusedInput('loginId')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      placeholder="Enter login ID or email"
                      placeholderTextColor="#94A3B8"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      style={{
                        flex: 1,
                        height: '100%',
                        fontFamily: FONTS.medium,
                        fontSize: 14,
                        color: '#0F172A',
                        paddingRight: 10,
                        paddingVertical: 0,
                      }}
                    />
                  </Pressable>
                </VStack>

                {/* Password field */}
                <VStack style={{ gap: 6 }}>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: '#475569', letterSpacing: 0.5 }}>
                    PASSWORD
                  </Text>
                  <Pressable
                    onPress={() => passwordRef.current?.focus()}
                    style={{
                      height: 50,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: focusedInput === 'password' ? '#0256D0' : '#E2E8F0',
                      backgroundColor: focusedInput === 'password' ? '#FFFFFF' : '#F8FAFC',
                      paddingHorizontal: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: focusedInput === 'password' ? '#0256D0' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: focusedInput === 'password' ? 0.12 : 0,
                      shadowRadius: 6,
                    }}
                  >
                    <Box
                      pointerEvents="none"
                      className="items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: focusedInput === 'password' ? '#EFF6FF' : '#F1F5F9',
                        marginRight: 10,
                      }}
                    >
                      <Lock size={18} color="#0256D0" strokeWidth={2.2} />
                    </Box>
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      returnKeyType="go"
                      onSubmitEditing={() => void onSecureLogin()}
                      style={{
                        flex: 1,
                        height: '100%',
                        fontFamily: FONTS.medium,
                        fontSize: 14,
                        color: '#0F172A',
                        paddingRight: 8,
                        paddingVertical: 0,
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
                      style={{ marginRight: 2 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#64748B" />
                      ) : (
                        <Eye size={18} color="#64748B" />
                      )}
                    </Pressable>
                  </Pressable>
                </VStack>

                {error ? (
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#DC2626' }}>
                    {error}
                  </Text>
                ) : null}

                {/* Checkbox + Forgot password row */}
                <HStack className="items-center justify-between" style={{ marginTop: 2 }}>
                  <Checkbox
                    value="remember"
                    isChecked={remember}
                    onChange={(v) => setRemember(!!v)}
                  >
                    <CheckboxIndicator
                      style={{
                        borderColor: remember ? '#0256D0' : '#94A3B8',
                        backgroundColor: remember ? '#0256D0' : '#FFFFFF',
                        borderRadius: 5,
                      }}
                    >
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 12,
                        color: '#334155',
                        marginLeft: 4,
                      }}
                    >
                      Remember this device
                    </CheckboxLabel>
                  </Checkbox>

                  <Pressable className="active:opacity-70">
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#0256D0' }}>
                      Forgot Login ID?
                    </Text>
                  </Pressable>
                </HStack>

                {/* Secure Login Button */}
                <Pressable
                  onPress={() => void onSecureLogin()}
                  disabled={loading}
                  className="active:opacity-90 overflow-hidden"
                  style={{
                    borderRadius: 14,
                    marginTop: 6,
                    shadowColor: '#0256D0',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={['#0256D0', '#0042B3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 52,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingHorizontal: 16,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Lock size={17} color="#FFFFFF" strokeWidth={2.4} />
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' }}>
                          Secure Login
                        </Text>
                        <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </VStack>
            </Animated.View>

            {/* Bottom Security Footer */}
            <VStack className="items-center" style={{ marginTop: 24, gap: 4 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: '#94A3B8' }}>
                Bangalore Development Authority © 2026
              </Text>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  const { user } = useAuth();
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
    setTimeout(() => {
      if (needsGeoValidation(user)) {
        go('permission');
      } else {
        go(homeScreenForRole(user));
      }
    }, 1250);
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
  const { themeId } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
      accent: COLORS.primary,
      soft: GLASS.tintBlue,
    },
    {
      icon: Camera,
      title: TERMS.permissions.cameraTitle,
      desc: TERMS.permissions.cameraDesc,
      accent: COLORS.primaryGlow,
      soft: GLASS.tintSky,
    },
    {
      icon: Mic,
      title: TERMS.permissions.microphoneTitle,
      desc: TERMS.permissions.microphoneDesc,
      accent: COLORS.primary,
      soft: GLASS.tintBlue,
    },
    {
      icon: MapPinned,
      title: TERMS.permissions.foregroundTitle,
      desc: TERMS.permissions.foregroundDesc,
      accent: COLORS.primaryGlow,
      soft: GLASS.tintSky,
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
    // ZC / CAO never need geo validation — send them home if they land here.
    if (!needsGeoValidation(user)) {
      go(homeScreenForRole(user));
    }
  }, [user, go]);

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
    if (!needsGeoValidation(user)) {
      go(homeScreenForRole(user));
      return;
    }
    setBusy(true);
    try {
      // Ask camera + mic early so selfie / video work on Media step.
      await ensureCameraPermission(true);
      await ensureMicrophonePermission(true);

      const granted = await ensureForegroundLocationPermission();
      if (!granted) {
        return;
      }
      setAlreadyGranted(true);
      go('geo');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not enable GPS';
      showAppDialog({
        variant: 'error',
        title: 'GPS error',
        message,
        hideCancel: true,
        confirmLabel: 'OK',
      });
    } finally {
      setBusy(false);
    }
  }, [busy, go, user]);

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
        colors={gradientStops(GRADIENT_MESH)}
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
              backgroundColor: `${COLORS.primaryGlow}2E`,
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
          key={themeId}
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
                  backgroundColor: `${COLORS.primary}1A`,
                  borderWidth: 1,
                  borderColor: `${COLORS.primary}2E`,
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
                      shadowColor: COLORS.primary,
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
                  shadowColor: '#2563EB',
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

const GEO_MAP_MIN_DELTA = 0.0015;
const GEO_MAP_MAX_DELTA = 0.35;
/** Allowed distance from assigned site pin (feet). Soft check — Continue still works. */
const FENCE_RADIUS_FT = GEO_FENCE_RADIUS_FT;
const GEO_MAP_HEIGHT = 380;

export function GeoScreen({ go }: { go: Go }) {
  const { user } = useAuth();
  const { refresh, loading: geoBusy } = useDeviceLocation();

  const [scanning, setScanning] = useState(true);
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapDelta, setMapDelta] = useState(0.008);
  const [mapRecenterKey, setMapRecenterKey] = useState(0);
  const [mapGesturing, setMapGesturing] = useState(false);
  /** 10 ft fence is measured from the locked live GPS — not a far demo pin. */
  const [fenceAnchor, setFenceAnchor] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!needsGeoValidation(user)) {
      go(homeScreenForRole(user));
    }
  }, [user, go]);

  const cardLift = useSharedValue(0);
  const verifyBadge = useSharedValue(0);

  const performFetchLocation = useCallback(async () => {
    setScanning(true);
    setLocationError(null);
    try {
      const res = await refresh({ silent: true });
      if (res) {
        setLocationResult(res);
        setFenceAnchor({
          latitude: res.gps.latitude,
          longitude: res.gps.longitude,
        });
      } else {
        setLocationError('Could not read GPS. Allow location and try again.');
      }
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : 'Could not read GPS');
    } finally {
      setScanning(false);
      verifyBadge.value = withSpring(1, { damping: 12, stiffness: 170 });
    }
  }, [refresh, verifyBadge]);

  useEffect(() => {
    cardLift.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    void performFetchLocation();
  }, [cardLift, performFetchLocation]);

  const isBusy = scanning || geoBusy;
  const hasLocation = Boolean(locationResult?.gps);

  const currentLat = locationResult?.gps.latitude ?? 0;
  const currentLng = locationResult?.gps.longitude ?? 0;
  const currentAccuracy = locationResult?.gps.accuracy;

  const anchorLat = fenceAnchor?.latitude ?? currentLat;
  const anchorLng = fenceAnchor?.longitude ?? currentLng;

  const realDistFt =
    hasLocation && fenceAnchor
      ? distanceFeet(currentLat, currentLng, anchorLat, anchorLng)
      : 0;

  const outside =
    hasLocation && fenceAnchor ? realDistFt > FENCE_RADIUS_FT : false;

  useEffect(() => {
    verifyBadge.value = withSpring(outside ? 0 : 1, { damping: 12, stiffness: 170 });
  }, [outside, verifyBadge]);

  const mapCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(cardLift.value, [0, 1], [0, -3]) }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(verifyBadge.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(verifyBadge.value, [0, 1], [0.86, 1]) }],
  }));

  // Wait for real GPS — never show hardcoded Devanahalli / demo zone placeholders.
  if (!hasLocation || !locationResult) {
    return (
      <ScreenShell>
        <AppHeader
          title={TERMS.permissions.geoValidation}
          subtitle={
            locationError
              ? 'Location unavailable'
              : 'Acquiring GPS — please wait…'
          }
          onBack={() => go('login')}
          go={go}
        />
        <Box className="flex-1 items-center justify-center px-8" style={{ marginTop: 8 }}>
          {isBusy || !locationError ? (
            <ScreenLoader color="#2563EB" />
          ) : (
            <VStack className="items-center w-full" style={{ gap: 14 }}>
              <IconBox size="lg" className="bg-destructive/15">
                <AlertTriangle size={22} color={COLORS.destructive} />
              </IconBox>
              <Text className="text-base font-extrabold text-foreground text-center">
                Location not available
              </Text>
              <Text className="text-sm text-muted-foreground text-center leading-5">
                {locationError}
              </Text>
              <Box className="w-full mt-2">
                <AppBtn
                  onPress={() => void performFetchLocation()}
                  icon={RefreshCw}
                  disabled={isBusy}
                >
                  {isBusy ? 'Retrying…' : 'Retry GPS'}
                </AppBtn>
              </Box>
            </VStack>
          )}
        </Box>
      </ScreenShell>
    );
  }

  const villageName =
    locationResult.address.village ||
    locationResult.address.taluk ||
    locationResult.address.displayName ||
    `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
  const stateName = locationResult.address.state || '—';
  const districtName = locationResult.address.district || stateName;
  const zoneLabel =
    [locationResult.address.district, locationResult.address.state]
      .filter(Boolean)
      .join(' · ') || 'Live GPS zone';

  return (
    <ScreenShell>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapGesturing}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          title={TERMS.permissions.geoValidation}
          subtitle={isBusy ? 'Scanning jurisdiction…' : TERMS.permissions.geoValidationSubtitle}
          onBack={() => go('login')}
          go={go}
        />

        <Box className="flex-1 pb-10" style={{ marginTop: 12 }}>
          <Animated.View
            entering={FadeInUp.duration(560).springify().damping(14).stiffness(130)}
          >
            <Animated.View style={mapCardStyle}>
              <AppCard className="p-0 overflow-hidden mx-0 rounded-none border-0">
                <Box
                  className="relative overflow-hidden"
                  style={{
                    width: '100%',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(226,229,240,0.95)',
                  }}
                  onTouchStart={() => setMapGesturing(true)}
                  onTouchEnd={() => setMapGesturing(false)}
                  onTouchCancel={() => setMapGesturing(false)}
                >
                  <KarnatakaMap
                    height={GEO_MAP_HEIGHT}
                    rounded={0}
                    mode="site"
                    showBadge={false}
                    interactive
                    latitude={currentLat}
                    longitude={currentLng}
                    latitudeDelta={mapDelta}
                    recenterKey={mapRecenterKey}
                  />

                  <Box
                    className="absolute top-3 left-3 right-3 flex-row items-start justify-between"
                    style={{ zIndex: 5 }}
                    pointerEvents="box-none"
                  >
                    <Animated.View
                      entering={FadeInRight.delay(220).duration(420)}
                      pointerEvents="none"
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: 'rgba(15,23,42,0.86)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                        maxWidth: '62%',
                      }}
                    >
                      <Box
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: outside
                            ? COLORS.destructive
                            : isBusy
                              ? COLORS.warning
                              : '#34D399',
                        }}
                      />
                      <Text className="text-[10px] font-bold text-white" numberOfLines={1}>
                        {outside
                          ? `${stateName} · Outside fence`
                          : isBusy
                            ? `${stateName} · Acquiring GPS…`
                            : `${stateName} · GPS Locked ${currentAccuracy
                              ? `±${Math.round(currentAccuracy)}m`
                              : ''
                            }`}
                      </Text>
                    </Animated.View>

                    <Box
                      style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(255,255,255,0.96)',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        shadowColor: '#000',
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setMapDelta(0.008);
                          setMapRecenterKey((k) => k + 1);
                        }}
                        className="h-10 w-10 items-center justify-center active:opacity-70"
                        accessibilityLabel="Recenter map"
                      >
                        <LocateFixed size={15} color="#2563EB" strokeWidth={2.4} />
                      </Pressable>
                      <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                      <Pressable
                        onPress={() =>
                          setMapDelta((d) => Math.max(GEO_MAP_MIN_DELTA, d * 0.45))
                        }
                        className="h-10 w-10 items-center justify-center active:opacity-70"
                        accessibilityLabel="Zoom in"
                      >
                        <Plus size={16} color="#334155" strokeWidth={2.4} />
                      </Pressable>
                      <Box style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                      <Pressable
                        onPress={() =>
                          setMapDelta((d) => Math.min(GEO_MAP_MAX_DELTA, d * 2.2))
                        }
                        className="h-10 w-10 items-center justify-center active:opacity-70"
                        accessibilityLabel="Zoom out"
                      >
                        <Minus size={16} color="#334155" strokeWidth={2.4} />
                      </Pressable>
                    </Box>
                  </Box>

                  <Animated.View
                    entering={FadeInUp.delay(280).duration(420)}
                    style={{
                      position: 'absolute',
                      left: 12,
                      bottom: 12,
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
                      {villageName}
                    </Text>
                  </Animated.View>
                </Box>
              </AppCard>
            </Animated.View>
          </Animated.View>

          <Box className="px-5">
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
                      {villageName}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {districtName}, {stateName}
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
                      {zoneLabel}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      Radius {FENCE_RADIUS_FT} ft
                    </Text>
                  </Box>
                </HStack>

                <Box className="mt-2 pt-2 border-t border-border">
                  <HStack className="items-center justify-between">
                    <Text className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Geo status
                    </Text>
                    <Animated.View style={badgeStyle}>
                      {isBusy && !outside ? (
                        <Box
                          className="px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#FEF3C7' }}
                        >
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

            <Animated.View entering={FadeInUp.delay(220).duration(480)} style={{ marginTop: 14 }}>
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
                          You drifted beyond the {FENCE_RADIUS_FT} ft geo-fence. Refresh GPS to
                          re-lock, or continue anyway.
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack className="mt-4 gap-2">
                      <Box className="flex-1">
                        <AppBtn
                          variant="outline"
                          onPress={() => {
                            void performFetchLocation();
                          }}
                          icon={RefreshCw}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Checking…' : 'Retry'}
                        </AppBtn>
                      </Box>
                      <Box className="flex-1">
                        <AppBtn
                          variant="outline"
                          icon={Navigation}
                          onPress={() => {
                            void performFetchLocation();
                          }}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Acquiring GPS…' : 'Refresh GPS'}
                        </AppBtn>
                      </Box>
                    </HStack>
                    <Box className="mt-3">
                      <AppBtn
                        onPress={() => go(homeScreenForRole(user))}
                        icon={ArrowRight}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Validating location…' : 'Continue anyway'}
                      </AppBtn>
                    </Box>
                  </AppCard>
                </Animated.View>
              ) : (
                <VStack space="sm">
                  <Animated.View entering={ZoomIn.delay(isBusy ? 900 : 0).springify().damping(14)}>
                    <AppBtn
                      onPress={() => go(homeScreenForRole(user))}
                      icon={ArrowRight}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Validating location…' : 'Continue'}
                    </AppBtn>
                  </Animated.View>
                </VStack>
              )}
            </Animated.View>
          </Box>
        </Box>
      </ScrollView>
    </ScreenShell>
  );
}
