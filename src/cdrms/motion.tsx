/**
 * CDRMS motion layer — Moti (Reanimated) for enter / press / loop animations.
 * Visual only — do not put business logic here.
 */
import { type ReactNode } from 'react';
import { type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';

export { MotiView, MotiPressable };

type EnterProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  y?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
};

export function EnterUp({ children, delay = 0, style, y = 18 }: EnterProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: y }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 520, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

export function EnterFade({ children, delay = 0, style }: EnterProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 480, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

export function EnterScale({ children, delay = 0, style, onLayout }: EnterProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 16, stiffness: 180, delay }}
      style={style}
      onLayout={onLayout}
    >
      {children}
    </MotiView>
  );
}

export function EnterRow({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 380,
        delay: Math.min(index, 8) * 45,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

export function PressScale({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
}) {
  return (
    <MotiPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      animate={({ pressed }) => {
        'worklet';
        return { scale: pressed ? 0.97 : 1 };
      }}
      transition={{ type: 'timing', duration: 120 }}
      style={style as any}
    >
      {children}
    </MotiPressable>
  );
}
