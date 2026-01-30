import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../lib/cloudinary';

// Use memory storage to process files directly (buffer)
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Max 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

export const handleFileUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return next();
        }

        const files = req.files as Express.Multer.File[];
        const uploadPromises = files.map(file => {
            return new Promise((resolve, reject) => {
                // Generate unique public_id for this file
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 8);
                const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                const publicId = `${timestamp}_${randomStr}_${sanitizedFilename}`;

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'mon-ecole/messages',
                        resource_type: 'auto',
                        public_id: publicId
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        if (!result) return reject(new Error('Cloudinary upload failed'));

                        resolve({
                            url: result.secure_url,
                            filename: file.originalname,
                            mimeType: file.mimetype,
                            size: result.bytes
                        });
                    }
                );

                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        (req as any).uploadedFiles = uploadedFiles;
        next();
    } catch (error) {
        console.error('❌ File upload error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            cloudinaryConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
        });
        res.status(500).json({
            error: 'File upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
