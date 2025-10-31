import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
await fs.mkdir(UPLOADS_DIR, { recursive: true });
await fs.mkdir(path.join(UPLOADS_DIR, 'avatar'), { recursive: true });
await fs.mkdir(path.join(UPLOADS_DIR, 'petPhoto'), { recursive: true });
await fs.mkdir(path.join(UPLOADS_DIR, 'listingPhoto'), { recursive: true });

// Initialize S3 Client
let s3Client: S3Client | null = null;

if (config.AWS_REGION && config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// Allowed image types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Image optimization settings
const OPTIMIZATION_SETTINGS = {
  avatar: { width: 300, height: 300, quality: 80 },
  petPhoto: { width: 800, height: 800, quality: 85 },
  listingPhoto: { width: 1200, height: 800, quality: 85 },
};

export type ImageType = 'avatar' | 'petPhoto' | 'listingPhoto';

/**
 * Validates if the file is a valid image type and size
 */
export function validateImage(mimetype: string, size: number): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
    };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Optimizes an image buffer using sharp
 */
export async function optimizeImage(
  buffer: Buffer,
  type: ImageType
): Promise<{ buffer: Buffer; contentType: string }> {
  const settings = OPTIMIZATION_SETTINGS[type];

  const optimized = await sharp(buffer)
    .resize(settings.width, settings.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: settings.quality })
    .toBuffer();

  return {
    buffer: optimized,
    contentType: 'image/jpeg',
  };
}

/**
 * Generates a unique filename for S3
 */
export function generateS3Key(userId: string, type: ImageType, originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = 'jpg'; // Always jpg after optimization

  return `${type}/${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Uploads an image to S3 with optimization or saves locally if S3 is not configured
 */
export async function uploadImageToS3(
  buffer: Buffer,
  mimetype: string,
  size: number,
  userId: string,
  type: ImageType,
  originalName: string
): Promise<{ url: string; key: string }> {
  // Validate image
  const validation = validateImage(mimetype, size);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Optimize image
  const { buffer: optimizedBuffer, contentType } = await optimizeImage(buffer, type);

  // Generate key/filename
  const key = generateS3Key(userId, type, originalName);

  // If S3 is configured, upload to S3
  if (s3Client && config.S3_BUCKET_NAME) {
    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${config.S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

    return { url, key };
  }

  // Otherwise, save locally
  const localPath = path.join(UPLOADS_DIR, key);
  
  // Ensure the directory exists
  const localDir = path.dirname(localPath);
  await fs.mkdir(localDir, { recursive: true });
  
  await fs.writeFile(localPath, optimizedBuffer);

  // Generate local URL (will be served by static file handler)
  const url = `/uploads/${key}`;

  return { url, key };
}

/**
 * Generates a presigned URL for direct upload from client
 * (Alternative approach - not used in current implementation but available)
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  if (!s3Client || !config.S3_BUCKET_NAME) {
    throw new Error('S3 is not configured. Please set AWS credentials in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return s3Client !== null && !!config.S3_BUCKET_NAME;
}

/**
 * Get the local uploads directory path
 */
export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
