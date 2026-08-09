'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  reviveSlot,
  type Releasable,
  type ResourceSlot,
} from '@/lib/resource/resource-slot'

/**
 * A ResourceSlot that survives a remount.
 *
 * Returns an accessor rather than the slot itself: the slot must be resolved
 * at the moment of use, because by then it may have been disposed by a
 * cleanup that has already run. See `reviveSlot` for why.
 *
 * `isLive()` distinguishes Strict Mode's rehearsed unmount from a real one.
 * After the rehearsal the effect re-runs and re-arms the flag; after a genuine
 * unmount it stays false, so an async pipeline that resolves late releases its
 * result instead of resurrecting a slot nobody will ever dispose.
 */
export function useResourceSlot<T extends Releasable>(): {
  readonly get: () => ResourceSlot<T>
  readonly isLive: () => boolean
} {
  const ref = useRef<ResourceSlot<T> | null>(null)
  const liveRef = useRef(true)

  useEffect(() => {
    liveRef.current = true
    return () => {
      liveRef.current = false
      ref.current?.dispose()
    }
  }, [])

  const get = useCallback((): ResourceSlot<T> => {
    ref.current = reviveSlot<T>(ref.current)
    return ref.current
  }, [])

  const isLive = useCallback(() => liveRef.current, [])

  // Consumers place this accessor in callback dependency arrays. Returning a
  // fresh wrapper on every render made those callbacks unstable; the Builder
  // form then re-ran its debounced change effect after export and invalidated
  // the just-created share result even though no field had changed.
  return useMemo(() => ({ get, isLive }), [get, isLive])
}
