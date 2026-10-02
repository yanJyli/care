import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { tileImageFor } from '@/lib/tileImages'
import { font, theme } from '@/theme'

export type TileItem = {
  id: string
  title: string
  custom?: boolean
  image?: string
}

export function TileGrid({
  items,
  addLabel,
  onPress,
  onAdd,
  onDelete,
}: {
  items: TileItem[]
  addLabel?: string
  onPress: (id: string) => void
  onAdd?: () => void
  onDelete?: (id: string) => void
}) {
  const { width } = useWindowDimensions()
  const board = Math.min(width, 520)
  const size = (board - 40 - 12) / 2
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <Tile
            key={item.id}
            index={index}
            item={item}
            size={size}
            onPress={() => onPress(item.id)}
            onDelete={item.custom && onDelete ? () => onDelete(item.id) : undefined}
          />
        ))}
        {onAdd && addLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            onPress={onAdd}
            style={({ pressed }) => [styles.tile, styles.add, { width: size, height: size }, pressed && styles.pressed]}
          >
            <Text style={styles.plus}>+</Text>
            <Text numberOfLines={3} style={styles.title}>{addLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function Tile({
  item,
  index,
  size,
  onPress,
  onDelete,
}: {
  item: TileItem
  index: number
  size: number
  onPress: () => void
  onDelete?: () => void
}) {
  const image = tileImageFor(item.id, item.title, item.image)
  const [pressed, setPressed] = useState(false)
  return (
    <View
      style={[
        styles.tile,
        image ? styles.photo : null,
        { width: size, height: size },
        pressed && (image ? styles.photoPressed : styles.pressed),
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.hit}
      />
      {image ? (
        <View style={styles.productFrame} pointerEvents="none">
          <Image source={image} style={styles.product} resizeMode="contain" />
        </View>
      ) : null}
      {/* <Text style={image ? styles.indexOnPhoto : styles.index}>{String(index + 1).padStart(2, '0')}</Text> */}
      <Text numberOfLines={3} pointerEvents="none" style={image ? styles.titleOnPhoto : styles.title}>
        {item.title}
      </Text>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Удалить ${item.title}`}
          hitSlop={8}
          onPress={onDelete}
          style={styles.remove}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    justifyContent: 'space-between',
  },
  hit: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
  },
  add: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  pressed: {
    backgroundColor: '#EFEAE2',
  },
  index: {
    color: theme.accent,
    fontFamily: font.medium,
    fontSize: 13,
    letterSpacing: 1,
  },
  plus: {
    color: theme.accent,
    fontFamily: font.regular,
    fontSize: 32,
    lineHeight: 34,
  },
  title: {
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  photo: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  photoPressed: {
    opacity: 0.92,
  },
  productFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  product: {
    width: '78%',
    height: '100%',
  },
  indexOnPhoto: {
    color: theme.muted,
    fontFamily: font.medium,
    fontSize: 12,
    letterSpacing: 1,
  },
  titleOnPhoto: {
    color: theme.ink,
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  remove: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  removeText: {
    color: theme.ink,
    fontFamily: font.medium,
    fontSize: 18,
    lineHeight: 20,
  },
})
