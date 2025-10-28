import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT; // e.g. http://localhost:9000 for MinIO
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true'; // MinIO usually needs this

if (!region || !bucket) {
    console.warn('AWS_REGION or AWS_S3_BUCKET is not set. S3 uploads will fail.');
}

const s3 = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: endpoint ? forcePathStyle : undefined,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});



export async function uploadImage(localFilePath) {
    if (!localFilePath) {
        throw new Error('uploadImage: localFilePath is required');
    }

    const fileExists = fs.existsSync(localFilePath);
    if (!fileExists) {
        throw new Error(`uploadImage: file not found at ${localFilePath}`);
    }

    const fileStream = fs.createReadStream(localFilePath);
    const fileName = path.basename(localFilePath);
    const contentType = mime.lookup(fileName) || 'application/octet-stream';
    const key = `items/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: contentType
    });

    await s3.send(command);

    // Build URL differently for custom endpoints (MinIO) vs AWS S3
    let url;
    const cmd = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    url = await getSignedUrl(s3, cmd, { expiresIn: 600 });
    return { key, url };
}

export async function getImageUrl(key) {
    const cmd = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return await getSignedUrl(s3, cmd, { expiresIn: 600 });
}

export default {
    uploadImage
};


