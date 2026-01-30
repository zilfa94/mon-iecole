import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, isUserRole } from '../types/shared';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
    id: number;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Strict DB Validation
        // We do not rely solely on the token payload, as the user's role or status might have changed.
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                firstName: true,
                lastName: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account inactive' });
        }

        // Validate that the DB role is valid in our system (e.g. not corrupted)
        if (!isUserRole(user.role)) {
            console.error(`Invalid role found for user ${user.id}: ${user.role}`);
            return res.status(401).json({ error: 'Invalid user role configuration' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role as UserRole, // Safe cast after isUserRole check
            firstName: user.firstName,
            lastName: user.lastName,
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};
