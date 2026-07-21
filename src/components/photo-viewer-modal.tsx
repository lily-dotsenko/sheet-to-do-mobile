import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/state/app-context';

export function PhotoViewerModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const { t } = useApp();
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={uri !== null}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        {uri ? <Image resizeMode="contain" source={{ uri }} style={styles.image} /> : null}
        <Pressable
          accessibilityLabel={t('close')}
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 11, 18, 0.94)',
    padding: 16,
  },
  image: { width: '100%', height: '88%' },
  close: {
    position: 'absolute',
    top: 42,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  closeText: { color: '#ffffff', fontSize: 34, lineHeight: 36 },
  pressed: { opacity: 0.65 },
});
