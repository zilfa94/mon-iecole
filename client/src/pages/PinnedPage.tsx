import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/types';

export function PinnedPage() {
    const { data, isLoading, error } = usePosts();

    const allPosts = data?.pages?.flatMap((page) => page.posts) ?? [];

    const pinnedPosts = allPosts
        .filter((post: Post) => post.isPinned)
        .sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Posts épinglés</h2>
            {pinnedPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun post épinglé</p>
            ) : (
                pinnedPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
}
