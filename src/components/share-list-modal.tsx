import { StyleSheet, Text, View } from 'react-native';

import { TaskList } from '@/domain/models';
import { useApp } from '@/state/app-context';

import { ModalFrame } from './modal-frame';
import { ActionButton } from './ui-buttons';

export function ShareListModal({
  list,
  onClose,
  onShareFile,
  onShareLink,
}: {
  list: TaskList | null;
  onClose: () => void;
  onShareFile: (list: TaskList) => void;
  onShareLink: (list: TaskList) => void;
}) {
  const { t } = useApp();
  return (
    <ModalFrame onClose={onClose} title={t('shareList')} visible={list !== null}>
      {list ? (
        <View style={styles.options}>
          <ActionButton
            icon="📄"
            label={t('shareJson')}
            onPress={() => onShareFile(list)}
            style={styles.button}
            variant="primary"
          />
          <Text style={styles.hint}>{t('shareJsonHint')}</Text>
          <ActionButton
            icon="🔗"
            label={t('shareLink')}
            onPress={() => onShareLink(list)}
            style={styles.button}
          />
          <Text style={styles.hint}>{t('shareLinkHint')}</Text>
          {list.tasks.some((task) => task.photo) ? (
            <Text style={styles.warning}>{t('photosOmitted')}</Text>
          ) : null}
        </View>
      ) : null}
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8 },
  button: { alignSelf: 'stretch' },
  hint: { color: '#756b69', fontSize: 13, marginBottom: 10, paddingHorizontal: 4 },
  warning: {
    color: '#8b553f',
    backgroundColor: '#fff0e6',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});
