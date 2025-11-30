/**
 * Utility functions for Google Drive link handling
 */

/**
 * Validate if a URL is a valid Google Drive share link
 */
export const isValidGoogleDriveLink = (url: string): boolean => {
    const patterns = [
        /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
        /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
        /^https:\/\/drive\.google\.com\/uc\?id=[a-zA-Z0-9_-]+/,
        /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/,
        /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/,
        /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/,
    ];

    return patterns.some(pattern => pattern.test(url));
};

/**
 * Extract file ID from Google Drive URL
 */
export const extractFileId = (url: string): string | null => {
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

/**
 * Convert any Google Drive URL to a direct download link format
 */
export const convertToDirectLink = (url: string): string => {
    const fileId = extractFileId(url);
    if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
};

/**
 * Get embed URL for preview
 */
export const getEmbedUrl = (url: string): string => {
    const fileId = extractFileId(url);
    if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
};

/**
 * Get file type from Google Drive URL
 */
export const getFileTypeFromUrl = (url: string): string => {
    if (url.includes('/document/')) return 'Google Docs';
    if (url.includes('/spreadsheets/')) return 'Google Sheets';
    if (url.includes('/presentation/')) return 'Google Slides';
    if (url.includes('/file/')) return 'Google Drive File';
    return 'Google Drive';
};
