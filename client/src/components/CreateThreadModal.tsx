import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getMyStudents, createThread } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

const schema = z.object({
    studentId: z.string().min(1, 'Veuillez sélectionner un élève'),
    recipientRole: z.string().min(1, 'Veuillez sélectionner un destinataire'),
});

type FormData = z.infer<typeof schema>;

interface CreateThreadModalProps {
    onThreadCreated: (threadId: number) => void;
}

export function CreateThreadModal({ onThreadCreated }: CreateThreadModalProps) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['my-students'],
        queryFn: getMyStudents,
        enabled: open, // Fetch only when modal is open
    });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            studentId: '',
            recipientRole: '',
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => createThread(Number(data.studentId), data.recipientRole),
        onSuccess: (newThread) => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
            queryClient.invalidateQueries({ queryKey: ['thread', newThread.id] });
            toast.success('Conversation créée avec succès');
            setOpen(false);
            reset();
            onThreadCreated(newThread.id);
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || "Impossible de créer la conversation.";
            toast.error(message);
        },
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    // Determine viable recipient roles based on user role
    const getRecipientOptions = () => {
        if (!user) return [];
        switch (user.role) {
            case 'PARENT':
                return [
                    { value: 'PROFESSOR', label: 'Professeur Principal' },
                    { value: 'DIRECTION', label: 'Direction' },
                ];
            case 'PROFESSOR':
                return [
                    { value: 'DIRECTION', label: 'Direction' },
                ];
            case 'DIRECTION':
                return [
                    { value: 'PARENT', label: 'Parent' },
                    { value: 'PROFESSOR', label: 'Professeur' },
                    { value: 'DIRECTION', label: 'Direction' },
                ];
            default:
                return [];
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle conversation</DialogTitle>
                    <DialogDescription>
                        Démarrez une nouvelle conversation concernant un élève.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Concernant l'élève</Label>
                        <Controller
                            control={control}
                            name="studentId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un élève" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingStudents ? (
                                            <div className="p-2 text-center text-sm text-gray-400">Chargement...</div>
                                        ) : students?.length === 0 ? (
                                            <div className="p-2 text-center text-sm text-gray-400">Aucun élève trouvé</div>
                                        ) : (
                                            students?.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.firstName} {s.lastName}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Destinataire</Label>
                        <Controller
                            control={control}
                            name="recipientRole"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir le destinataire" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getRecipientOptions().map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.recipientRole && <p className="text-red-500 text-xs">{errors.recipientRole.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer la conversation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
