import { UserRole } from './shared';

declare global {
    namespace Express {
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
}
