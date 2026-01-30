import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '@/hooks/useCreatePost';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const createPostSchema = z.object({
    content: z.string().min(1, 'Le contenu est requis').max(1000, 'Maximum 1000 caractères'),
    type: z.enum(['SCOLARITE', 'ACTIVITE', 'URGENT', 'GENERAL']),
});

type CreatePostData = z.infer<typeof createPostSchema>;

export function CreatePostForm() {
    const createPost = useCreatePost();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control
    } = useForm<CreatePostData>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            type: 'GENERAL',
        },
    });

    const onSubmit = (data: CreatePostData) => {
        createPost.mutate(data, {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Créer un post</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="content">Contenu</Label>
                        <Textarea
                            id="content"
                            placeholder="Écrivez votre message..."
                            rows={4}
                            {...register('content')}
                        />
                        {errors.content && (
                            <p className="text-sm text-red-600">{errors.content.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type de post</Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GENERAL">Général</SelectItem>
                                        <SelectItem value="SCOLARITE">Scolarité</SelectItem>
                                        <SelectItem value="ACTIVITE">Activité</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.type && (
                            <p className="text-sm text-red-600">{errors.type.message}</p>
                        )}
                    </div>

                    <Button type="submit" disabled={createPost.isPending}>
                        {createPost.isPending ? 'Publication...' : 'Publier'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
