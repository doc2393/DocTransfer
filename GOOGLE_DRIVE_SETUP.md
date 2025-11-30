# Google Drive Integration Setup Guide

## Prerequisites

Before using the Google Drive integration feature, you need to set up Google Cloud credentials. Follow these steps:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "DocTransfer")
5. Click **"Create"**

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, make sure your new project is selected
2. Go to **"APIs & Services" > "Library"**
3. Search for **"Google Drive API"**
4. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** (unless you're using Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: DocTransfer (or your app name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On the **Scopes** page, click **"Add or Remove Scopes"**
   - Search and add: `.../auth/drive.file`
   - Search and add: `.../auth/drive.readonly`
7. Click **"Save and Continue"**
8. On **Test users**, click **"Add Users"** and add your email for testing
9. Click **"Save and Continue"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Choose **"Web application"**
4. Enter a name (e.g., "DocTransfer Web Client")
5. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:5173
   ```
   (Add your production domain later)
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:5173
   ```
7. Click **"Create"**
8. **Copy** the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
9. Keep this window open, you'll need these values

## Step 5: Create API Key

1. Still in **"Credentials"**, click **"Create Credentials" > "API key"**
2. **Copy** the API key that appears
3. (Optional) Click **"Restrict Key"** to add security:
   - Under **API restrictions**, select **"Restrict key"**
   - Choose **"Google Drive API"**
   - Click **"Save"**

## Step 6: Update Environment Variables

1. Open your `.env` file in the project root
2. Add your credentials:
   ```env
   # Google Drive API Configuration
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```
3. Replace `your_client_id_here` and `your_api_key_here` with the values you copied
4. Save the file

## Step 7: Run Database Migration

Run the SQL migration to add Google Drive support to your database:

1. Open Supabase dashboard
2. Go to **SQL Editor**
3. Open the file `add_google_drive_support.sql`
4. Copy and run the SQL commands

Or run manually:
```sql
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_link TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_storage_type ON documents(storage_type);
CREATE INDEX IF NOT EXISTS idx_documents_google_drive_file_id ON documents(google_drive_file_id);
```

## Step 8: Restart Development Server

1. Stop the development server if it's running (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Using Google Drive Integration

1. Navigate to the dashboard at `/dataroom`
2. Click on the **"Google Drive"** tab
3. Click **"Sign in with Google"**
4. Grant permissions to your app
5. Upload files up to 2TB!

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure your authorized redirect URI in Google Cloud Console exactly matches your app's URL
- For local development, use `http://localhost:5173`

### "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen setup
- Add yourself as a test user
- Make sure all required scopes are added

### API Key errors
- Verify the API key is correctly added to `.env`
- Make sure Google Drive API is enabled
- Restart your dev server after changing `.env`

## Production Deployment

When deploying to production:

1. Add your production domain to **"Authorized JavaScript origins"**
2. Add your production domain to **"Authorized redirect URIs"**
3. Update your production `.env` with the same credentials
4. Submit your app for OAuth verification if needed (for public use)

---

**Note**: Keep your Client ID and API Key secure. Never commit `.env` to version control!
