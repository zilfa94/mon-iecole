export type UserRole = 'DIRECTION' | 'PROFESSOR' | 'PARENT' | 'STUDENT';
export type PostType = 'SCOLARITE' | 'ACTIVITE' | 'URGENT' | 'GENERAL';

export interface User {
    id: number;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    classId?: number;
}

export interface Class {
    id: number;
    name: string;
}

export interface Post {
    id: number;
    content: string;
    type: PostType;
    isPinned: boolean;
    createdAt: string;
    author: {
        id: number;
        firstName: string;
        lastName: string;
        role: UserRole;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface CreatePostData {
    content: string;
    type: PostType;
    classId?: string;
}
