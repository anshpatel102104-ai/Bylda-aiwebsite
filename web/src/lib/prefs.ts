import { useEffect, useState, useSyncExternalStore } from 'react'

/** Site-wide "Pause animations" preference, persisted to localStorage. */
const KEY = 'bylda:pause-animations'
const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
let current = typeof window === 'undefined' ? false : read()

export function setPauseAnimations(v: boolean) {
  current = v
  try {
    window.localStorage.setItem(KEY, v ? '1' : '0')
  } catch {
    /* storage blocked: keep the in-memory value */
  }
  document.documentElement.toggleAttribute('data-paused', v)
  listeners.forEach(l => l())
}

export function usePauseAnimations() {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb) },
    () => current,
    () => false,
  )
}

export function useReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)'
  // Starts false so the prerendered HTML and the first client render match.
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}
