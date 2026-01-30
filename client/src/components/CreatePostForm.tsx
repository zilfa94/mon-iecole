import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getMyClasses } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { X, Paperclip } from 'lucide-react';

const createPostSchema = z.object({
    content: z.string().min(1, 'Le contenu est requis').max(1000, 'Maximum 1000 caractères'),
    type: z.enum(['SCOLARITE', 'ACTIVITE', 'URGENT', 'GENERAL']),
    classId: z.string().optional(), // We use string for Select value, convert to number later
});

type CreatePostData = z.infer<typeof createPostSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

export function CreatePostForm() {
    const createPost = useCreatePost();
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string>('');

    // Fetch classes if Professor/Direction
    const { data: classes } = useQuery({
        queryKey: ['myClasses'],
        queryFn: getMyClasses,
        enabled: !!user && (user.role === 'PROFESSOR' || user.role === 'DIRECTION')
    });

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setFileError('');

        // Validate file count
        if (files.length + selectedFiles.length > MAX_FILES) {
            setFileError(`Maximum ${MAX_FILES} fichiers autorisés`);
            return;
        }

        // Validate file sizes
        const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            setFileError('Certains fichiers dépassent 5MB');
            return;
        }

        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = ''; // Reset input
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = (data: CreatePostData) => {
        createPost.mutate({ ...data, files: selectedFiles }, {
            onSuccess: () => {
                reset();
                setSelectedFiles([]);
                setFileError('');
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

                    {(user?.role === 'PROFESSOR' || user?.role === 'DIRECTION') && classes && classes.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="classId">Cible (Optionnel)</Label>
                            <Controller
                                control={control}
                                name="classId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toute l'école / Mes Classes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toute l'école (Visible par tous)</SelectItem>
                                            {classes.map((cls: any) => (
                                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}

                    {/* File Upload Section */}
                    <div className="space-y-2">
                        <Label htmlFor="files">Pièces jointes (optionnel)</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('file-input')?.click()}
                                disabled={selectedFiles.length >= MAX_FILES}
                            >
                                <Paperclip className="h-4 w-4 mr-2" />
                                Ajouter des fichiers ({selectedFiles.length}/{MAX_FILES})
                            </Button>
                            <input
                                id="file-input"
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                        {fileError && (
                            <p className="text-sm text-red-600">{fileError}</p>
                        )}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                        <span className="truncate flex-1">{file.name}</span>
                                        <span className="text-gray-500 mx-2">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
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
