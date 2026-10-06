import { useSyncExternalStore } from 'react'

/** Tiny shared state for the request-access modal and toasts. */
interface State { access: { open: boolean; email: string; source: string }; toast: { id: number; text: string } | null }
let state: State = { access: { open: false, email: '', source: '' }, toast: null }
const listeners = new Set<() => void>()
const set = (next: Partial<State>) => { state = { ...state, ...next }; listeners.forEach(l => l()) }

export const useSite = () => useSyncExternalStore(
  cb => { listeners.add(cb); return () => listeners.delete(cb) },
  () => state,
  () => state,
)

export function openAccess(email = '', source = 'homepage') {
  set({ access: { open: true, email, source } })
}
export function closeAccess() {
  set({ access: { ...state.access, open: false } })
}
let toastId = 0
export function showToast(text: string) {
  const id = ++toastId
  set({ toast: { id, text } })
  window.setTimeout(() => { if (state.toast?.id === id) set({ toast: null }) }, 4200)
}
