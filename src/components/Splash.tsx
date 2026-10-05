import { useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, Text, View } from 'react-native'
import { font, theme } from '@/theme'

const HOLD_MS = 2000

export function Splash() {
  const opacity = useRef(new Animated.Value(1)).current
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) setVisible(false)
      })
    }, HOLD_MS)
    return () => clearTimeout(timer)
  }, [opacity])

  if (!visible) return null

  return (
    <Animated.View pointerEvents="auto" style={[styles.screen, { opacity }]}>
      <Text style={styles.mark}>Care</Text>
      <View style={styles.rule} />
      <Text style={styles.line}>Подбор уходовой косметики</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  mark: {
    color: theme.accent,
    fontFamily: font.semibold,
    fontSize: 42,
    letterSpacing: 6,
  },
  rule: {
    width: 36,
    height: 1,
    marginTop: 18,
    backgroundColor: theme.line,
  },
  line: {
    marginTop: 16,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 16,
  },
})
