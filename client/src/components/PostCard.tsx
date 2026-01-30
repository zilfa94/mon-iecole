import { useState } from 'react';
import type { Post as PostType } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pin, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/CommentSection';
import { EditPostDialog } from '@/components/EditPostDialog';
import { useDeletePost } from '@/hooks/useDeletePost';

interface PostCardProps {
    post: PostType;
}

const POST_TYPE_LABELS: Record<PostType['type'], string> = {
    SCOLARITE: 'Scolarité',
    ACTIVITE: 'Activité',
    URGENT: 'Urgent',
    GENERAL: 'Général',
};

const POST_TYPE_COLORS: Record<PostType['type'], string> = {
    SCOLARITE: 'bg-blue-100 text-blue-800',
    ACTIVITE: 'bg-green-100 text-green-800',
    URGENT: 'bg-red-100 text-red-800',
    GENERAL: 'bg-gray-100 text-gray-800',
};

export function PostCard({ post }: PostCardProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { mutate: deletePost } = useDeletePost();

    const isDirection = user?.role === 'DIRECTION';
    const isAuthor = user?.id === post.author.id;
    const canEdit = isAuthor || isDirection;
    const canDelete = isAuthor || isDirection;

    const togglePinMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/posts/${post.id}/pin`, {
                isPinned: !post.isPinned
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success(post.isPinned ? 'Post désépinglé' : 'Post épinglé');
        },
        onError: () => {
            toast.error('Erreur lors de la modification');
        }
    });

    const handleDelete = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
            deletePost(post.id);
        }
    };

    return (
        <>
            <Card className={`${post.isPinned ? 'border-yellow-400 border-2' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded ${POST_TYPE_COLORS[post.type]}`}>
                                    {POST_TYPE_LABELS[post.type]}
                                </span>
                                {post.isPinned && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                        <Pin className="h-3 w-3" />
                                        Épinglé
                                    </span>
                                )}
                                {post.class && (
                                    <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                                        {post.class.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">
                                    {post.author.firstName} {post.author.lastName}
                                </span>
                                <span className="text-xs">({post.author.role})</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditDialogOpen(true)}
                                    title="Modifier"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            )}
                            {isDirection && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePinMutation.mutate()}
                                    disabled={togglePinMutation.isPending}
                                    title={post.isPinned ? 'Désépingler' : 'Épingler'}
                                >
                                    <Pin className={`h-4 w-4 ${post.isPinned ? 'fill-current' : ''}`} />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                    {/* Attachments Display */}
                    {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Pièces jointes :</p>
                            <div className="grid grid-cols-2 gap-3">
                                {post.attachments.map((attachment: any) => (
                                    <div key={attachment.id}>
                                        {attachment.mimeType.startsWith('image/') ? (
                                            // Image preview
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <img
                                                    src={attachment.url}
                                                    alt={attachment.filename}
                                                    loading="lazy"
                                                    className="w-full h-48 object-cover rounded border hover:opacity-90 transition-opacity"
                                                />
                                                <p className="text-xs text-gray-500 mt-1 truncate">{attachment.filename}</p>
                                            </a>
                                        ) : (
                                            // PDF download link
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                <span className="text-xs truncate flex-1">{attachment.filename}</span>
                                                <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    {post.comments && (
                        <CommentSection postId={post.id} comments={post.comments} />
                    )}
                </CardContent>
            </Card>

            {canEdit && (
                <EditPostDialog
                    post={post}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
        </>
    );
}
