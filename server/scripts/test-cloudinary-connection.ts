import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Test Cloudinary connection
async function testCloudinaryConnection() {
    console.log('🔍 Testing Cloudinary Configuration...\n');

    // 1. Check environment variables
    console.log('Environment Variables:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
    console.log('');

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Missing Cloudinary credentials!');
        process.exit(1);
    }

    // 2. Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 3. Test upload with a simple text buffer
    console.log('☁️ Testing upload to Cloudinary...');
    try {
        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'mon-ecole/test',
                    resource_type: 'raw',
                    public_id: 'connection_test_' + Date.now()
                },
                (error, result) => {
                    if (error) {
                        console.error('Upload error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            uploadStream.write(Buffer.from('Test connection from server'));
            uploadStream.end();
        });

        console.log('✅ Upload successful!');
        console.log('URL:', result.secure_url);
        console.log('');
        console.log('🎉 Cloudinary is configured correctly!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

testCloudinaryConnection();
