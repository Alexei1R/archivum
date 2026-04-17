import { useAlertStore } from '@/shared/store';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Alert } from '../ui/alert';
import { Button } from '../ui';

const iconMap = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
} as const;



type AlertType = keyof typeof iconMap;

const SystemAlert = () => {
    const { alerts, closeAlert } = useAlertStore();

    const handleConfirm = async (alert: any) => {
        if (alert.onConfirm) {
            await alert.onConfirm();
        }
        closeAlert(alert.id);
    };

    const handleCancel = (alert: any) => {
        if (alert.onCancel) {
            alert.onCancel();
        }
        closeAlert(alert.id);
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="space-y-4 max-w-lg">
                {alerts.map((alert) => {
                    const alertType = (alert.type || 'info') as AlertType;
                    const Icon = iconMap[alertType];

                    return (
                        <Alert key={alert.id} className="p-6">
                            <Icon className="size-5" />
                            {alert.title && (
                                <Alert.Title className="text-base">{alert.title}</Alert.Title>
                            )}
                            <Alert.Description>
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed">{alert.message}</p>
                                    <div className="flex gap-3 justify-end pt-2">
                                        {alert.showCancel && (
                                            <Button
                                                onClick={() => handleCancel(alert)}
                                                variant="outline"
                                            >
                                                {alert.cancelText || 'Cancel'}
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleConfirm(alert)}
                                        >
                                            {alert.confirmText || 'OK'}
                                        </Button>
                                    </div>
                                </div>
                            </Alert.Description>
                        </Alert>
                    );
                })}
            </div>
        </div>
    );
}

export default SystemAlert;
