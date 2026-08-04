import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { ApiMediaImage } from '@/src/cdrms/components/ApiMediaImage';

type Props = {
  uri: string | null;
  title?: string;
  onClose: () => void;
};

/** Full-screen image preview — tap thumbnail to open, Close / backdrop to dismiss. */
export function ImagePreviewModal({ uri, title, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const open = Boolean(uri);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close preview" />

        <View
          style={[
            styles.topBar,
            { paddingTop: Math.max(insets.top, 12) + 4, paddingHorizontal: 16 },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.title} numberOfLines={1}>
            {title ?? 'Photo preview'}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <X size={20} color="#fff" strokeWidth={2.4} />
          </Pressable>
        </View>

        {uri ? (
          <View style={styles.imageWrap} pointerEvents="box-none">
            <ApiMediaImage
              uri={uri}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={title ?? 'Uploaded photo'}
            />
          </View>
        ) : null}

        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8, alignItems: 'center' }}>
          <Pressable onPress={onClose} style={styles.doneBtn} accessibilityRole="button">
            <Text style={styles.doneText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageWrap: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  doneBtn: {
    minWidth: 120,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },
  doneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
