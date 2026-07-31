import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'soft' | 'danger';

type ActionButtonProps = {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function ActionButton({
  label,
  icon,
  onPress,
  variant = 'soft',
  disabled = false,
  loading = false,
  style,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#b54f35'} size="small" />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.label, variant === 'primary' && styles.primaryLabel]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  label: string;
  icon: string;
  onPress?: () => void;
  onLongPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export function IconButton({
  label,
  icon,
  onPress,
  onLongPress,
  danger = false,
  disabled = false,
  loading = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      hitSlop={4}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        danger && styles.iconDanger,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#b54f35" size="small" />
      ) : (
        <Text style={[styles.iconButtonText, danger && styles.dangerText]}>{icon}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  primary: { backgroundColor: '#dc6c4b', borderColor: '#dc6c4b' },
  soft: { backgroundColor: 'rgba(255,250,244,0.92)' },
  danger: { backgroundColor: '#fff1ed', borderColor: '#f2c1b4' },
  label: { color: '#3f4553', fontSize: 15, fontWeight: '700' },
  primaryLabel: { color: '#ffffff' },
  icon: { fontSize: 18 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7f1',
  },
  iconDanger: { backgroundColor: '#fff0ed' },
  iconButtonText: { fontSize: 20, color: '#475166' },
  dangerText: { color: '#b94f3d' },
});
