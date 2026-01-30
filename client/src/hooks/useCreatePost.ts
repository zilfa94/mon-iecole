import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CreatePostData } from '@/types';
import { toast } from '@/lib/toast';

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePostData & { files?: File[] }) => {
            const formData = new FormData();
            formData.append('content', data.content);
            formData.append('type', data.type);
            if (data.classId && data.classId !== 'all') {
                formData.append('classId', data.classId);
            }

            // Append files if any
            if (data.files && data.files.length > 0) {
                data.files.forEach(file => {
                    formData.append('files', file);
                });
            }

            const response = await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        onMutate: async (newPost) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // Snapshot the previous value
            const previousPosts = queryClient.getQueryData(['posts']);

            // Optimistically update to the new value
            // Note: This is a simplified version. In reality, useInfiniteQuery structure is more complex
            // We're just showing the concept here
            queryClient.setQueryData(['posts'], (old: any) => {
                if (!old) return old;

                // For infinite query, we need to update the first page
                const optimisticPost = {
                    id: Date.now(), // Temporary ID
                    content: newPost.content,
                    type: newPost.type,
                    isPinned: false,
                    createdAt: new Date().toISOString(),
                    author: {
                        id: 0, // Will be replaced by real data
                        firstName: 'Vous',
                        lastName: '',
                        role: 'STUDENT' as const
                    },
                    attachments: [],
                    comments: []
                };

                // Update first page with optimistic post
                return {
                    ...old,
                    pages: old.pages.map((page: any, index: number) =>
                        index === 0
                            ? { ...page, posts: [optimisticPost, ...page.posts] }
                            : page
                    )
                };
            });

            // Return context with snapshot
            return { previousPosts };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post créé avec succès');
        },
        onError: (error: any, newPost, context) => {
            // Rollback to previous value on error
            if (context?.previousPosts) {
                queryClient.setQueryData(['posts'], context.previousPosts);
            }

            const status = error.response?.status;
            const message = error.response?.data?.error;

            if (status === 400) {
                toast.error(message || 'Type de post invalide');
            } else if (status === 403) {
                toast.error('Vous n\'êtes pas autorisé à créer des posts');
            } else {
                toast.error('Erreur lors de la création du post');
            }
        },
    });
}
