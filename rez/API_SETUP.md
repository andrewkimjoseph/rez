# API Routes Setup

This document describes the two new API routes created for fetching tasks and task completions using Google Cloud Service account authentication.

## API Routes

### 1. `/api/fetchAllTasksForRezTaskMaster`
- **Method**: GET
- **Query Parameters**: `rezTaskMasterEmailAddress` (required)
- **Description**: Fetches all tasks for a specific RezTaskMaster
- **Response**: JSON object with `tasks` array

### 2. `/api/fetchAllTaskCompletionsForRezTaskMaster`
- **Method**: GET
- **Query Parameters**: `rezTaskMasterEmailAddress` (required)
- **Description**: Fetches all task completions for tasks owned by a specific RezTaskMaster
- **Response**: JSON object with `taskCompletions` array

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Firebase Service Account Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
```

## Setup Instructions

1. **Create a Google Cloud Service Account**:
   - Go to Google Cloud Console
   - Navigate to IAM & Admin > Service Accounts
   - Create a new service account or use an existing one
   - Download the JSON key file

2. **Set up Firebase Admin SDK**:
   - The Firebase Admin SDK has been added as a dependency
   - The service account credentials will be used to authenticate with Firestore

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Usage Examples**:
   ```javascript
   // Fetch all tasks for a taskMaster
   const response = await fetch('/api/fetchAllTasksForRezTaskMaster?rezTaskMasterEmailAddress=your-email@example.com');
   const data = await response.json();
   
   // Fetch all task completions for a taskMaster
   const response = await fetch('/api/fetchAllTaskCompletionsForRezTaskMaster?rezTaskMasterEmailAddress=your-email@example.com');
   const data = await response.json();
   ```

## Security Notes

- The API routes use server-side authentication with Firebase Service Account
- The service account should have appropriate Firestore read permissions
- The `rezTaskMasterEmailAddress` parameter is used to filter results for security
- Error handling is implemented for missing parameters and database errors 