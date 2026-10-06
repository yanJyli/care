import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ScreenHeader } from '@/components/ScreenHeader'
import { goBack } from '@/lib/back'
import { readComposer, submitsOnEnter } from '@/lib/composer'
import { consult } from '@/lib/consult'
import { createId } from '@/lib/ids'
import { imagePayload } from '@/lib/readLabel'
import { useCatalog } from '@/lib/store'
import { shortVerdict } from '@/lib/analyze'
import { answerSection, splitAnswerPoint } from '@/lib/answerView'
import { chatIntro } from '@/lib/chatIntro'
import { font, theme } from '@/theme'
import type { ChatMessage, ProductReport } from '@/types'

export function PickScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { criterionById, sessionFor, updateSession, clearSession } = useCatalog()
  const found = criterionById(id ?? '')
  const session = sessionFor(id ?? '')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<'photo' | 'reply'>('reply')
  const [shots, setShots] = useState<Record<string, string>>({})
  const [photoHint, setPhotoHint] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const generation = useRef(0)
  const sending = useRef(false)
  const scrollRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  if (!found || !id) {
    return <ScreenHeader title="Критерий не найден" onBack={() => goBack('/')} />
  }

  const criterion = found.criterionTitle
  const sectionTitle = found.section.title
  const sectionId = found.section.id
  const zoneTitle = found.category.title

  function scrollDown() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40)
  }

  async function send() {
    const read = readComposer(draft)
    if (!read.query || sending.current) return
    sending.current = true
    const ticket = generation.current
    setPhase('reply')
    const userMessage: ChatMessage = {
      id: createId('m'),
      role: 'user',
      paragraphs: read.formula ? [read.question ? read.query : read.name || 'Свой состав', 'Состав указан вручную'] : [read.query],
    }
    setDraft('')
    setBusy(true)
    updateSession(id, (current) => ({ ...current, messages: [...current.messages, userMessage] }))
    scrollDown()
    try {
      const result = await consult({
        query: read.query,
        criterion,
        section: sectionTitle,
        sectionId,
        zone: zoneTitle,
        previous: session.products,
        history: [...session.messages, userMessage],
        formula: read.formula,
      })
      if (ticket !== generation.current) return
      const assistant: ChatMessage = {
        id: createId('m'),
        role: 'assistant',
        paragraphs: result.paragraphs,
        redirect: result.redirect,
      }
      updateSession(id, (current) => ({
        messages: [...current.messages, assistant],
        products: result.product ? [...current.products, result.product] : current.products,
      }))
      scrollDown()
    } finally {
      sending.current = false
      if (ticket === generation.current) setBusy(false)
    }
  }

  async function sendPhoto(source: 'camera' | 'library') {
    if (sending.current) return
    setPhotoHint('')
    const picked = await pickPhoto(source)
    if (!picked) return
    if (picked.hint) {
      setPhotoHint(picked.hint)
      return
    }
    if (!picked.photo || !picked.preview) return

    sending.current = true
    const ticket = generation.current
    const userMessage: ChatMessage = {
      id: createId('m'),
      role: 'user',
      paragraphs: ['Фото упаковки'],
    }
    setShots((current) => ({ ...current, [userMessage.id]: picked.preview! }))
    setPhase('photo')
    setBusy(true)
    updateSession(id, (current) => ({ ...current, messages: [...current.messages, userMessage] }))
    scrollDown()
    try {
      const result = await consult({
        query: 'Фото упаковки',
        criterion,
        section: sectionTitle,
        sectionId,
        zone: zoneTitle,
        previous: session.products,
        history: [...session.messages, userMessage],
        formula: '',
        photo: picked.photo,
      })
      if (ticket !== generation.current) return
      const title = result.product?.name.trim()
      if (title) {
        const named: ChatMessage = { ...userMessage, paragraphs: [title, 'Прочитано с фото'] }
        updateSession(id, (current) => ({
          ...current,
          messages: current.messages.map((message) => (message.id === userMessage.id ? named : message)),
        }))
      }
      const assistant: ChatMessage = {
        id: createId('m'),
        role: 'assistant',
        paragraphs: result.paragraphs,
        redirect: result.redirect,
      }
      updateSession(id, (current) => ({
        messages: [...current.messages, assistant],
        products: result.product && !result.redirect ? [...current.products, result.product] : current.products,
      }))
      scrollDown()
    } finally {
      sending.current = false
      if (ticket === generation.current) setBusy(false)
    }
  }

  function confirmClear() {
    generation.current += 1
    setBusy(false)
    setShots({})
    setPhotoHint('')
    setConfirmingClear(false)
    clearSession(id)
  }

  const canSend = draft.trim().length > 0 && !busy

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        crumbs={[
          { label: 'Care', onPress: () => goBack('/') },
          {
            label: found.category.title,
            onPress: () => goBack({ pathname: '/category/[id]', params: { id: found.category.id } }),
          },
          {
            label: found.section.title,
            onPress: () => goBack({ pathname: '/section/[id]', params: { id: found.section.id } }),
          },
          { label: criterion },
        ]}
        title={criterion}
        onBack={() => goBack({ pathname: '/section/[id]', params: { id: found.section.id } })}
        action={session.messages.length > 0 ? { label: 'Очистить', onPress: () => setConfirmingClear(true) } : undefined}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {session.products.length > 0 ? <Selected products={session.products} /> : null}
        {session.messages.length === 0 && !busy ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{chatIntro.title}</Text>
            <Text style={styles.emptyBody}>{chatIntro.lead}</Text>
            {chatIntro.points.map((point) => (
              <Text key={point} style={styles.emptyPoint}>
                {point}
              </Text>
            ))}
            <Text style={styles.emptyBody}>{chatIntro.tail}</Text>
          </View>
        ) : (
          <View style={styles.messages}>
            {session.messages.map((message) => (
              <Message key={message.id} message={message} preview={shots[message.id]} />
            ))}
            {busy ? (
              <View style={styles.assistant}>
                <Text style={styles.body}>{phase === 'photo' ? 'Смотрю упаковку…' : 'Отвечаю…'}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {session.products.length > 0 ? (
          <Text style={styles.compareHint}>Можно уточнить, вставить другой состав, назвать ещё один продукт или сфотографировать упаковку. С лицевой стороны состав ищется на официальном сайте бренда.</Text>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Состав, продукт или вопрос"
            placeholderTextColor={theme.muted}
            underlineColorAndroid="transparent"
            style={styles.input}
            editable={!busy}
            multiline
            textAlignVertical="top"
            blurOnSubmit={submitsOnEnter(draft)}
            onSubmitEditing={() => {
              if (submitsOnEnter(draft)) void send()
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отправить"
            disabled={!canSend}
            onPress={() => void send()}
            style={[styles.send, !canSend && styles.sendOff]}
          >
            <Text style={styles.sendText}>→</Text>
          </Pressable>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Сфотографировать упаковку" disabled={busy} onPress={() => void sendPhoto('camera')}>
            <Text style={[styles.source, busy && styles.sourceOff]}>Камера</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Выбрать фото из галереи" disabled={busy} onPress={() => void sendPhoto('library')}>
            <Text style={[styles.source, busy && styles.sourceOff]}>Галерея</Text>
          </Pressable>
        </View>
        {photoHint ? <Text style={styles.photoHint}>{photoHint}</Text> : null}
      </View>
      <ConfirmDialog
        visible={confirmingClear}
        title="Очистить подбор?"
        body="Выбранные продукты и разбор будут удалены."
        confirmLabel="Очистить"
        onClose={() => setConfirmingClear(false)}
        onConfirm={confirmClear}
      />
    </KeyboardAvoidingView>
  )
}

async function pickPhoto(source: 'camera' | 'library') {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) return { hint: 'Нет доступа к камере. Разрешите его в настройках телефона.' }
    } else if (Platform.OS === 'ios') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) return { hint: 'Нет доступа к фото. Разрешите его в настройках телефона.' }
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4 })
    if (result.canceled || !result.assets[0]) return null
    const asset = result.assets[0]
    const photo = await imagePayload(asset)
    if (!photo) return { hint: 'Это фото не удалось прочитать. Попробуйте другое.' }
    return { photo, preview: asset.uri }
  } catch {
    return {
      hint: source === 'camera' ? 'Камера не открылась. Попробуйте ещё раз.' : 'Галерея не открылась. Попробуйте ещё раз.',
    }
  }
}

function Selected({ products }: { products: ProductReport[] }) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {products.map((product, index) => (
          <View key={product.id} style={styles.product}>
            <Text style={styles.productIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text numberOfLines={2} style={styles.productName}>
              {product.name}
            </Text>
            {product.ingredients ? (
              <Text numberOfLines={1} style={styles.productMeta}>
                {product.brand ? `${product.brand} · ` : ''}
                {shortVerdict(product)}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function Message({ message, preview }: { message: ChatMessage; preview?: string }) {
  if (message.role === 'user') {
    return (
      <View style={styles.user}>
        {preview ? <Image source={{ uri: preview }} style={styles.shot} accessibilityIgnoresInvertColors /> : null}
        <Text style={styles.userText}>{message.paragraphs[0]}</Text>
        {message.paragraphs[1] ? <Text style={styles.userNote}>{message.paragraphs[1]}</Text> : null}
      </View>
    )
  }
  return (
    <View style={styles.assistant}>
      {message.paragraphs.map((paragraph, index) => (
        <AssistantLine key={`${message.id}-${index}`} text={paragraph} spaced={index > 0} />
      ))}
      {message.redirect ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: message.redirect!.pathname, params: { id: message.redirect!.id } })}
          style={styles.redirect}
        >
          <Text style={styles.redirectText}>{message.redirect.label}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function AssistantLine({ text, spaced }: { text: string; spaced: boolean }) {
  const section = answerSection(text)
  if (section) {
    return (
      <Text
        style={[
          styles.section,
          section.tone === 'minus' && styles.sectionMinus,
          section.tone === 'group' && styles.sectionGroup,
          spaced && (section.tone === 'group' ? styles.sectionGroupGap : styles.sectionGap),
        ]}
      >
        {section.label}
      </Text>
    )
  }
  const point = splitAnswerPoint(text)
  if (point) {
    return (
      <Text selectable style={[styles.body, spaced && styles.gap]}>
        <Text style={styles.pointName}>{point.name}</Text>
        {' — '}
        {point.rest}
      </Text>
    )
  }
  return (
    <Text selectable style={[styles.body, spaced && styles.gap]}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  kicker: {
    color: theme.accent,
    fontSize: 12,
    fontFamily: font.medium,
    letterSpacing: 1.4,
  },
  strip: {
    gap: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  product: {
    width: 168,
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    padding: 14,
    justifyContent: 'space-between',
  },
  productIndex: {
    color: theme.accent,
    fontSize: 12,
    fontFamily: font.medium,
    letterSpacing: 1,
  },
  productName: {
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 18,
    lineHeight: 22,
  },
  productMeta: {
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  empty: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    padding: 18,
  },
  emptyTitle: {
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 26,
    lineHeight: 30,
  },
  emptyBody: {
    marginTop: 8,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  emptyPoint: {
    marginTop: 8,
    color: theme.ink,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  messages: {
    marginTop: 16,
    gap: 10,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    backgroundColor: theme.accent,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    color: theme.accentText,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  userNote: {
    marginTop: 4,
    color: theme.accentText,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.75,
  },
  assistant: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: theme.card,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lead: {
    fontFamily: font.semibold,
  },
  body: {
    color: theme.ink,
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    color: theme.accent,
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionMinus: {
    color: '#8C4A3A',
  },
  sectionGroup: {
    fontSize: 15,
  },
  sectionGap: {
    marginTop: 16,
  },
  sectionGroupGap: {
    marginTop: 12,
  },
  pointName: {
    fontFamily: font.semibold,
  },
  gap: {
    marginTop: 8,
  },
  composerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  compareHint: {
    marginBottom: 8,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 13,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.ink,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
    outlineStyle: 'solid',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {
    opacity: 0.35,
  },
  sendText: {
    color: theme.accentText,
    fontFamily: font.medium,
    fontSize: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  source: {
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 15,
    paddingVertical: 4,
  },
  sourceOff: {
    opacity: 0.35,
  },
  photoHint: {
    marginTop: 4,
    color: theme.muted,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  shot: {
    width: 168,
    height: 126,
    borderRadius: 12,
    marginBottom: 8,
  },
  redirect: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: theme.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  redirectText: {
    color: theme.accentText,
    fontFamily: font.medium,
    fontSize: 14,
  },
})
