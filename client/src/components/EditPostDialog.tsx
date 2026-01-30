import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Post } from '@/types';

const editPostSchema = z.object({
    content: z.string().min(1, 'Le contenu est requis'),
    type: z.enum(['SCOLARITE', 'ACTIVITE', 'URGENT', 'GENERAL']),
});

type EditPostFormData = z.infer<typeof editPostSchema>;

interface EditPostDialogProps {
    post: Post;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({ post, open, onOpenChange }: EditPostDialogProps) {
    const { mutate: updatePost, isPending } = useUpdatePost();

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EditPostFormData>({
        resolver: zodResolver(editPostSchema),
        defaultValues: {
            content: post.content,
            type: post.type,
        }
    });

    const selectedType = watch('type');

    const onSubmit = (data: EditPostFormData) => {
        updatePost(
            { id: post.id, data },
            {
                onSuccess: () => {
                    onOpenChange(false);
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Modifier le post</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Type de post</label>
                        <Select
                            value={selectedType}
                            onValueChange={(value) => setValue('type', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SCOLARITE">Scolarité</SelectItem>
                                <SelectItem value="ACTIVITE">Activité</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                                <SelectItem value="GENERAL">Général</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Contenu</label>
                        <Textarea
                            {...register('content')}
                            placeholder="Écrivez votre message..."
                            rows={6}
                            className="resize-none"
                        />
                        {errors.content && (
                            <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Modification...' : 'Modifier'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
