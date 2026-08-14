import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { COLORS, FONTS, GRADIENT_PRIMARY, gradientStops } from '@/src/cdrms/theme';

export type AppDialogVariant = 'success' | 'error' | 'info' | 'warning' | 'confirm';

export type AppDialogConfig = {
  title: string;
  message?: string;
  variant?: AppDialogVariant;
  /** Optional highlighted chip (e.g. application number). */
  highlightLabel?: string;
  highlight?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Hide cancel — single primary button. */
  hideCancel?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  /** Android back / system dismiss — defaults to no action (just close). */
  onDismiss?: () => void;
};

type DialogState = AppDialogConfig & { visible: boolean };

type Listener = (state: DialogState | null) => void;

let listener: Listener | null = null;
let queue: DialogState | null = null;

function publish(state: DialogState | null) {
  if (listener) listener(state);
  else queue = state?.visible ? state : null;
}

/** Show the shared styled dialog (replaces system Alert for user-facing messages). */
export function showAppDialog(config: AppDialogConfig) {
  publish({ ...config, visible: true });
}

export function dismissAppDialog() {
  publish(null);
}

const VARIANT_META: Record<
  AppDialogVariant,
  { icon: LucideIcon; iconBg: string; iconBorder: string; colorKey: 'success' | 'destructive' | 'warning' | 'primary' }
> = {
  success: {
    icon: CheckCircle2,
    iconBg: '#DCFCE7',
    iconBorder: '#BBF7D0',
    colorKey: 'success',
  },
  error: {
    icon: XCircle,
    iconBg: '#FEE2E2',
    iconBorder: '#FECACA',
    colorKey: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: '#FEF3C7',
    iconBorder: '#FDE68A',
    colorKey: 'warning',
  },
  info: {
    icon: Info,
    iconBg: '#EFF6FF',
    iconBorder: '#BFDBFE',
    colorKey: 'primary',
  },
  confirm: {
    icon: Info,
    iconBg: '#EFF6FF',
    iconBorder: '#BFDBFE',
    colorKey: 'primary',
  },
};

function AppDialogView({
  config,
  onClose,
}: {
  config: DialogState;
  onClose: () => void;
}) {
  const variant = config.variant ?? 'info';
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;
  const iconColor = COLORS[meta.colorKey];
  const showCancel = !config.hideCancel && Boolean(config.cancelLabel || config.onCancel);
  const cancelLabel = config.cancelLabel ?? 'Cancel';
  const confirmLabel = config.confirmLabel ?? 'OK';

  const closeThen = (fn?: () => void) => {
    onClose();
    // Defer so the modal unmounts before navigation / follow-up UI.
    setTimeout(() => fn?.(), 40);
  };

  return (
    <Modal
      visible={config.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => closeThen(config.onDismiss)}
    >
      {/* Tap outside the card closes without running cancel/confirm actions */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
        onPress={() => closeThen(config.onDismiss)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15,23,42,0.48)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: COLORS.white,
            borderRadius: 24,
            paddingHorizontal: 22,
            paddingTop: 28,
            paddingBottom: 20,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.2,
            shadowRadius: 28,
            elevation: 12,
          }}
        >
          <VStack className="items-center" style={{ gap: 10 }}>
            <Box
              className="items-center justify-center"
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: meta.iconBg,
                borderWidth: 1,
                borderColor: meta.iconBorder,
              }}
            >
              <Icon size={34} color={iconColor} strokeWidth={2.2} />
            </Box>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 20,
                color: COLORS.ink,
                textAlign: 'center',
              }}
            >
              {config.title}
            </Text>
            {config.message?.trim() ? (
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  lineHeight: 19,
                  color: COLORS.slate,
                  textAlign: 'center',
                }}
              >
                {config.message}
              </Text>
            ) : null}
            {config.highlight?.trim() ? (
              <Box
                style={{
                  marginTop: 4,
                  width: '100%',
                  borderRadius: 14,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}
              >
                {config.highlightLabel?.trim() ? (
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 13,
                      color: COLORS.slate,
                      textAlign: 'center',
                      marginBottom: 4,
                    }}
                  >
                    {config.highlightLabel}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 16,
                    color: COLORS.primary,
                    textAlign: 'center',
                    letterSpacing: 0.2,
                  }}
                  selectable
                >
                  {config.highlight}
                </Text>
              </Box>
            ) : null}
          </VStack>

          <HStack style={{ gap: 10, marginTop: 22 }}>
            {showCancel ? (
              <Pressable
                onPress={() => closeThen(config.onCancel)}
                className="flex-1 active:opacity-85"
                style={{
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.ink }}>
                  {cancelLabel}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => closeThen(config.onConfirm)}
              className="flex-1 active:opacity-90"
              style={{
                height: 46,
                borderRadius: 12,
                overflow: 'hidden',
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.22,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={
                  variant === 'error'
                    ? [COLORS.destructive, '#DC2626']
                    : gradientStops(GRADIENT_PRIMARY)
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: COLORS.white }}>
                  {confirmLabel}
                </Text>
              </LinearGradient>
            </Pressable>
          </HStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Mount once near the app root so `showAppDialog` works anywhere. */
export function AppDialogHost() {
  const [state, setState] = useState<DialogState | null>(null);

  useEffect(() => {
    listener = setState;
    if (queue) {
      setState(queue);
      queue = null;
    }
    return () => {
      listener = null;
    };
  }, []);

  if (!state?.visible) return null;

  return <AppDialogView config={state} onClose={() => setState(null)} />;
}
