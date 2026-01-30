import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CreatePostData } from '@/types';
import { toast } from '@/lib/toast';

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePostData) => {
            const response = await api.post('/posts', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post créé avec succès');
        },
        onError: (error: any) => {
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
