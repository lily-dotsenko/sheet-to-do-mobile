import { StyleSheet, Text, View } from 'react-native';

import { TaskList } from '@/domain/models';
import { TranslationKey } from '@/i18n/translations';
import { useApp } from '@/state/app-context';

import { ModalFrame } from './modal-frame';
import { ActionButton } from './ui-buttons';

export function ShareListModal({
  list,
  busy,
  onClose,
  onShareText,
  onShareSheetFile,
}: {
  list: TaskList | null;
  busy: boolean;
  onClose: () => void;
  onShareText: (list: TaskList) => void;
  onShareSheetFile: (list: TaskList) => void;
}) {
  const { t } = useApp();
  const option = (
    label: TranslationKey,
    hint: TranslationKey,
    action: () => void,
    primary = false,
  ) => (
    <View style={styles.option}>
      <ActionButton
        disabled={busy}
        label={t(label)}
        loading={busy && primary}
        onPress={action}
        style={styles.button}
        variant={primary ? 'primary' : 'soft'}
      />
      <Text style={styles.hint}>{t(hint)}</Text>
    </View>
  );
  return (
    <ModalFrame
      onClose={busy ? () => undefined : onClose}
      title={t('shareList')}
      visible={list !== null}
    >
      {list ? (
        <View style={styles.options}>
          {option('shareText', 'shareTextHint', () => onShareText(list))}
          {option('sharePackage', 'sharePackageHint', () => onShareSheetFile(list), true)}
        </View>
      ) : null}
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  options: { gap: 4 },
  option: { gap: 6, marginBottom: 8 },
  button: { alignSelf: 'stretch' },
  hint: { color: '#756b69', fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
});
