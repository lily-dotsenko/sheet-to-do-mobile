import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/state/app-context';
import { THEMES } from '@/theme/themes';

import { ModalFrame } from './modal-frame';
import { ActionButton } from './ui-buttons';

export function ThemePickerModal({
  visible,
  onClose,
  onViewCustom,
}: {
  visible: boolean;
  onClose: () => void;
  onViewCustom: (uri: string) => void;
}) {
  const { busyBackground, data, pickCustomBackground, removeCustomBackground, setTheme, t } =
    useApp();
  const custom = data?.preferences.customBackground ?? null;
  return (
    <ModalFrame
      onClose={busyBackground ? () => undefined : onClose}
      title={t('themes')}
      visible={visible}
    >
      <View style={styles.customCard}>
        <Text style={styles.customTitle}>{t('customBackground')}</Text>
        <Text style={styles.hint}>{t('customBackgroundHint')}</Text>
        {custom ? (
          <Pressable
            accessibilityLabel={t('viewBackground')}
            accessibilityRole="imagebutton"
            disabled={busyBackground}
            onPress={() => onViewCustom(custom.uri)}
          >
            <ImageBackground
              imageStyle={styles.customImage}
              source={{ uri: custom.uri }}
              style={styles.customPreview}
            />
          </Pressable>
        ) : null}
        <ActionButton
          label={custom ? t('replaceBackground') : t('chooseBackground')}
          loading={busyBackground}
          onPress={() => void pickCustomBackground()}
          variant="primary"
        />
        {custom ? (
          <ActionButton
            disabled={busyBackground}
            label={t('removeBackground')}
            onPress={() => void removeCustomBackground()}
            variant="danger"
          />
        ) : null}
      </View>
      <View style={styles.grid}>
        {THEMES.map((theme) => {
          const selected = !custom && theme.id === data?.preferences.themeId;
          return (
            <Pressable
              accessibilityLabel={t(theme.labelKey)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: busyBackground }}
              disabled={busyBackground}
              key={theme.id}
              onPress={() => void setTheme(theme.id)}
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
  customCard: {
    gap: 10,
    backgroundColor: '#f4e9df',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  customTitle: { color: '#34415a', fontSize: 18, fontWeight: '800' },
  hint: { color: '#756b69', fontSize: 13, lineHeight: 18 },
  customPreview: { height: 170, borderRadius: 14, overflow: 'hidden' },
  customImage: { borderRadius: 14 },
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
