import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '@/theme'

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>{children}</View>
    </View>
  )
}
