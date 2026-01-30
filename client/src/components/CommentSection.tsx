import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface CommentSectionProps {
    postId: number;
    comments: Array<{
        id: number;
        content: string;
        createdAt: string;
        author: {
            id: number;
            firstName: string;
            lastName: string;
        };
    }>;
}

export function CommentSection({ postId, comments }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const queryClient = useQueryClient();

    const createComment = useMutation({
        mutationFn: async (content: string) => {
            const response = await api.post(`/posts/${postId}/comments`, { content });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setNewComment('');
            toast.success('Commentaire ajouté');
        },
        onError: () => {
            toast.error('Erreur lors de l\'ajout du commentaire');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            createComment.mutate(newComment.trim());
        }
    };

    return (
        <div className="space-y-3">
            {/* Toggle Comments Button */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="text-gray-600"
            >
                {showComments ? 'Masquer' : 'Afficher'} les commentaires ({comments.length})
            </Button>

            {showComments && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    {/* Existing Comments */}
                    {comments.length > 0 && (
                        <div className="space-y-2">
                            {comments.map(comment => (
                                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                            {comment.author.firstName} {comment.author.lastName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <Textarea
                            placeholder="Ajouter un commentaire..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            className="resize-none"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!newComment.trim() || createComment.isPending}
                        >
                            {createComment.isPending ? 'Envoi...' : 'Commenter'}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
