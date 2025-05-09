/**
 * Demo API for development purposes
 * 
 * Provides functions to automatically log in with a demo user
 * for development and testing.
 */

import axios from 'axios';
import { setAuthData, login } from './authApi';
import { API_BASE_URL, BACKUP_API_URL } from '../config/constants';
import { handleApiError } from '../utils/errorHandler';
import { AUTO_LOGIN_CONFIG } from '../config/autoLogin';

let API_URL = `${API_BASE_URL}/demo`;
let useBackupUrl = false;

/**
 * Switch to the backup URL if the primary URL fails
 */
const switchToBackupUrl = () => {
    if (!useBackupUrl) {
        API_URL = `${BACKUP_API_URL}/demo`;
        useBackupUrl = true;
        console.log('Switched to backup API URL:', API_URL);
        return true;
    }
    return false;
};

/**
 * Get a random demo user for auto-login
 * @returns {Promise<Object>} Demo user credentials
 */
export const getDemoUser = async () => {
    try {
        console.log(`Fetching random demo user from ${API_URL}/demo-user`);
        const response = await axios.get(`${API_URL}/demo-user`);
        console.log('Demo user data received:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching demo user:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.request) {
            console.error('No response received. Request:', error.request);

            // Try backup URL if we haven't already
            if (switchToBackupUrl()) {
                console.log('Retrying with backup URL...');
                return getDemoUser();
            }
        }
        return handleApiError(error, 'Failed to get demo user');
    }
};

/**
 * Get the default user for auto-login
 * @returns {Promise<Object>} Default user credentials
 */
export const getDefaultUser = async () => {
    try {
        console.log(`Fetching default user from ${API_URL}/default-user`);
        const response = await axios.get(`${API_URL}/default-user`);
        console.log('Default user data received:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to get default user:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.request) {
            console.error('No response received. Request:', error.request);

            // Try backup URL if we haven't already
            if (switchToBackupUrl()) {
                console.log('Retrying with backup URL...');
                return getDefaultUser();
            }
        } else {
            console.error('Error message:', error.message);
        }

        console.log('Falling back to random demo user...');
        // If default user fails, try to get a random demo user as fallback
        return getDemoUser();
    }
};

/**
 * Auto login with a demo user
 * Sets the authentication data in localStorage for development
 * @param {boolean} useDefaultUser Whether to use the default user instead of a random one
 * @returns {Promise<Object>} Authentication data including user and token
 */
export const autoLoginWithDemoUser = async (useDefaultUser = true) => {
    try {
        console.log(`Starting auto-login process, useDefaultUser=${useDefaultUser}`);

        // Reset to primary URL at the start of auto-login process
        API_URL = `${API_BASE_URL}/demo`;
        useBackupUrl = false;

        // Get either the default user or a random demo user
        const demoUser = useDefaultUser
            ? await getDefaultUser()
            : await getDemoUser();

        if (!demoUser) {
            console.error('No demo user available');
            return null;
        }

        console.log('Retrieved user for auto-login:', {
            id: demoUser.id,
            email: demoUser.email,
            plan: demoUser.subscription_plan
        });

        // Create fake authentication data
        const authData = {
            access_token: `demo_token_${demoUser.id}`,
            refresh_token: `demo_refresh_${demoUser.id}`,
            token_type: 'bearer',
            expires_in: 3600 * 24 * 7, // 7 days
            user: {
                id: demoUser.id,
                email: demoUser.email,
                full_name: demoUser.full_name,
                avatar_url: demoUser.avatar_url,
                subscription_plan: demoUser.subscription_plan
            }
        };

        // Set auth data in localStorage
        setAuthData(authData);

        console.log(`Auto-logged in as demo user: ${demoUser.email} (${demoUser.subscription_plan} plan)`);
        return authData;
    } catch (error) {
        console.error('Auto-login failed:', error);
        return null;
    }
};

/**
 * Tiện ích encode base64 an toàn cho môi trường browser và node
 */
const safeEncode = (str) => {
    try {
        return window.btoa(str);
    } catch (e) {
        // Fallback nếu btoa không khả dụng
        console.warn('btoa không khả dụng, sử dụng fallback');
        return str;
    }
};

/**
 * Auto login with fixed credentials from config
 * Sets the authentication data in localStorage
 * @returns {Promise<Object>} Authentication data including user and token
 */
export const autoLoginWithFixedCredentials = async () => {
    try {
        console.log('Starting auto-login with fixed credentials');

        // Skip if auto-login is disabled in config
        if (!AUTO_LOGIN_CONFIG.enabled) {
            console.log('Auto-login is disabled in configuration');
            return null;
        }

        const credentials = {
            email: AUTO_LOGIN_CONFIG.email,
            password: AUTO_LOGIN_CONFIG.password,
            remember_me: true // Assuming remember_me is handled by token lifetime
        };

        console.log(`Attempting to login via /auth/login/json with email: ${credentials.email}`);

        try {
            // Call the actual login API endpoint
            const response = await axios.post(
                `${API_BASE_URL}/auth/login/json`,
                credentials,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (response && response.data && response.data.access_token) {
                // Login successful, use the real token from the server
                const authData = response.data;

                // Ensure user data is included or fetch it if necessary
                // The backend's /login/json should ideally return user info alongside the token.
                // If not, we might need a separate call to /profiles/me here, 
                // but let's assume login returns enough info for now.
                if (!authData.user) {
                    // Try to reconstruct basic user info from credentials if backend doesn't provide it
                    // This is not ideal, backend should return user info.
                    console.warn('Backend /login/json did not return user info, reconstructing basic info.')
                    authData.user = {
                        email: credentials.email,
                        // Add other known/default fields if necessary
                        full_name: "Movigo User" // Placeholder
                    };
                }

                console.log('Real login successful via /auth/login/json');
                console.log(`Logged in as: ${authData.user?.email || credentials.email}`);

                // Store the valid auth data (including the real JWT token)
                setAuthData(authData);

                return authData; // Return the valid auth data
            } else {
                // Handle cases where response is OK but data is incomplete
                console.error('Login response from /auth/login/json incomplete or missing token:', response.data);
                return null; // Indicate login failure
            }

        } catch (loginError) {
            console.error('Failed to login via /auth/login/json:', loginError.response?.data || loginError.message);
            // DO NOT create a manual token here. If real login fails, let it fail.
            return null; // Indicate login failure
        }

    } catch (error) {
        // Catch any other unexpected errors in the outer try block
        console.error('Unexpected error during autoLoginWithFixedCredentials:', error);
        return null; // Indicate failure
    }
}; 