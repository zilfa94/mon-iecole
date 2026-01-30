import { useState } from 'react';
import type { Post as PostType } from '@/types';
import { Card } from '@/components/ui/card';
import { Pin, FileText, Download, MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/CommentSection';
import { EditPostDialog } from '@/components/EditPostDialog';
import { useDeletePost } from '@/hooks/useDeletePost';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
    post: PostType;
}

export function PostCard({ post }: PostCardProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { mutate: deletePost } = useDeletePost();
    const [showComments, setShowComments] = useState(false);

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
            <Card className={`mb-4 border-0 shadow-sm ${post.isPinned ? 'ring-2 ring-primary/20' : ''}`}>
                <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-90">
                                <AvatarFallback className={`text-white font-bold
                                    ${post.author.role === 'DIRECTION' ? 'bg-primary' :
                                        post.author.role === 'PROFESSOR' ? 'bg-green-600' : 'bg-gray-500'}
                                `}>
                                    {post.author.firstName[0]}{post.author.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-[15px] leading-tight text-gray-900 hover:underline cursor-pointer">
                                    {post.author.firstName} {post.author.lastName}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <span>
                                        {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <span>•</span>
                                    {/* Role Badge or Icon */}
                                    <span className="font-medium">{post.author.role}</span>
                                    {post.isPinned && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-0.5 text-primary">
                                                <Pin className="h-3 w-3 fill-current" />
                                                Épinglé
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Menu Options */}
                        {(canEdit || canDelete || isDirection) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isDirection && (
                                        <DropdownMenuItem onClick={() => togglePinMutation.mutate()}>
                                            <Pin className="mr-2 h-4 w-4" />
                                            {post.isPinned ? 'Désépingler' : 'Épingler du haut'}
                                        </DropdownMenuItem>
                                    )}
                                    {canEdit && (
                                        <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Modifier le post
                                        </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                            <div className="flex items-center w-full">
                                                {/* Trash Icon manually to avoid import issues if any */}
                                                <span className="mr-2 h-4 w-4 flex items-center justify-center font-bold">×</span>
                                                Supprimer
                                            </div>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-[15px] text-gray-900 whitespace-pre-wrap mb-3 leading-normal">
                        {post.content}
                    </div>
                </div>

                {/* Attachments Display (Full Width) */}
                {post.attachments && post.attachments.length > 0 && (
                    <div className="mb-2">
                        <div className={`grid gap-1 ${post.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {post.attachments.map((attachment: any) => (
                                <div key={attachment.id} className="relative group overflow-hidden bg-gray-100">
                                    {attachment.mimeType.startsWith('image/') ? (
                                        // Image preview
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-video w-full"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt={attachment.filename}
                                                loading="lazy"
                                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                            />
                                        </a>
                                    ) : (
                                        // PDF download link
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 border m-4 rounded-lg hover:bg-white transition-colors"
                                        >
                                            <FileText className="h-8 w-8 text-red-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{attachment.filename}</p>
                                                <p className="text-xs text-gray-500 uppercase">{attachment.filename.split('.').pop()}</p>
                                            </div>
                                            <Download className="h-5 w-5 text-gray-400" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Engagement Stats (Optional) */}
                <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        {/* Placeholder for Likes count */}
                        <div className="bg-primary p-1 rounded-full text-white">
                            <ThumbsUp className="h-2 w-2 fill-current" />
                        </div>
                        <span>2</span>
                    </div>
                    <button
                        className="hover:underline"
                        onClick={() => setShowComments(!showComments)}
                    >
                        {post.comments?.length || 0} commentaires
                    </button>
                </div>

                {/* Action Bar */}
                <div className="px-4 py-1 border-t border-b border-gray-100">
                    <div className="flex gap-1">
                        <Button variant="ghost" className="flex-1 gap-2 text-gray-600 hover:bg-gray-100 h-9 font-medium">
                            <ThumbsUp className="h-5 w-5" />
                            J'aime
                        </Button>
                        <Button
                            variant="ghost"
                            className="flex-1 gap-2 text-gray-600 hover:bg-gray-100 h-9 font-medium"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-5 w-5" />
                            Commenter
                        </Button>
                        <Button variant="ghost" className="flex-1 gap-2 text-gray-600 hover:bg-gray-100 h-9 font-medium">
                            <Share2 className="h-5 w-5" />
                            Partager
                        </Button>
                    </div>
                </div>

                {/* Comments Section */}
                {(showComments || (post.comments && post.comments.length > 0)) && (
                    <div className="bg-gray-50/50 p-4">
                        <CommentSection postId={post.id} comments={post.comments || []} />
                    </div>
                )}
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
