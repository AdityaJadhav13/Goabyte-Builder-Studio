/**
 * Ownership of a single replaceable resource.
 *
 * The editor reducer is pure: `(state, action) => state`, no side effects. It
 * carries a reference to the current image but never disposes it. Disposal is
 * this module's job, driven by the controller.
 *
 * A slot holds at most one live resource. Adopting a new one releases the
 * previous exactly once. Everything here is idempotent, because the safety-net
 * unmount path can and does fire after an explicit disposal.
 *
 * ARCHITECTURE §8. Pure and framework-free — testable in plain Node.
 */

export interface Releasable {
  release(): void
}

export class ResourceSlot<T extends Releasable> {
  #current: T | null = null
  #disposed = false

  /**
   * Take ownership of `next`, releasing whatever was held before.
   *
   * The caller MUST invoke this in the same synchronous block as the state
   * update that publishes `next`. React batches synchronous updates, so no
   * render can observe the window in which the previous resource is released
   * but state still points at it.
   */
  adopt(next: T | null): void {
    if (this.#disposed) {
      // The slot is gone; whatever we were handed is orphaned, so release it
      // rather than leak it. Happens when an in-flight decode resolves after
      // the editor unmounts.
      next?.release()
      return
    }
    if (this.#current === next) return

    const previous = this.#current
    this.#current = next
    previous?.release()
  }

  /** The live resource, or null. Never returns a released resource. */
  peek(): T | null {
    return this.#current
  }

  get isDisposed(): boolean {
    return this.#disposed
  }

  /** Release and permanently close the slot. Idempotent. */
  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    const previous = this.#current
    this.#current = null
    previous?.release()
  }
}
