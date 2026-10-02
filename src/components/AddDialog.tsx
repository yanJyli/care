import { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { font, theme } from '@/theme'

export function AddDialog({
  visible,
  title,
  busy = false,
  onClose,
  onSubmit,
}: {
  visible: boolean
  title: string
  busy?: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (visible) setValue('')
  }, [visible])

  const name = value.trim()

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            autoFocus
            maxLength={40}
            placeholder="Название"
            placeholderTextColor={theme.muted}
            underlineColorAndroid="transparent"
            value={value}
            onChangeText={setValue}
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={styles.ghost}>
              <Text style={styles.ghostText}>Отмена</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!name || busy}
              onPress={() => onSubmit(name)}
              style={[styles.save, (!name || busy) && styles.disabled]}
            >
              <Text style={styles.saveText}>{busy ? 'Рисую…' : 'Добавить'}</Text>
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
  input: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    color: theme.ink,
    fontFamily: font.regular,
    fontSize: 16,
    backgroundColor: theme.bg,
    outlineStyle: 'solid',
    outlineWidth: 0,
    outlineColor: 'transparent',
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
  save: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
    justifyContent: 'center',
  },
  saveText: {
    color: theme.accentText,
    fontFamily: font.semibold,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.35,
  },
})
