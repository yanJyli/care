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

export function CriteriaScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { sectionById, addCriterion, removeCriterion } = useCatalog()
  const found = sectionById(id ?? '')
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
  const insets = useSafeAreaInsets()

  if (!found) {
    return <ScreenHeader title="Раздел не найден" onBack={() => goBack('/')} />
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        crumbs={['Care', found.category.title, found.section.title]}
        title={found.section.title}
        subtitle="Выберите критерий"
        onBack={() => goBack({ pathname: '/category/[id]', params: { id: found.category.id } })}
      />
      <TileGrid
        items={found.section.criteria}
        addLabel="Новый критерий"
        onPress={(criterionId) => router.push({ pathname: '/pick/[id]', params: { id: criterionId } })}
        onAdd={() => setAdding(true)}
        onDelete={(criterionId) => {
          const criterion = found.section.criteria.find((item) => item.id === criterionId)
          if (!criterion?.custom) return
          setPendingDelete({ id: criterion.id, title: criterion.title })
        }}
      />
      <AddDialog
        visible={adding}
        title="Новый критерий"
        onClose={() => setAdding(false)}
        onSubmit={(name) => {
          addCriterion(found.section.id, name, 'bead')
          setAdding(false)
        }}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Удалить критерий?"
        body={pendingDelete ? `«${pendingDelete.title}» исчезнет из списка.` : ''}
        confirmLabel="Удалить"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeCriterion(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </ScrollView>
  )
}
