import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CatalogProvider } from '@/lib/store'
import { Splash } from '@/components/Splash'
import { theme } from '@/theme'

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  })

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CatalogProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: 'slide_from_right',
          }}
        />
      </CatalogProvider>
      <Splash />
    </SafeAreaProvider>
  )
}
