/**
 * Auto Login Utility
 * 
 * This utility checks for auto-login credentials in environment variables
 * and automatically logs in the user if enabled.
 * For development only - should be disabled in production.
 */

import { login } from '../api/authApi';
import { USER_DATA_KEY, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY } from '../config/constants';

// Credentials for first login when no user exists
const DEV_EMAIL = 'admin@movigo.com';
const DEV_PASSWORD = 'admin123';
const ENABLE_AUTO_LOGIN = false; // Disable auto-login by default

/**
 * Clear any existing auth data from localStorage
 */
const clearExistingAuthData = () => {
    // Remove all auth-related items from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    // Clear any other potential cached user data
    try {
        // Remove any items that might contain user information
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('user') || key.includes('auth') || key.includes('token'))) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.error('Error clearing additional localStorage items:', e);
    }

    console.log('Cleared all existing auth data before auto-login');
};

export const attemptAutoLogin = async () => {
    // Check if there's already a user logged in
    const existingUserData = localStorage.getItem(USER_DATA_KEY);

    if (existingUserData) {
        try {
            // Parse existing user data
            const userData = JSON.parse(existingUserData);
            console.log('User already logged in, skipping auto-login:', userData.email);

            // Return existing user data in the expected format
            return {
                access_token: localStorage.getItem(AUTH_TOKEN_KEY) || 'existing-token',
                refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) || 'existing-refresh-token',
                expires_in: 3600,
                user: userData
            };
        } catch (error) {
            console.error('Error parsing existing user data:', error);
            // Don't continue with auto-login if we can't parse user data
            return null;
        }
    }

    // Check if auto-login is enabled
    if (!ENABLE_AUTO_LOGIN) {
        console.log('Auto-login is disabled');
        return null;
    }

    try {
        console.log(`Attempting development auto-login with: ${DEV_EMAIL}`);

        // Call the login API with development credentials
        const response = await login({
            email: DEV_EMAIL,
            password: DEV_PASSWORD
        });

        if (response && response.access_token) {
            console.log('Auto-login successful with user:', response.user.email);
            return response;
        } else {
            console.error('Auto-login failed: Invalid response');
            return null;
        }
    } catch (error) {
        console.error('Auto-login failed:', error);
        return null;
    }
};

export const isAutoLoginEnabled = () => ENABLE_AUTO_LOGIN; 