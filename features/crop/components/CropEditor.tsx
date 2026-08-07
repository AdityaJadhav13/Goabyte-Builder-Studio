'use client'

import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'

/**
 * Crop, zoom and reposition. Thin wrapper over react-easy-crop.
 *
 * Reads `croppedArea` (percentages) rather than `croppedAreaPixels`, then
 * stores normalized 0–1 (FR-019). Pixel coordinates are implicitly bound to
 * whatever resolution was fed to the cropper, so a future change to
 * WORKING_MAX_EDGE would silently change what a stored crop means. Percentages
 * are resolution-independent by construction.
 *
 * The image source is `previewUrl` — an object URL owned by the NormalizedImage
 * and released with it. This component creates no resources of its own.
 */
export function CropEditor({
  image,
  aspect,
  crop,
  onCropChange,
}: {
  readonly image: NormalizedImage
  readonly aspect: number
  readonly crop: CropRect
  readonly onCropChange: (crop: CropRect) => void
}) {
  // react-easy-crop owns its own pan/zoom interaction state; the normalized
  // rect it emits is what we treat as the source of truth.
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  return (
    <div className="relative aspect-square w-full overflow-hidden border-2 border-ink bg-green-900">
      <Cropper
        image={image.previewUrl}
        crop={position}
        zoom={zoom}
        aspect={aspect}
        onCropChange={setPosition}
        onZoomChange={setZoom}
        onCropComplete={(area: Area) => {
          onCropChange({
            x: area.x / 100,
            y: area.y / 100,
            width: area.width / 100,
            height: area.height / 100,
          })
        }}
        initialCroppedAreaPercentages={{
          x: crop.x * 100,
          y: crop.y * 100,
          width: crop.width * 100,
          height: crop.height * 100,
        }}
        showGrid={false}
        objectFit="contain"
      />
    </div>
  )
}
