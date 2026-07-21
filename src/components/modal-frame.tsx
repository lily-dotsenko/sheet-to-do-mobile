import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function ModalFrame({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.overlay}>
          <Pressable accessibilityRole="none" onPress={() => undefined} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                accessibilityLabel={onClose.name || 'Close'}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={styles.close}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 26, 38, 0.62)',
    justifyContent: 'flex-end',
    paddingTop: 48,
  },
  sheet: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#dfcfc5',
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { flex: 1, color: '#34415a', fontSize: 24, fontWeight: '800' },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f6e9df',
  },
  closeText: { color: '#6f5b58', fontSize: 30, lineHeight: 32 },
  content: { paddingBottom: 12 },
});
