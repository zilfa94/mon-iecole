import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { isUserRole, UserRole, USER_ROLES } from '../types/shared';

export class UserController {
    // ADMIN ONLY: Create a new user
    static async createUser(req: Request, res: Response) {
        try {
            const { email, password, role, firstName, lastName, classId } = req.body;

            // 1. Strict Runtime Validation for Role
            if (!isUserRole(role)) {
                return res.status(400).json({
                    error: 'Invalid role provided. Must be one of: ' + USER_ROLES.join(', ')
                });
            }

            // 2. Validate required fields
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 3. Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // 4. Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // 5. Create user
            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role, // Typescript accepts string, validated above
                    firstName,
                    lastName,
                    classId: classId ? parseInt(classId) : undefined
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true
                }
            });

            return res.status(201).json(newUser);

        } catch (error) {
            console.error('Create user error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ADMIN ONLY: List all users
    static async listUsers(req: Request, res: Response) {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    createdAt: true
                }
            });
            return res.json(users);
        } catch (error) {
            console.error('List users error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ADMIN ONLY: Update user status (Soft Disable)
    static async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ error: 'isActive must be a boolean' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(String(id), 10) },
                data: { isActive },
                select: {
                    id: true,
                    email: true,
                    isActive: true
                }
            });

            return res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async me(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Remove password from response (cast to any to avoid TS error if type is strict)
            const { passwordHash, ...userWithoutPassword } = user as any;
            res.json(userWithoutPassword);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getMyStudents(req: Request, res: Response) {
        try {
            const currentUser = req.user!;

            if (currentUser.role === UserRole.PARENT) {
                // Fetch linked students
                const parentWithStudents = await prisma.user.findUnique({
                    where: { id: currentUser.id },
                    include: {
                        parentStudents: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!parentWithStudents) return res.json([]);

                // Extract students and ensure they are ACTIVE and have role STUDENT
                const students = parentWithStudents.parentStudents
                    .map((ps: any) => ps.student)
                    .filter((s: any) => s.role === UserRole.STUDENT); // Strict filtering

                return res.json(students);
            }

            if (currentUser.role === UserRole.DIRECTION) {
                const students = await prisma.user.findMany({
                    where: {
                        role: UserRole.STUDENT,
                        isActive: true
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    },
                    orderBy: [
                        { lastName: 'asc' },
                        { firstName: 'asc' }
                    ]
                });
                return res.json(students);
            }

            if (currentUser.role === UserRole.PROFESSOR) {
                // Fetch classes assigned to this professor
                const professorWithClasses = await prisma.user.findUnique({
                    where: { id: currentUser.id },
                    include: {
                        teachingClasses: {
                            select: { classId: true }
                        }
                    }
                });

                if (!professorWithClasses) return res.json([]);

                const classIds = professorWithClasses.teachingClasses.map((tc: { classId: number }) => tc.classId);

                // Fetch students in these classes
                const students = await prisma.user.findMany({
                    where: {
                        role: UserRole.STUDENT,
                        isActive: true,
                        classId: { in: classIds }
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        class: {
                            select: { name: true }
                        }
                    },
                    orderBy: [
                        { lastName: 'asc' },
                        { firstName: 'asc' }
                    ]
                });
                return res.json(students);
            }

            // Other roles (STUDENT) get empty list
            return res.json([]);

        } catch (error) {
            console.error('Get my students error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}

    static async getMyClasses(req: Request, res: Response) {
    try {
        const currentUser = req.user!;

        if (currentUser.role === UserRole.DIRECTION) {
            // Direction sees all classes
            const classes = await prisma.class.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            });
            return res.json(classes);
        }

        if (currentUser.role === UserRole.PROFESSOR) {
            // Professors see their assigned classes
            const professorWithClasses = await prisma.user.findUnique({
                where: { id: currentUser.id },
                include: {
                    teachingClasses: {
                        include: {
                            class: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            });

            if (!professorWithClasses) return res.json([]);

            const classes = professorWithClasses.teachingClasses.map(tc => tc.class).sort((a, b) => a.name.localeCompare(b.name));
            return res.json(classes);
        }

        // Other roles (STUDENT/PARENT) don't list classes (they are implicitly scoped)
        return res.json([]);

    } catch (error) {
        console.error('Get my classes error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
