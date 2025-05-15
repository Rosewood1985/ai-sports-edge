# Firebase Storage Training

## Slide 1: Introduction to Firebase Storage

- Firebase Storage is for storing user-generated content
- Supports images, videos, and other files
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Storage

```typescript
// Upload a file
const downloadURL = await firebaseService.storage.uploadFile(
  'users/123/profile.jpg',
  file
);

// Get a download URL
const url = await firebaseService.storage.getDownloadURL(
  'users/123/profile.jpg'
);

// Delete a file
await firebaseService.storage.deleteFile(
  'users/123/profile.jpg'
);

// List files in a directory
const files = await firebaseService.storage.listFiles(
  'users/123'
);
```

## Slide 3: Storage Best Practices

- Use a consistent naming convention
- Implement proper security rules
- Validate file types and sizes
- Use metadata for additional information
- Optimize images before uploading
- Use resumable uploads for large files
- Clean up unused files

## Slide 4: Storage Workflows

1. User Profile Images
   - Upload profile image
   - Resize and optimize
   - Store in users/{userId}/profile.jpg
   - Update user profile with download URL

2. Post Attachments
   - Upload attachment
   - Validate file type and size
   - Store in posts/{postId}/attachments/{fileName}
   - Add attachment reference to post

## Slide 5: Testing Storage

```typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  storage: {
    uploadFile: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn()
  }
}));

// Test uploading a file
test('uploadFile works correctly', async () => {
  firebaseService.storage.uploadFile.mockResolvedValue('https://example.com/image.jpg');
  const url = await uploadProfilePicture('123', file);
  expect(firebaseService.storage.uploadFile).toHaveBeenCalledWith('users/123/profile.jpg', file);
  expect(url).toBe('https://example.com/image.jpg');
});
```
