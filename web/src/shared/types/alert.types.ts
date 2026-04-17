
interface AlertConfig {
    id: string
    title?: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
    showCancel?: boolean
    autoClose?: number
}


export type { AlertConfig }
