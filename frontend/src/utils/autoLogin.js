/**
 * Auto Login Utility
 * 
 * This utility checks for auto-login credentials in environment variables
 * and automatically logs in the user if enabled.
 */

import { login } from '../api/authApi';

const AUTO_LOGIN_EMAIL = import.meta.env.VITE_AUTO_LOGIN_EMAIL;
const AUTO_LOGIN_PASSWORD = import.meta.env.VITE_AUTO_LOGIN_PASSWORD;
const ENABLE_AUTO_LOGIN = import.meta.env.VITE_ENABLE_AUTO_LOGIN === 'true';

export const attemptAutoLogin = async () => {
    // Check if auto-login is enabled and credentials are provided
    if (!ENABLE_AUTO_LOGIN || !AUTO_LOGIN_EMAIL || !AUTO_LOGIN_PASSWORD) {
        console.log('Auto-login is disabled or credentials are missing');
        return null;
    }

    try {
        console.log(`Attempting auto-login with email: ${AUTO_LOGIN_EMAIL}`);

        // Call the login API with properly formatted credentials
        const response = await login({
            email: AUTO_LOGIN_EMAIL,
            password: AUTO_LOGIN_PASSWORD
        });

        if (response && response.access_token) {
            console.log('Auto-login successful');
            return response;
        } else {
            console.error('Auto-login failed: Invalid response', response);
            return null;
        }
    } catch (error) {
        console.error('Auto-login failed:', error);
        return null;
    }
};

export const isAutoLoginEnabled = () => ENABLE_AUTO_LOGIN; 