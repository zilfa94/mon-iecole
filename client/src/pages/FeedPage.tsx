import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';

export function FeedPage() {
    const { data: posts, isLoading, error } = usePosts();
    const { user } = useAuth();

    const canCreatePost = user && ['DIRECTION', 'PROFESSOR', 'STUDENT'].includes(user.role);

    // Tri : épinglés d'abord, puis par date décroissante
    const sortedPosts = posts
        ? [...posts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-red-600">Erreur lors du chargement des posts</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {canCreatePost && <CreatePostForm />}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Fil d'actualité</h2>
                {sortedPosts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun post pour le moment</p>
                ) : (
                    sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
                )}
            </div>
        </div>
    );
}
