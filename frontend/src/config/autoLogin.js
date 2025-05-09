/**
 * Auto-login configuration
 * 
 * This file contains the configuration for the auto-login feature.
 * Only the email and password are stored here to avoid hard-coding all user information.
 * The actual user data is retrieved from the backend API.
 */

export const AUTO_LOGIN_CONFIG = {
    // Whether auto-login is enabled
    enabled: true,

    // Default email for auto-login (must match a user in MongoDB)
    email: "admin@movigo.com",

    // Default password for auto-login
    password: "admin123"
}; 