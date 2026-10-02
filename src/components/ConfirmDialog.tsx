import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { font, theme } from '@/theme'

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  visible: boolean
  title: string
  body: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.ghost}>
              <Text style={styles.ghostText}>Отмена</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 25, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
  },
  title: {
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 28,
    lineHeight: 32,
  },
  body: {
    marginTop: 8,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  row: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  ghost: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  ghostText: {
    color: theme.muted,
    fontFamily: font.medium,
    fontSize: 16,
  },
  confirm: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
    justifyContent: 'center',
  },
  confirmText: {
    color: theme.accentText,
    fontFamily: font.semibold,
    fontSize: 16,
  },
})
