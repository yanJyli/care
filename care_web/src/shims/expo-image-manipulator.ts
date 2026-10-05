export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
}

type SaveResult = { base64?: string }

export const ImageManipulator = {
  manipulate(_uri: string) {
    return {
      resize(_size: { width?: number; height?: number }) {
        return this
      },
      async renderAsync() {
        return {
          async saveAsync(_options?: { compress?: number; format?: string; base64?: boolean }): Promise<SaveResult> {
            return {}
          },
        }
      },
    }
  },
}
