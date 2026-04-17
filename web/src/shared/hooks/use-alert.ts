import { useAlertStore } from "../store"

export function useAlert() {
    const { showAlert } = useAlertStore()

    const confirm = (message: string, onConfirm?: () => void) => {
        return showAlert({
            message,
            onConfirm,
            showCancel: true,
        })
    }

    const info = (message: string, title?: string) => {
        return showAlert({
            message,
            title,
            type: 'info',
            showCancel: false,
        })
    }

    const success = (message: string, title?: string) => {
        return showAlert({
            message,
            title,
            type: 'success',
            showCancel: false,
            autoClose: 3000,
        })
    }

    const warning = (message: string, title?: string) => {
        return showAlert({
            message,
            title,
            type: 'warning',
            showCancel: false,
        })
    }

    const error = (message: string, title?: string) => {
        return showAlert({
            message,
            title,
            type: 'error',
            showCancel: false,
        })
    }

    const custom = (config: Parameters<typeof showAlert>[0]) => {
        return showAlert(config)
    }

    return {
        confirm,
        info,
        success,
        warning,
        error,
        custom,
    }
}
