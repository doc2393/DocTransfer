/**
 * Secure File Encryption using Web Crypto API (AES-256-GCM)
 * This uses the browser's native crypto implementation for maximum security and performance.
 */

// Convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

// Convert ArrayBuffer to Base64 string
const ab2str = (buf: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
};

// Convert Base64 string to ArrayBuffer
const str2ab_base64 = (str: string): ArrayBuffer => {
    return str2ab(atob(str));
};

/**
 * Generate a secure random AES-256 key
 */
export const generateKey = async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
};

/**
 * Export key to base64 string for storage
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return ab2str(exported);
};

/**
 * Import key from base64 string
 */
export const importKey = async (keyStr: string): Promise<CryptoKey> => {
    const keyBuffer = str2ab_base64(keyStr);
    return await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
};

/**
 * Encrypt a file using AES-256-GCM
 */
export const encryptFile = async (
    file: File
): Promise<{
    encryptedBlob: Blob;
    key: string;
    iv: string;
}> => {
    // 1. Generate Key
    const key = await generateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

    // 2. Read File
    const arrayBuffer = await file.arrayBuffer();

    // 3. Encrypt
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        arrayBuffer
    );

    // 4. Export Key & IV
    const keyStr = await exportKey(key);
    const ivStr = ab2str(iv.buffer);

    return {
        encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
        key: keyStr,
        iv: ivStr,
    };
};

/**
 * Decrypt a file using AES-256-GCM
 */
export const decryptFile = async (
    encryptedBlob: Blob,
    keyStr: string,
    ivStr: string,
    fileType: string
): Promise<Blob> => {
    // 1. Import Key & IV
    const key = await importKey(keyStr);
    const iv = str2ab_base64(ivStr);

    // 2. Read Encrypted Blob
    const encryptedBuffer = await encryptedBlob.arrayBuffer();

    // 3. Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(iv),
        },
        key,
        encryptedBuffer
    );

    return new Blob([decryptedBuffer], { type: fileType });
};
