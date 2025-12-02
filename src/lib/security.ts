/**
 * Security Helper Functions
 * 
 * This module provides security utilities for password hashing,
 * input validation, and other security-related operations.
 */

import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password (safe to store in database)
 */
export const hashPassword = async (password: string): Promise<string> => {
    if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
    }

    // Generate salt with 10 rounds (good balance of security and performance)
    const salt = await bcrypt.genSalt(10);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
};

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword - User-entered password
 * @param hashedPassword - Stored hashed password from database
 * @returns true if passwords match, false otherwise
 */
export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    if (!plainPassword || !hashedPassword) {
        return false;
    }

    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if valid email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Sanitize file name to prevent XSS and path traversal
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export const sanitizeFileName = (fileName: string): string => {
    // Remove path traversal attempts
    let sanitized = fileName.replace(/\.\./g, '');

    // Remove special characters except dots, underscores, hyphens
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Limit length
    if (sanitized.length > 255) {
        const ext = sanitized.split('.').pop() || '';
        sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
    }

    return sanitized;
};

/**
 * Generate a secure random string for share links
 * @param length - Length of random string (default: 10)
 * @returns Random string safe for URLs
 */
export const generateSecureToken = (length: number = 10): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Use crypto.getRandomValues for cryptographically secure randomness
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }

    return result;
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid and message
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    message: string;
} => {
    if (password.length < 6) {
        return {
            isValid: false,
            message: 'Password must be at least 6 characters long'
        };
    }

    // Optional: Add more strength requirements
    // if (!/[A-Z]/.test(password)) {
    //     return {
    //         isValid: false,
    //         message: 'Password must contain at least one uppercase letter'
    //     };
    // }

    return {
        isValid: true,
        message: 'Password is valid'
    };
};

/**
 * Rate limiter for client-side operations
 * Stores timestamps in memory (resets on page refresh)
 */
class RateLimiter {
    private attempts: Map<string, number[]> = new Map();

    /**
     * Check if action is allowed based on rate limit
     * @param key - Unique identifier (e.g., email address)
     * @param maxAttempts - Maximum attempts allowed
     * @param windowMs - Time window in milliseconds
     * @returns Object with allowed status and time to wait
     */
    check(
        key: string,
        maxAttempts: number = 5,
        windowMs: number = 60000
    ): { allowed: boolean; waitTime: number } {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
            return { allowed: false, waitTime };
        }

        // Record this attempt
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);

        return { allowed: true, waitTime: 0 };
    }

    /**
     * Clear all attempts for a specific key
     */
    clear(key: string): void {
        this.attempts.delete(key);
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
