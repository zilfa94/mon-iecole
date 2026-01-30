import { useToastStore } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "flex items-center gap-2 rounded-lg border p-4 shadow-lg min-w-[300px] animate-in slide-in-from-top-5",
                        {
                            "bg-green-50 border-green-200 text-green-900": toast.type === 'success',
                            "bg-red-50 border-red-200 text-red-900": toast.type === 'error',
                            "bg-blue-50 border-blue-200 text-blue-900": toast.type === 'info',
                        }
                    )}
                >
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-current opacity-70 hover:opacity-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
