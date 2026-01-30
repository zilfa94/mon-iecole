import type { Post as PostType } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pin, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/CommentSection';

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

    const isDirection = user?.role === 'DIRECTION';

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

    return (
        <Card className={post.isPinned ? 'border-yellow-400 bg-yellow-50/30' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                                {post.author.firstName} {post.author.lastName}
                            </p>
                            <span className="text-xs text-gray-500">
                                ({post.author.role})
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDirection && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${post.isPinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                                onClick={() => togglePinMutation.mutate()}
                                disabled={togglePinMutation.isPending}
                                title={post.isPinned ? "Désépingler" : "Épingler"}
                            >
                                <Pin className={`h-4 w-4 ${post.isPinned ? 'fill-current' : ''}`} />
                            </Button>
                        )}
                        {!isDirection && post.isPinned && (
                            <div className="flex items-center gap-1 text-yellow-600 mr-2">
                                <Pin className="h-4 w-4 fill-current" />
                                <span className="text-xs font-medium">Épinglé</span>
                            </div>
                        )}
                        <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${POST_TYPE_COLORS[post.type]
                                }`}
                        >
                            {POST_TYPE_LABELS[post.type]}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                {/* Attachments Display */}
                {post.attachments && post.attachments.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">Pièces jointes :</p>
                        <div className="grid grid-cols-2 gap-2">
                            {post.attachments.map((attachment: any) => (
                                <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 transition-colors"
                                >
                                    {attachment.mimeType.startsWith('image/') ? (
                                        <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <span className="text-xs truncate flex-1">{attachment.filename}</span>
                                    <Download className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                </a>
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
    );
}
