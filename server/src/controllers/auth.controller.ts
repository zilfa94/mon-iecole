import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { UserRole } from '../types/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isValid = await bcrypt.compare(password, user.passwordHash);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!user.isActive) {
                return res.status(403).json({ error: 'Account inactive' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role as UserRole },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Set HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: true, // Always secure in production (and required if SameSite=None, but allow safely for Lax+Proxy)
                maxAge: 24 * 60 * 60 * 1000, // 24h
                sameSite: 'lax' // 'lax' is robust for same-origin (proxy) use cases
            });

            return res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async me(req: Request, res: Response) {
        // req.user is set by requireAuth middleware
        return res.json({ user: req.user });
    }

    static async logout(req: Request, res: Response) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
        });
        return res.json({ message: 'Logout successful' });
    }
}
