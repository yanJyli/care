import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AddDialog } from '@/components/AddDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TileGrid } from '@/components/TileGrid'
import { goBack } from '@/lib/back'
import { useCatalog } from '@/lib/store'

export function CategoryScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { categoryById, addSection, removeSection } = useCatalog()
  const category = categoryById(id ?? '')
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
  const insets = useSafeAreaInsets()

  if (!category) {
    return <ScreenHeader title="Раздел не найден" onBack={() => goBack('/')} />
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        crumbs={['Care', category.title]}
        title={category.title}
        subtitle="Выберите тип средства"
        onBack={() => goBack('/')}
      />
      <TileGrid
        items={category.sections}
        addLabel="Новый раздел"
        onPress={(sectionId) => router.push({ pathname: '/section/[id]', params: { id: sectionId } })}
        onAdd={() => setAdding(true)}
        onDelete={(sectionId) => {
          const section = category.sections.find((item) => item.id === sectionId)
          if (!section?.custom) return
          setPendingDelete({ id: section.id, title: section.title })
        }}
      />
      <AddDialog
        visible={adding}
        title="Новый раздел"
        onClose={() => setAdding(false)}
        onSubmit={(name) => {
          addSection(category.id, name, 'bloom')
          setAdding(false)
        }}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Удалить раздел?"
        body={pendingDelete ? `«${pendingDelete.title}» и его критерии исчезнут из списка.` : ''}
        confirmLabel="Удалить"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeSection(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </ScrollView>
  )
}
