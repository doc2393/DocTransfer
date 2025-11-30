// Google Drive API Configuration
export const GOOGLE_DRIVE_CONFIG = {
    // OAuth 2.0 Client ID from Google Cloud Console
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

    // API Key from Google Cloud Console
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',

    // OAuth scopes required for file upload and sharing
    scope: [
        'https://www.googleapis.com/auth/drive.file',  // Access to files created by this app
        'https://www.googleapis.com/auth/drive.readonly', // Read file metadata
    ].join(' '),

    // Discovery docs for Google Drive API v3
    discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ],

    // Maximum file size for simple upload (5MB)
    // Files larger than this will use resumable upload
    simpleUploadLimit: 5 * 1024 * 1024, // 5MB in bytes

    // Maximum supported file size (2TB)
    maxFileSize: 2 * 1024 * 1024 * 1024 * 1024, // 2TB in bytes
};

export interface ShareSettings {
    password?: string;
    expiresAt?: string;
    allowDownload: boolean;
    emailVerification?: boolean;
    allowedEmail?: string;
}
