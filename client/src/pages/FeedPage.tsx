import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyClasses } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function FeedPage() {
    const { user } = useAuth();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(selectedClassId);

    const { data: classes } = useQuery({
        queryKey: ['myClasses'],
        queryFn: getMyClasses,
        enabled: !!user && (user.role === 'PROFESSOR' || user.role === 'DIRECTION')
    });

    const canCreatePost = user && ['DIRECTION', 'PROFESSOR', 'STUDENT'].includes(user.role);

    // Flatten all pages into a single array of posts
    const allPosts = data?.pages.flatMap(page => page.posts) || [];

    // Posts are already sorted by backend (isPinned desc, createdAt desc)
    // No need to re-sort here

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
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Fil d'actualité</h2>

                    {(user?.role === 'PROFESSOR' || user?.role === 'DIRECTION') && classes && classes.length > 0 && (
                        <div className="w-48">
                            <Select
                                value={selectedClassId?.toString() || "all"}
                                onValueChange={(val) => setSelectedClassId(val === "all" ? null : parseInt(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrer par classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tout voir</SelectItem>
                                    {classes.map((cls: any) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {allPosts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun post pour le moment</p>
                ) : (
                    <>
                        {allPosts.map((post) => <PostCard key={post.id} post={post} />)}

                        {hasNextPage && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    variant="outline"
                                >
                                    {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
