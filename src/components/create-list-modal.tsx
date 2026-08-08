import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useApp } from '@/state/app-context';
import { SHEET_ICONS } from '@/theme/icons';

import { ModalFrame } from './modal-frame';
import { ActionButton } from './ui-buttons';

export function CreateListModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { createList, t } = useApp();
  const [title, setTitle] = useState('');
  const [iconId, setIconId] = useState('general');

  const close = () => {
    setTitle('');
    setIconId('general');
    onClose();
  };

  const submit = () => {
    const clean = title.trim();
    if (!clean) return;
    createList(clean, iconId);
    close();
  };

  return (
    <ModalFrame onClose={close} title={t('createListTitle')} visible={visible}>
      <TextInput
        accessibilityLabel={t('listName')}
        autoFocus
        maxLength={60}
        onChangeText={setTitle}
        onSubmitEditing={submit}
        placeholder={t('listName')}
        placeholderTextColor="#9a8983"
        returnKeyType="done"
        style={styles.input}
        testID="create-list-name"
        value={title}
      />
      <Text style={styles.label}>{t('chooseIcon')}</Text>
      <View style={styles.grid}>
        {SHEET_ICONS.map((icon) => {
          const selected = icon.id === iconId;
          return (
            <Pressable
              accessibilityLabel={t(icon.labelKey)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={icon.id}
              onPress={() => setIconId(icon.id)}
              style={({ pressed }) => [
                styles.iconOption,
                selected && styles.iconSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.glyph}>{icon.glyph}</Text>
              <Text numberOfLines={1} style={styles.iconLabel}>
                {t(icon.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <ActionButton label={t('cancel')} onPress={close} />
        <ActionButton
          disabled={!title.trim()}
          label={t('create')}
          onPress={submit}
          testID="create-list-submit"
          variant="primary"
        />
      </View>
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfcfc5',
    backgroundColor: '#ffffff',
    color: '#35415a',
    fontSize: 18,
    paddingHorizontal: 16,
  },
  label: { color: '#71635e', fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    width: '23%',
    minWidth: 72,
    minHeight: 76,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#eaded5',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 6,
  },
  iconSelected: { borderColor: '#dc6c4b', backgroundColor: '#fff0e9' },
  glyph: { fontSize: 26 },
  iconLabel: { color: '#5d5f68', fontSize: 11, fontWeight: '600', maxWidth: '100%' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  pressed: { opacity: 0.7 },
});
