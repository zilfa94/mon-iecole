import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery<User>({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const response = await api.get('/auth/me');
            return response.data.user;
        },
        retry: false,
        staleTime: Infinity, // Ne jamais considérer comme stale
    });

    const logout = useMutation({
        mutationFn: async () => {
            // Clear cookie côté serveur si endpoint existe, sinon juste clear local
            try {
                await api.post('/auth/logout');
            } catch {
                // Ignore errors
            }
        },
        onSuccess: () => {
            queryClient.clear();
            navigate('/login');
        },
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user && !error,
        logout: logout.mutate,
    };
}
