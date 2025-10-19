# S3 Upload Feature Setup

## Overview

The PetStay API now supports image uploads to AWS S3 for:
- User avatars
- Pet photos
- Listing photos (up to 10 per listing)

All uploaded images are automatically:
- Validated (file type and size)
- Optimized using Sharp
- Resized to appropriate dimensions
- Converted to JPEG format
- Stored in AWS S3

## Configuration

### Required Environment Variables

Add the following to your `.env` file in `apps/api/`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=your_bucket_name_here
```

### AWS S3 Bucket Setup

1. **Create an S3 Bucket**
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Choose your preferred region

2. **Configure Bucket Permissions**
   - Make the bucket publicly readable (or configure CloudFront)
   - Set appropriate CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. **Create IAM User**
   - Go to AWS IAM Console
   - Create a new user with programmatic access
   - Attach policy with S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## API Endpoints

### Upload User Avatar

```http
POST /api/users/me/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (image file)
```

**Response:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://bucket.s3.region.amazonaws.com/avatar/userId/timestamp-hash.jpg"
}
```

### Upload Pet Photo

```http
POST /api/pets/:petId/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (image file)
```

**Response:**
```json
{
  "message": "Pet photo uploaded successfully",
  "photoUrl": "https://bucket.s3.region.amazonaws.com/petPhoto/userId/timestamp-hash.jpg"
}
```

### Upload Listing Photo

```http
POST /api/listings/:listingId/photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (image file)
```

**Response:**
```json
{
  "message": "Photo uploaded successfully",
  "photoUrl": "https://bucket.s3.region.amazonaws.com/listingPhoto/userId/timestamp-hash.jpg",
  "totalPhotos": 3
}
```

**Note:** Maximum of 10 photos per listing.

### Delete Listing Photo

```http
DELETE /api/listings/:listingId/photos
Authorization: Bearer {token}
Content-Type: application/json

{
  "photoUrl": "https://bucket.s3.region.amazonaws.com/listingPhoto/userId/timestamp-hash.jpg"
}
```

**Response:**
```json
{
  "message": "Photo deleted successfully",
  "totalPhotos": 2
}
```

## Validation Rules

### File Type
Only the following image types are allowed:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

### File Size
- Maximum file size: **5MB** per image

### Image Optimization

Images are automatically optimized with the following settings:

| Type | Width | Height | Quality | Format |
|------|-------|--------|---------|--------|
| Avatar | 300px | 300px | 80% | JPEG |
| Pet Photo | 800px | 800px | 85% | JPEG |
| Listing Photo | 1200px | 800px | 85% | JPEG |

Images are cropped to fit using the "cover" strategy with center positioning.

## Error Handling

### S3 Not Configured
If AWS credentials are not set, the API will return:

```json
{
  "error": "File upload is not available. S3 is not configured."
}
```

Status: `503 Service Unavailable`

### Invalid File Type
```json
{
  "error": "Invalid file type. Only JPG, PNG, and WebP are allowed."
}
```

Status: `400 Bad Request`

### File Too Large
```json
{
  "error": "File too large. Maximum size is 5MB."
}
```

Status: `400 Bad Request`

### Maximum Photos Exceeded (Listings)
```json
{
  "error": "Maximum of 10 photos per listing"
}
```

Status: `400 Bad Request`

## Testing

Use the REST Client extension in VS Code with the provided examples in `test-api.http`.

**Important:** Create a `test-images` directory in `apps/api/` and add sample images:
- `avatar.jpg`
- `pet.jpg`
- `listing.jpg`

## File Structure in S3

Images are organized by type and user:

```
s3://your-bucket/
├── avatar/
│   └── {userId}/
│       └── {timestamp}-{hash}.jpg
├── petPhoto/
│   └── {userId}/
│       └── {timestamp}-{hash}.jpg
└── listingPhoto/
    └── {userId}/
        └── {timestamp}-{hash}.jpg
```

## Development vs Production

For development without S3:
- The endpoints will return a 503 error if S3 is not configured
- All other API functionality works normally
- You can use placeholder image URLs in the database

For production:
- Always configure S3 credentials
- Consider using CloudFront for better performance
- Set up proper bucket lifecycle policies for cost optimization
- Monitor S3 usage and costs

## Security Considerations

1. **Never commit AWS credentials** to version control
2. Use IAM users with minimal required permissions
3. Enable S3 bucket encryption at rest
4. Consider implementing rate limiting for upload endpoints
5. Validate file content, not just extensions
6. Implement virus scanning for uploaded files (future enhancement)
7. Use presigned URLs for sensitive content (available in `s3.ts` utility)

## Dependencies

The S3 upload feature uses:
- `@aws-sdk/client-s3` - AWS SDK for S3 operations
- `@aws-sdk/s3-request-presigner` - For generating presigned URLs
- `sharp` - Image processing and optimization
- `@fastify/multipart` - Handling multipart/form-data uploads

All dependencies are already installed in `package.json`.
