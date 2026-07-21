import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/state/app-context';
import { THEMES } from '@/theme/themes';

import { ModalFrame } from './modal-frame';

export function ThemePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data, setTheme, t } = useApp();
  return (
    <ModalFrame onClose={onClose} title={t('themes')} visible={visible}>
      <View style={styles.grid}>
        {THEMES.map((theme) => {
          const selected = theme.id === data?.preferences.themeId;
          return (
            <Pressable
              accessibilityLabel={t(theme.labelKey)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={theme.id}
              onPress={() => {
                setTheme(theme.id);
                onClose();
              }}
              style={({ pressed }) => [
                styles.item,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <ImageBackground
                imageStyle={styles.image}
                source={theme.image}
                style={styles.preview}
              />
              <Text style={styles.label}>{t(theme.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f4e9df',
    padding: 4,
  },
  selected: { borderColor: '#dc6c4b' },
  preview: { height: 150 },
  image: { borderRadius: 13 },
  label: { color: '#40506a', fontSize: 14, fontWeight: '700', padding: 10 },
  pressed: { opacity: 0.75 },
});
