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

export async function getUploadUrlPut({ key, contentType = 'application/octet-stream', expiresIn = 600 }) {
    if (!key) {
        throw new Error('getUploadUrlPut: key is required');
    }
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn });
    return { url, key, expiresIn, method: 'PUT', headers: { 'Content-Type': contentType } };
}

export async function getImageUrl(key) {
    const cmd = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return await getSignedUrl(s3, cmd, { expiresIn: 600 });
}

export default {
    getUploadUrlPut,
    getImageUrl
};


