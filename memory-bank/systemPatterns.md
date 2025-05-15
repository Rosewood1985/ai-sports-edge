# Firebase Atomic Architecture Patterns

This document outlines the key patterns and approaches used in migrating services to the Firebase atomic architecture.

## Import Patterns

```typescript
// Old pattern - direct Firebase imports
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/auth';

// New pattern - atomic architecture imports
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import { trackEvent } from '../src/atomic/molecules/analyticsService';
```

## Firestore Operations

### Document Operations

```typescript
// Old pattern
const db = firestore;
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();

// New pattern
const userDoc = await firebaseService.firestore.getDocument('users', userId);
const userData = userDoc as any; // Type assertion for backward compatibility
```

### Collection Operations

```typescript
// Old pattern
const db = firestore;
const querySnapshot = await db
  .collection('users')
  .doc(userId)
  .collection('purchases')
  .where('status', '==', 'succeeded')
  .get();
const purchases = querySnapshot.docs.map(doc => doc.data());

// New pattern
const purchasesCollection = await firebaseService.firestore.getCollection(
  `users/${userId}/purchases`,
  [firebaseService.firestore.where('status', '==', 'succeeded')]
);
const purchases = purchasesCollection;
```

### Document Updates

```typescript
// Old pattern
const userDocRef = doc(firestore, 'users', userId);
await updateDoc(userDocRef, {
  lastFreeDailyPick: serverTimestamp(),
});

// New pattern
await firebaseService.firestore.updateDocument('users', userId, {
  lastFreeDailyPick: firebaseService.firestore.serverTimestamp(),
});
```

## Firebase Functions

```typescript
// Old pattern
const createSubscriptionFunc = functions.httpsCallable('createSubscription');
const result = await createSubscriptionFunc({
  userId,
  paymentMethodId,
  priceId: plan.priceId,
});
return result.data.status === 'active';

// New pattern
const result = await firebaseService.functions.callFunction('createSubscription', {
  userId,
  paymentMethodId,
  priceId: plan.priceId,
});
return (result as any).status === 'active';
```

## Error Handling

```typescript
// Consistent error handling pattern
try {
  // Firebase operations
} catch (error) {
  console.error('Error message:', error);
  return fallbackValue;
}
```

## Type Safety

```typescript
// Using type assertions for backward compatibility
const result = await firebaseService.functions.callFunction('functionName', params);
return (result as any).specificProperty === expectedValue;
```

## Testing Considerations

- Mock the firebaseService instead of individual Firebase modules
- Create test utilities that simulate the atomic architecture interfaces
- Use dependency injection for easier testing

## Task Caching System Patterns

### Task Structure

```json
{
  "task": "Description of the task",
  "status": "pending|in-progress|completed",
  "timestamp": "ISO timestamp of last update",
  "source": "File or location where task originated",
  "priority": "low|medium|high"
}
```

### Fuzzy Matching for Deduplication

```bash
# Calculate similarity between two strings using Levenshtein distance
calculate_similarity() {
  local str1="$1"
  local str2="$2"

  # Convert to lowercase for case-insensitive comparison
  str1=$(echo "$str1" | tr '[:upper:]' '[:lower:]')
  str2=$(echo "$str2" | tr '[:upper:]' '[:lower:]')

  # Use Python to calculate Levenshtein distance and similarity percentage
  local similarity=$(python3 -c "
import sys
def levenshtein(s1, s2):
    # Levenshtein distance algorithm implementation
    # ...

s1 = '$str1'
s2 = '$str2'
distance = levenshtein(s1, s2)
max_len = max(len(s1), len(s2))
similarity = (1 - distance / max_len) * 100
print(int(similarity))
")

  echo $similarity
}

# Check if a similar task already exists
find_similar_task() {
  local task="$1"
  local similarity_threshold=70

  # Loop through each task and check similarity
  for (( i=0; i<$task_count; i++ )); do
    local existing_task=$(echo "$todos" | jq -r ".[$i].task")
    local similarity=$(calculate_similarity "$task" "$existing_task")

    if [ $similarity -ge $similarity_threshold ]; then
      echo $i
      return
    fi
  done
}
```

### Memory Bank Integration

```bash
# Sync tasks with memory bank files
sync_tasks_with_memory_bank() {
  # Update activeContext.md with pending and in-progress tasks
  # Update progress.md with completed tasks
  # Update decisionLog.md with task status changes
}
```

### Command-Line Interface

```bash
# Bash aliases for common operations
alias tasks="scripts/manage-tasks.sh list"
alias task-add="scripts/manage-tasks.sh add"
alias task-complete="scripts/manage-tasks.sh complete"

# Bash functions for advanced operations
function task() {
  # Add a task with priority
  scripts/manage-tasks.sh add "$1" "${2:-unknown}" "${3:-medium}"
}

function extract-tasks-from-diff() {
  # Extract tasks from git diff
  git diff "$1..$2" | grep -E '^\+.*TODO:' | while read -r line; do
    # Extract and add tasks
  done
}
```

### Context Tagging Integration

```bash
# Update todo.json with a task from tag-context.sh
update_todo_json() {
  local file="$1"
  local task="$2"

  # Call the manage-tasks.sh script to add the task
  "$SCRIPT_DIR/manage-tasks.sh" add "$task" "$file"
}
```

Last updated: 2025-05-13 20:43:32
