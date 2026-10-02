import { Pressable, StyleSheet, Text, View } from 'react-native'
import { font, theme } from '@/theme'

type Action = { label: string; onPress: () => void }

export function ScreenHeader({
  crumbs,
  title,
  subtitle,
  onBack,
  action,
}: {
  crumbs?: string[]
  title: string
  subtitle?: string
  onBack?: () => void
  action?: Action
}) {
  const trail = crumbs?.map((item) => item.toUpperCase()).join(' · ')
  return (
    <View style={styles.wrap}>
      {onBack || action ? (
        <View style={styles.row}>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={8} onPress={onBack} style={styles.back}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {action ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={action.onPress}>
              <Text style={styles.action}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {trail ? <Text style={styles.crumbs}>{trail}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  row: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    minHeight: 36,
    minWidth: 44,
    justifyContent: 'center',
  },
  backText: {
    color: theme.accent,
    fontFamily: font.medium,
    fontSize: 28,
    lineHeight: 32,
    transform: [{ scaleX: 1.45 }],
  },
  action: {
    color: theme.muted,
    fontFamily: font.medium,
    fontSize: 15,
  },
  crumbs: {
    marginTop: 8,
    color: theme.accent,
    fontFamily: font.medium,
    fontSize: 14,
    letterSpacing: 1.8,
    lineHeight: 18,
  },
  title: {
    marginTop: 6,
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 32,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 8,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
  },
})
