export const USER_ROLES = ['DIRECTION', 'PROFESSOR', 'PARENT', 'STUDENT'] as const;
export type UserRole = typeof USER_ROLES[number];

// Object for "Zero Magic Strings" usage in code (e.g. UserRole.DIRECTION)
export const UserRole = {
    DIRECTION: 'DIRECTION',
    PROFESSOR: 'PROFESSOR',
    PARENT: 'PARENT',
    STUDENT: 'STUDENT',
} as const;

export const POST_TYPES = ['SCOLARITE', 'ACTIVITE', 'URGENT', 'GENERAL'] as const;
export type PostType = typeof POST_TYPES[number];

// Object for "Zero Magic Strings" usage
export const PostType = {
    SCOLARITE: 'SCOLARITE',
    ACTIVITE: 'ACTIVITE',
    URGENT: 'URGENT',
    GENERAL: 'GENERAL',
} as const;

// Validation Helpers
export const isUserRole = (value: unknown): value is UserRole => {
    return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};

export const isPostType = (value: unknown): value is PostType => {
    return typeof value === 'string' && POST_TYPES.includes(value as PostType);
};
