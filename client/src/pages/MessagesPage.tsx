import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getThreads, getThread, markThreadRead, type MessageThread } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SendMessageForm } from '@/components/SendMessageForm';
import { File as FileIcon } from 'lucide-react';

import { CreateThreadModal } from '@/components/CreateThreadModal';

export function MessagesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: threads, isLoading: isLoadingList } = useQuery({
        queryKey: ['threads'],
        queryFn: getThreads,
        refetchInterval: 5000,
        refetchIntervalInBackground: false
    });

    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true); // Track if user is at the bottom

    const markReadMutation = useMutation({
        mutationFn: markThreadRead,
        onMutate: async (threadId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['threads'] });

            // Snapshot the previous value
            const previousThreads = queryClient.getQueryData(['threads']);

            // Optimistically update to 0 unread
            queryClient.setQueryData(['threads'], (old: MessageThread[] | undefined) => {
                return old?.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t);
            });

            return { previousThreads };
        },
        onError: (_err, _newTodo, context) => {
            if (context?.previousThreads) {
                queryClient.setQueryData(['threads'], context.previousThreads);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        }
    });

    const handleThreadClick = (threadId: number) => {
        setSelectedThreadId(threadId);
        markReadMutation.mutate(threadId);
    };

    const { data: selectedThread, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['thread', selectedThreadId],
        queryFn: () => getThread(selectedThreadId!),
        enabled: !!selectedThreadId,
        refetchInterval: 5000
    });

    // Handle user scroll to update "isAtBottom" state
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            // Consider user at bottom if within 50px
            isAtBottomRef.current = distanceToBottom < 50;
        }
    };

    // Scroll to bottom when messages change, ONLY if user was already at bottom
    useEffect(() => {
        if (scrollRef.current && isAtBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedThread?.messages]);

    // Force scroll to bottom when changing threads
    useEffect(() => {
        isAtBottomRef.current = true;
    }, [selectedThreadId]);

    const getOtherParticipants = (thread: MessageThread) => {
        return thread.participants
            .filter(p => p.user.id !== user?.id)
            .map(p => `${p.user.firstName} ${p.user.lastName} (${p.user.role})`)
            .join(', ');
    };

    if (isLoadingList) {
        return (
            <div className="flex h-[calc(100vh-120px)] gap-4">
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
                <div className="hidden md:flex w-2/3 bg-gray-50 animate-pulse rounded-lg" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)] gap-4">
            {/* Thread List */}
            <div className={`w-full md:w-1/3 flex flex-col gap-3 overflow-y-auto ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">Messagerie</h2>
                    {user?.role !== 'STUDENT' && (
                        <CreateThreadModal onThreadCreated={handleThreadClick} />
                    )}
                </div>
                {threads?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Aucune conversation.</p>
                        {user?.role !== 'STUDENT' && <p className="text-sm">Cliquez sur "Nouveau message".</p>}
                    </div>
                )}
                {threads?.map((thread) => (
                    <Card
                        key={thread.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedThreadId === thread.id ? 'border-blue-500 bg-blue-50' : ''}`}
                        onClick={() => handleThreadClick(thread.id)}
                    >
                        <CardContent className="p-4 relative">
                            {thread.unreadCount !== undefined && thread.unreadCount > 0 && (
                                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {thread.unreadCount}
                                </span>
                            )}
                            {thread.student && (
                                <p className="text-xs font-semibold text-blue-600 mb-1">
                                    Concernant : {thread.student.firstName} {thread.student.lastName}
                                </p>
                            )}
                            <p className="font-medium text-sm text-gray-900 truncate pr-6">
                                {getOtherParticipants(thread)}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <p className={`text-xs truncate max-w-[70%] ${thread.unreadCount && thread.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                    {thread.messages?.[0]?.content || '—'}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                    {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Conversation Detail */}
            <div className={`w-full md:w-2/3 bg-white rounded-lg border flex flex-col ${!selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
                {selectedThreadId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-white rounded-t-lg">
                            <div>
                                {selectedThread?.student && (
                                    <p className="text-xs font-bold text-blue-600">
                                        {selectedThread.student.firstName} {selectedThread.student.lastName}
                                    </p>
                                )}
                                <div className="font-semibold">
                                    {selectedThread ? getOtherParticipants(selectedThread) :
                                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                                    }
                                </div>
                            </div>
                            <button
                                className="md:hidden text-sm text-gray-500"
                                onClick={() => setSelectedThreadId(null)}
                            >
                                Retour
                            </button>
                        </div>

                        {/* Messages List */}
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3"
                        >
                            {isLoadingDetail ? (
                                <div className="space-y-4 p-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`h-12 w-2/3 rounded-lg animate-pulse ${i % 2 === 0 ? 'ml-auto bg-blue-50' : 'bg-gray-100'}`} />
                                    ))}
                                </div>
                            ) : selectedThread?.messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p>Aucun message pour l'instant.</p>
                                </div>
                            ) : (
                                selectedThread?.messages.map((msg, index) => {
                                    const isMe = msg.sender.id === user?.id;
                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg max-w-[80%] border ${isMe
                                                ? 'self-end bg-blue-100 border-blue-200 ml-auto'
                                                : 'self-start bg-white border-gray-200'
                                                }`}
                                        >
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>

                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.attachments.map((att: any) => (
                                                        <a
                                                            key={att.id}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block group"
                                                        >
                                                            {att.mimeType.startsWith('image/') ? (
                                                                <img
                                                                    src={att.url}
                                                                    alt={att.filename}
                                                                    className="max-w-[200px] max-h-[200px] rounded-md object-cover border group-hover:opacity-90 transition-opacity"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-2 p-2 bg-white/50 border rounded text-xs text-blue-700 hover:bg-white/80 transition-colors">
                                                                    <FileIcon className="h-4 w-4" />
                                                                    <span className="truncate max-w-[150px]">{att.filename}</span>
                                                                </div>
                                                            )}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-[10px] text-gray-400 mt-1 text-right">
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <SendMessageForm threadId={selectedThreadId} />
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Sélectionnez une conversation
                    </div>
                )}
            </div>
        </div>
    );
}
