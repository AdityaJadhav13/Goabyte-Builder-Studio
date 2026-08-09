import qrcode from 'qrcode-generator'

/** Stable destination encoded into every Builder ID. */
export const BUILDER_STUDIO_QR_URL = 'https://goabyte-builder-studio.vercel.app'

export type QrMatrix = readonly (readonly boolean[])[]

/**
 * Produce a real QR module matrix without touching the DOM, network or canvas.
 * Error correction M gives the poster enough resilience for social-media
 * compression while keeping modules comfortably large at 1080×1350.
 */
export function createQrMatrix(value: string): QrMatrix {
  const code = qrcode(0, 'M')
  code.addData(value, 'Byte')
  code.make()

  const count = code.getModuleCount()
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => code.isDark(row, column)),
  )
}

export const BUILDER_STUDIO_QR = createQrMatrix(BUILDER_STUDIO_QR_URL)
