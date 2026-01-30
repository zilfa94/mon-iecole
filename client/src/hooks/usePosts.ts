import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Post } from '@/types';

export function usePosts() {
    return useQuery<Post[]>({
        queryKey: ['posts'],
        queryFn: async () => {
            const response = await api.get('/posts');
            return response.data;
        },
    });
}
