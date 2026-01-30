import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreatePost } from '@/hooks/useCreatePost';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getMyClasses } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { X, Image as ImageIcon, FileText, Smile } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const createPostSchema = z.object({
    content: z.string().min(1, 'Le contenu est requis').max(1000, 'Maximum 1000 caractères'),
    type: z.enum(['SCOLARITE', 'ACTIVITE', 'URGENT', 'GENERAL']),
    classId: z.string().optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

export function CreatePostForm() {
    const createPost = useCreatePost();
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(false);

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
        if (files.length + selectedFiles.length > MAX_FILES) {
            setFileError(`Maximum ${MAX_FILES} fichiers autorisés`);
            return;
        }
        const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            setFileError('Certains fichiers dépassent 5MB');
            return;
        }
        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = '';
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
                setIsExpanded(false);
            },
        });
    };

    return (
        <Card className="mb-4 border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors flex items-center"
                            onClick={() => setIsExpanded(true)}
                        >
                            {!isExpanded ? (
                                <span>Quoi de neuf, {user?.firstName} ?</span>
                            ) : (
                                <Input
                                    autoFocus
                                    className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto placeholder:text-gray-500"
                                    placeholder={`Quoi de neuf, ${user?.firstName} ?`}
                                    {...register('content')}
                                />
                            )}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* Category and Audience Selectors (if applies) */}
                            <div className="flex gap-2">
                                <Controller
                                    control={control}
                                    name="type"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-100 border-none rounded-full">
                                                <SelectValue placeholder="Type" />
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

                                {(user?.role === 'PROFESSOR' || user?.role === 'DIRECTION') && classes && classes.length > 0 && (
                                    <Controller
                                        control={control}
                                        name="classId"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-100 border-none rounded-full">
                                                    <SelectValue placeholder="Audience" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Toute l'école</SelectItem>
                                                    {classes.map((cls: any) => (
                                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                )}
                            </div>

                            {/* File Previews */}
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <div className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1">
                                                <span className="max-w-[100px] truncate">{file.name}</span>
                                                <button onClick={() => removeFile(index)} type="button" className="text-gray-500 hover:text-red-500">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                                <div className="flex gap-1">
                                    <p className="text-sm font-medium mr-2 hidden md:block">Ajouter à votre post :</p>
                                    <div className="flex gap-0.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-green-600 rounded-full hover:bg-gray-100"
                                            onClick={() => document.getElementById('file-input')?.click()}
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-blue-600 rounded-full hover:bg-gray-100"
                                            onClick={() => document.getElementById('file-input')?.click()}
                                        >
                                            <FileText className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-yellow-500 rounded-full hover:bg-gray-100"
                                        >
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <input
                                        id="file-input"
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            reset();
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={createPost.isPending} className="px-6 rounded-full font-semibold">
                                        {createPost.isPending ? '...' : 'Publier'}
                                    </Button>
                                </div>
                            </div>
                            {fileError && <p className="text-xs text-red-600">{fileError}</p>}
                            {errors.content && <p className="text-xs text-red-600">{errors.content.message}</p>}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
