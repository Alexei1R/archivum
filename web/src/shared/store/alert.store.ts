import { create } from "zustand"
import type { AlertConfig } from "../types"

interface AlertStore {
    alerts: AlertConfig[]
    showAlert: (config: Omit<AlertConfig, 'id'>) => string
    closeAlert: (id: string) => void
    clearAll: () => void
}



export const useAlertStore = create<AlertStore>((set, get) => ({
    alerts: [],

    showAlert: (config) => {
        const id = crypto.randomUUID()
        const alert: AlertConfig = {
            id,
            type: 'info',
            confirmText: 'OK',
            cancelText: 'Cancel',
            showCancel: true,
            ...config,
        }

        set((state) => ({
            alerts: [...state.alerts, alert]
        }))

        if (alert.autoClose) {
            setTimeout(() => {
                get().closeAlert(id)
            }, alert.autoClose)
        }

        return id
    },

    closeAlert: (id) => {
        set((state) => ({
            alerts: state.alerts.filter(alert => alert.id !== id)
        }))
    },

    clearAll: () => set({ alerts: [] }),
}))
