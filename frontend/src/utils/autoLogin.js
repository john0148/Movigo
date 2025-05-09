/**
 * Auto Login Utility
 * 
 * This utility checks for auto-login credentials in environment variables
 * and automatically logs in the user if enabled.
 * For development only - should be disabled in production.
 */

import { login } from '../api/authApi';
import { USER_DATA_KEY, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY } from '../config/constants';
import { AUTO_LOGIN_CONFIG } from '../config/autoLogin';

// Key to store manual logout flag in localStorage
const MANUAL_LOGOUT_KEY = 'manual_logout';

/**
 * Clear any existing auth data from localStorage
 * @param {boolean} isManualLogout - Whether this is a manual logout (not auto cleanup)
 */
const clearExistingAuthData = (isManualLogout = false) => {
    // Remove all auth-related items from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    // If this is a manual logout, set the logout flag
    if (isManualLogout) {
        localStorage.setItem(MANUAL_LOGOUT_KEY, 'true');
        console.log('Manual logout flag set - auto-login disabled until next app start');
    }

    // Clear any other potential cached user data
    try {
        // Remove any items that might contain user information
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key &&
                key !== MANUAL_LOGOUT_KEY && // Don't remove the manual logout flag
                (key.includes('user') || key.includes('auth') || key.includes('token'))) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.error('Error clearing additional localStorage items:', e);
    }

    console.log('Cleared all existing auth data before auto-login');
};

/**
 * Mark that user has manually logged out
 */
export const setManualLogout = () => {
    // First, clear all authentication data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    // Then set the manual logout flag
    localStorage.setItem(MANUAL_LOGOUT_KEY, 'true');
    console.log('Manual logout flag set - auto-login disabled until next app start');

    // Also clear any other potential user/auth data
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key &&
                key !== MANUAL_LOGOUT_KEY &&
                (key.includes('user') || key.includes('auth') || key.includes('token'))) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.error('Error clearing additional localStorage items:', e);
    }
};

/**
 * Clear the manual logout flag (called when app starts fresh)
 */
export const clearManualLogoutFlag = () => {
    localStorage.removeItem(MANUAL_LOGOUT_KEY);
    console.log('Manual logout flag cleared - auto-login enabled for this session');
};

export const attemptAutoLogin = async () => {
    // IMPORTANT: First check if user has manually logged out
    const manualLogout = localStorage.getItem(MANUAL_LOGOUT_KEY);
    if (manualLogout) {
        console.log('User has manually logged out - skipping auto-login');
        return null;
    }

    // Check if auto-login is enabled in config
    if (!AUTO_LOGIN_CONFIG.enabled) {
        console.log('Auto-login is disabled in configuration');
        return null;
    }

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
            // Clear corrupted data
            localStorage.removeItem(USER_DATA_KEY);
            return null;
        }
    }

    try {
        console.log(`Attempting auto-login with: ${AUTO_LOGIN_CONFIG.email}`);

        // Clear any existing authentication data before attempting auto-login
        // But don't set the manual logout flag
        clearExistingAuthData(false);

        // Call the login API with configuration credentials
        const response = await login({
            email: AUTO_LOGIN_CONFIG.email,
            password: AUTO_LOGIN_CONFIG.password
        });

        if (response && response.access_token) {
            console.log('Auto-login successful with user:', response.user?.email || 'unknown');
            return response;
        } else {
            console.error('Auto-login failed: Invalid response');
            return null;
        }
    } catch (error) {
        console.error('Auto-login failed:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        return null;
    }
};

export const isAutoLoginEnabled = () => AUTO_LOGIN_CONFIG.enabled; 