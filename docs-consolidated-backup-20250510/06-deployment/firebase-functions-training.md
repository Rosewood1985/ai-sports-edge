# Firebase Functions Training

## Slide 1: Introduction to Firebase Functions

- Firebase Functions are serverless functions
- Run in response to events or HTTP requests
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Functions

```typescript
// Call a function
const result = await firebaseService.functions.callFunction(
  'generateAIPick',
  { gameId: '123', userId: '456' }
);

// Call a function with HTTP trigger
const response = await firebaseService.functions.callHttpFunction(
  'api/generatePick',
  { gameId: '123', userId: '456' }
);
```

## Slide 3: Functions Best Practices

- Keep functions small and focused
- Use proper error handling
- Implement proper authentication
- Use environment variables for configuration
- Optimize cold start times
- Use proper logging
- Implement proper testing

## Slide 4: Common Function Types

1. Firestore Triggers
   - onCreate: When a document is created
   - onUpdate: When a document is updated
   - onDelete: When a document is deleted
   - onWrite: When a document is created, updated, or deleted

2. Authentication Triggers
   - onCreate: When a user is created
   - onDelete: When a user is deleted

3. HTTP Triggers
   - Express-like API
   - Authentication middleware
   - CORS handling

## Slide 5: Testing Functions

```typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  functions: {
    callFunction: jest.fn(),
    callHttpFunction: jest.fn()
  }
}));

// Test calling a function
test('callFunction works correctly', async () => {
  firebaseService.functions.callFunction.mockResolvedValue({ success: true, data: { pick: 'Team A' } });
  const result = await generateAIPick('123', '456');
  expect(firebaseService.functions.callFunction).toHaveBeenCalledWith('generateAIPick', { gameId: '123', userId: '456' });
  expect(result.success).toBe(true);
  expect(result.data.pick).toBe('Team A');
});
```
