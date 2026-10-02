import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TileGrid } from '@/components/TileGrid'
import { useCatalog } from '@/lib/store'
import { font, theme } from '@/theme'

export function HomeScreen() {
  const { categories } = useCatalog()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Care</Text>
        <Text style={styles.title}>Подбор косметики</Text>
        <Text style={styles.subtitle}>Выберите зону ухода</Text>
      </View>
      <TileGrid
        items={categories}
        onPress={(id) => router.push({ pathname: '/category/[id]', params: { id } })}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  kicker: {
    color: theme.accent,
    fontSize: 16,
    fontFamily: font.medium,
    fontWeight: '600',
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 10,
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 12,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 16,
  },
  note: {
    marginTop: 22,
    paddingHorizontal: 20,
    color: theme.muted,
    fontSize: 13,
  },
})
