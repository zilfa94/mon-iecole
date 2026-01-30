import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Post } from '@/types';

export function usePosts(classId?: number | null) {
    return useQuery<Post[]>({
        queryKey: ['posts', classId],
        queryFn: async () => {
            const params = classId ? { classId } : {};
            // If classId is specifically null (explicit "Global"), we might want to pass something or just empty
            // But if classId is undefined (not set), it behaves as "All" for Direction/Profs

            const response = await api.get('/posts', { params });
            return response.data;
        },
    });
}
