import { router } from 'expo-router'

export function goBack(fallback: Parameters<typeof router.replace>[0]) {
  router.replace(fallback)
}
