import { PrismaClient } from '@prisma/client';
import { UserRole } from '../src/types/shared';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Classes
    const class3B = await prisma.class.upsert({
        where: { name: '3ème B' },
        update: {},
        create: { name: '3ème B' },
    });

    const class4A = await prisma.class.upsert({
        where: { name: '4ème A' },
        update: {},
        create: { name: '4ème A' },
    });

    // 2. Create Direction (Admin)
    const direction = await prisma.user.upsert({
        where: { email: 'admin@ecole.com' },
        update: {},
        create: {
            email: 'admin@ecole.com',
            passwordHash,
            role: UserRole.DIRECTION,
            firstName: 'Directeur',
            lastName: 'Principal',
        },
    });

    const direction2 = await prisma.user.upsert({
        where: { email: 'admin2@ecole.com' },
        update: {},
        create: {
            email: 'admin2@ecole.com',
            passwordHash,
            role: UserRole.DIRECTION,
            firstName: 'Vice',
            lastName: 'Directeur',
        },
    });

    // 3. Create Professor and assign to 3ème B
    const prof = await prisma.user.upsert({
        where: { email: 'prof@ecole.com' },
        update: {},
        create: {
            email: 'prof@ecole.com',
            passwordHash,
            role: UserRole.PROFESSOR,
            firstName: 'Jean',
            lastName: 'Dupont',
            teachingClasses: {
                create: {
                    classId: class3B.id
                }
            }
        },
    });

    // Assign prof to class if not already linked (upsert doesn't deep merge)
    const profClass = await prisma.professorClass.findUnique({
        where: {
            professorId_classId: {
                professorId: prof.id,
                classId: class3B.id
            }
        }
    });
    if (!profClass) {
        await prisma.professorClass.create({
            data: { professorId: prof.id, classId: class3B.id }
        });
    }


    // 4. Create Students
    // Léo (3ème B) - Accessible by Prof (same class)
    const studentLeo = await prisma.user.upsert({
        where: { email: 'student@ecole.com' },
        update: {},
        create: {
            email: 'student@ecole.com',
            passwordHash,
            role: UserRole.STUDENT,
            firstName: 'Léo',
            lastName: 'Martin',
            classId: class3B.id,
        },
    });

    // Julie (4ème A) - NOT Accessible by Prof (different class)
    const studentJulie = await prisma.user.upsert({
        where: { email: 'julie@ecole.com' },
        update: {},
        create: {
            email: 'julie@ecole.com',
            passwordHash,
            role: UserRole.STUDENT,
            firstName: 'Julie',
            lastName: 'Durand',
            classId: class4A.id,
        },
    });

    // 5. Create Parents
    // Parent Leo
    const parentLeo = await prisma.user.upsert({
        where: { email: 'parent@ecole.com' },
        update: {},
        create: {
            email: 'parent@ecole.com',
            passwordHash,
            role: UserRole.PARENT,
            firstName: 'Sophie',
            lastName: 'Martin',
        },
    });

    // Parent Julie
    const parentJulie = await prisma.user.upsert({
        where: { email: 'parent.julie@ecole.com' },
        update: {},
        create: {
            email: 'parent.julie@ecole.com',
            passwordHash,
            role: UserRole.PARENT,
            firstName: 'Marc',
            lastName: 'Durand',
        },
    });

    // 6. Link Parents -> Students
    // Sophie -> Léo
    await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: parentLeo.id, studentId: studentLeo.id } },
        update: {},
        create: { parentId: parentLeo.id, studentId: studentLeo.id },
    });

    // Marc -> Julie
    await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: parentJulie.id, studentId: studentJulie.id } },
        update: {},
        create: { parentId: parentJulie.id, studentId: studentJulie.id },
    });

    // 7. Create Message Thread (Parent Leo <-> Direction)
    let thread = await prisma.messageThread.findFirst({
        where: {
            participants: {
                every: { userId: { in: [parentLeo.id, direction.id] } }
            }
        },
        include: { messages: true }
    });

    if (!thread) {
        thread = await prisma.messageThread.create({
            data: {
                studentId: studentLeo.id,
                participants: {
                    create: [{ userId: parentLeo.id }, { userId: direction.id }]
                },
                messages: {
                    create: [
                        { senderId: parentLeo.id, content: 'Bonjour Monsieur le Directeur' },
                        { senderId: direction.id, content: 'Bonjour Madame Martin' }
                    ]
                }
            },
            include: { messages: true }
        });
    }

    console.log({
        classes: { "3B": class3B.id, "4A": class4A.id },
        prof: { id: prof.id, name: prof.lastName },
        students: [
            { id: studentLeo.id, name: studentLeo.firstName, class: "3B" },
            { id: studentJulie.id, name: studentJulie.firstName, class: "4A" }
        ],
        parents: [
            { id: parentLeo.id, name: parentLeo.firstName, child: "Léo" },
            { id: parentJulie.id, name: parentJulie.firstName, child: "Julie" }
        ]
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
