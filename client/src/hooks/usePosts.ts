import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PostsResponse } from '@/types';

export function usePosts(classId?: number | null) {
    return useInfiniteQuery<PostsResponse>({
        queryKey: ['posts', classId],
        queryFn: async ({ pageParam = 1 }) => {
            const params: any = { page: pageParam, limit: 20 };
            if (classId) {
                params.classId = classId;
            }

            const response = await api.get('/posts', { params });
            return response.data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
        },
        initialPageParam: 1,
        refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    });
}
