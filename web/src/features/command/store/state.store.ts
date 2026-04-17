import { create } from "zustand"

interface CommandState {
    open: boolean
    openPalette: () => void
    closePalette: () => void
    togglePalette: () => void
}

export const useCommandState = create<CommandState>((set) => ({
    open: false,
    openPalette: () => set({ open: true }),
    closePalette: () => set({ open: false }),
    togglePalette: () => set(state => ({ open: !state.open })),
}))
