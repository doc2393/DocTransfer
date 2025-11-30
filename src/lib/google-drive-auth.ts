import { GOOGLE_DRIVE_CONFIG } from './google-drive-config';

// Google API client instance
let gapiInited = false;
let tokenClient: any = null;

/**
 * Initialize the Google API client
 */
export const initGoogleAuth = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Load the Google API client library
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            (window as any).gapi.load('client', async () => {
                try {
                    await (window as any).gapi.client.init({
                        apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
                        discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs,
                    });
                    gapiInited = true;

                    // Initialize Google Identity Services
                    const gisScript = document.createElement('script');
                    gisScript.src = 'https://accounts.google.com/gsi/client';
                    gisScript.onload = () => {
                        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                            client_id: GOOGLE_DRIVE_CONFIG.clientId,
                            scope: GOOGLE_DRIVE_CONFIG.scope,
                            callback: '', // Will be set during sign-in
                        });
                        resolve();
                    };
                    gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
                    document.head.appendChild(gisScript);
                } catch (error) {
                    reject(error);
                }
            });
        };
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.head.appendChild(script);
    });
};

/**
 * Sign in with Google and request Drive access
 */
export const signInWithGoogle = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google auth not initialized. Call initGoogleAuth() first.'));
            return;
        }

        tokenClient.callback = (response: any) => {
            if (response.error) {
                reject(response);
                return;
            }

            // Store access token
            localStorage.setItem('google_access_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('google_refresh_token', response.refresh_token);
            }

            resolve(response);
        };

        // Request an access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

/**
 * Sign out from Google and revoke access
 */
export const signOutGoogle = (): void => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
        (window as any).google.accounts.oauth2.revoke(token, () => {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_refresh_token');
        });
    }
};

/**
 * Get the current access token
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem('google_access_token');
};

/**
 * Check if user is authenticated with Google Drive
 */
export const isAuthenticated = (): boolean => {
    const token = getAccessToken();
    return !!token && gapiInited;
};

/**
 * Set access token in the Google API client
 */
export const setAccessToken = (token: string): void => {
    if ((window as any).gapi?.client) {
        (window as any).gapi.client.setToken({ access_token: token });
    }
};
