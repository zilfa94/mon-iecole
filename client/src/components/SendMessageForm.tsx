import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Paperclip, X, File as FileIcon } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useRef, useState } from 'react';

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
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mutation = useMutation({
        mutationFn: (data: FormData) => sendMessage(threadId, data.content, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
            reset();
            setFiles([]);
            if (onSuccess) onSuccess();
        },
        onError: () => {
            toast.error("Impossible d'envoyer le message.");
        },
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Limit to 5 files total
            if (files.length + newFiles.length > 5) {
                toast.error("Maximum 5 fichiers par message");
                return;
            }
            // Limit size (5MB per file) - backend check exists but good for UX
            if (newFiles.some(f => f.size > 5 * 1024 * 1024)) {
                toast.error("Fichier trop volumineux (max 5Mo)");
                return;
            }
            setFiles([...files, ...newFiles]);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t bg-white space-y-3">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            <FileIcon className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                >
                    <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>

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
                <Button type="submit" disabled={mutation.isPending} size="icon" className="shrink-0">
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </form>
    );
}
