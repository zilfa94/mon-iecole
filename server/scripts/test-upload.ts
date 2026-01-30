import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Note: This script is a "Dry Run" verification of the Cloudinary configuration
// and Prisma models. Real file upload requires the HTTP server to be running 
// and handling multipart form data, which is hard to script entirely without starting the server.
// Instead, we will:
// 1. Verify Cloudinary config
// 2. Perform a direct upload to Cloudinary to test credentials
// 3. Create a fake "Message" with "Attachment" in DB to verify schema

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing File Upload Setup...');

    // 1. Check Cloudinary Config
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
        console.error('❌ CLOUDINARY_CLOUD_NAME is missing');
        process.exit(1);
    }
    console.log(`✅ Cloudinary Config found: ${cloudName}`);

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 2. Try Uploading a text buffer
    console.log('☁️ Attempting direct upload to Cloudinary...');
    try {
        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'mon-ecole/test', resource_type: 'raw', public_id: 'test_upload_' + Date.now() },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.write(Buffer.from('Hello Cloudinary! This is a test.'));
            uploadStream.end();
        });

        console.log(`✅ Upload success! URL: ${result.secure_url}`);

        // 3. Test DB Attachment Creation
        console.log('💾 Testing DB Schema for Attachments...');

        // Find a thread
        const thread = await prisma.messageThread.findFirst({
            include: { participants: true }
        });

        if (!thread) {
            console.log('⚠️ No thread found, skipping DB test (Create a thread first)');
            return;
        }

        const senderId = thread.participants[0].userId;

        const message = await prisma.message.create({
            data: {
                threadId: thread.id,
                senderId: senderId,
                content: 'Test message with attachment (Script Check)',
                attachments: {
                    create: {
                        url: result.secure_url,
                        filename: 'test_upload.txt',
                        mimeType: 'text/plain',
                        size: 123
                    }
                }
            },
            include: { attachments: true }
        });

        console.log(`✅ Message created with ${message.attachments.length} attachment(s)`);
        console.log(`   Attachment URL: ${message.attachments[0].url}`);

    } catch (error) {
        console.error('❌ Operation Failed:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
