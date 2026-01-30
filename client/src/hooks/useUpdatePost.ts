import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface UpdatePostData {
    content: string;
    type?: string;
    classId?: string;
}

export function useUpdatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdatePostData }) => {
            const response = await api.patch(`/posts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erreur lors de la modification');
        }
    });
}
