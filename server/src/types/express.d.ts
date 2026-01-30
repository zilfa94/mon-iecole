import { UserRole } from './shared';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: number;
            role: UserRole;
            email: string;
            firstName: string;
            lastName: string;
        };
    }
}
