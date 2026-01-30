import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

const schema = z.object({
    content: z.string().min(1, 'Le message ne peut pas être vide').max(2000, 'Message trop long'),
});

type FormData = z.infer<typeof schema>;

interface SendMessageFormProps {
    threadId: number;
    onSuccess?: () => void;
}

export function SendMessageForm({ threadId, onSuccess }: SendMessageFormProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: FormData) => sendMessage(threadId, data.content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
            reset();
            if (onSuccess) onSuccess();
        },
        onError: () => {
            toast.error("Impossible d'envoyer le message.");
        },
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t bg-white">
            <div className="flex gap-2">
                <Textarea
                    placeholder="Écrivez votre message..."
                    className="resize-none min-h-[40px] max-h-[120px]"
                    {...register('content')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(onSubmit)();
                        }
                    }}
                />
                <Button type="submit" disabled={mutation.isPending} size="icon">
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </form>
    );
}
