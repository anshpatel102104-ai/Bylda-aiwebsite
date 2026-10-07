/** Lets other sections (loop cards) open a specific tour tab. */
type Listener = (i: number) => void
const listeners = new Set<Listener>()
export const onTourSelect = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l) } }
export const selectTourTab = (i: number) => listeners.forEach(l => l(i))
