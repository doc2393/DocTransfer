import type { ShareSettings } from './google-drive-config';
import { GOOGLE_DRIVE_CONFIG } from './google-drive-config';
import { getAccessToken, setAccessToken } from './google-drive-auth';

interface UploadResult {
    fileId: string;
    name: string;
    size: number;
    mimeType: string;
    webViewLink: string;
    webContentLink: string;
}

/**
 * Upload a file to Google Drive with progress tracking
 */
export const uploadFileToDrive = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<UploadResult> => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    setAccessToken(token);

    // Use resumable upload for files larger than 5MB
    if (file.size > GOOGLE_DRIVE_CONFIG.simpleUploadLimit) {
        return uploadFileResumable(file, token, onProgress);
    } else {
        return uploadFileSimple(file, token);
    }
};

/**
 * Simple upload for small files (<5MB)
 */
const uploadFileSimple = async (file: File, token: string): Promise<UploadResult> => {
    const metadata = {
        name: file.name,
        mimeType: file.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink,webContentLink',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form,
        }
    );

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        fileId: data.id,
        name: data.name,
        size: parseInt(data.size),
        mimeType: data.mimeType,
        webViewLink: data.webViewLink,
        webContentLink: data.webContentLink,
    };
};

/**
 * Resumable upload for large files (>5MB)
 */
const uploadFileResumable = async (
    file: File,
    token: string,
    onProgress?: (progress: number) => void
): Promise<UploadResult> => {
    // Step 1: Initiate resumable upload session
    const metadata = {
        name: file.name,
        mimeType: file.type,
    };

    const initResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,webViewLink,webContentLink',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        }
    );

    if (!initResponse.ok) {
        throw new Error(`Failed to initiate upload: ${initResponse.statusText}`);
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
        throw new Error('No upload URL received');
    }

    // Step 2: Upload file in chunks
    return uploadInChunks(uploadUrl, file, onProgress);
};

/**
 * Upload file in chunks with progress tracking
 */
const uploadInChunks = async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
): Promise<UploadResult> => {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    let start = 0;

    while (start < file.size) {
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Length': chunk.size.toString(),
                'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
            },
            body: chunk,
        });

        if (response.status === 200 || response.status === 201) {
            // Upload complete
            const data = await response.json();
            if (onProgress) onProgress(100);
            return {
                fileId: data.id,
                name: data.name,
                size: parseInt(data.size),
                mimeType: data.mimeType,
                webViewLink: data.webViewLink,
                webContentLink: data.webContentLink,
            };
        } else if (response.status === 308) {
            // Resume incomplete, continue with next chunk
            start = end;
            if (onProgress) {
                const progress = Math.round((start / file.size) * 100);
                onProgress(progress);
            }
        } else {
            throw new Error(`Upload failed at byte ${start}: ${response.statusText}`);
        }
    }

    throw new Error('Upload completed but no response received');
};

/**
 * Create a shareable link for a Google Drive file
 */
export const createShareableLink = async (
    fileId: string,
    settings: ShareSettings
): Promise<string> => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    // Set file permissions to anyone with the link
    const permissionResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: settings.allowDownload ? 'reader' : 'viewer',
                type: 'anyone',
            }),
        }
    );

    if (!permissionResponse.ok) {
        throw new Error(`Failed to set permissions: ${permissionResponse.statusText}`);
    }

    // Get the shareable link
    const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink,webContentLink`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!fileResponse.ok) {
        throw new Error(`Failed to get file link: ${fileResponse.statusText}`);
    }

    const fileData = await fileResponse.json();
    return fileData.webViewLink;
};

/**
 * Get file metadata from Google Drive
 */
export const getFileMetadata = async (fileId: string): Promise<any> => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,createdTime,modifiedTime,webViewLink`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.statusText}`);
    }

    return await response.json();
};

/**
 * Delete a file from Google Drive
 */
export const deleteFile = async (fileId: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
    }
};
