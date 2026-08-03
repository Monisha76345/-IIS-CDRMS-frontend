import { Search, XCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, TextInput, type TextInputProps, type ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { cardSurfaceStyle } from '@/src/cdrms/lib/cardSurface';
import { COLORS, FONTS } from '@/src/cdrms/theme';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Extra control on the right (e.g. refresh). Shown after the clear button. */
  endAdornment?: ReactNode;
  nested?: boolean;
  height?: number;
  iconColor?: string;
  className?: string;
  style?: ViewStyle;
  inputStyle?: TextInputProps['style'];
};

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search…',
  endAdornment,
  nested = true,
  height = 44,
  iconColor = COLORS.slate,
  className,
  style,
  inputStyle,
}: SearchFieldProps) {
  const hasValue = value.length > 0;

  return (
    <Box
      className={`flex-row items-center ${className ?? ''}`}
      style={[
        nested ? cardSurfaceStyle({ nested: true }) : null,
        { paddingHorizontal: 12, height, overflow: 'hidden' },
        style,
      ]}
    >
      <Search size={16} color={iconColor} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.slate}
        style={[
          {
            flex: 1,
            marginLeft: 8,
            fontSize: 13,
            fontFamily: FONTS.medium,
            color: COLORS.ink,
            ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
          },
          inputStyle,
        ]}
      />
      {hasValue ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          className="active:opacity-70"
          style={{ marginLeft: 4, padding: 2 }}
        >
          <XCircle size={18} color={COLORS.slate} />
        </Pressable>
      ) : null}
      {endAdornment ? (
        <Box style={{ marginLeft: hasValue ? 6 : 4 }}>{endAdornment}</Box>
      ) : null}
    </Box>
  );
}
