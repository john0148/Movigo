# API Client Documentation

## Overview
This directory contains the API client functions that interface with the Movigo backend. Each file corresponds to a specific domain of functionality and follows a consistent pattern for error handling and request formatting.

## Files Structure

### `authApi.js`
Authentication-related API functions including:
- `login(credentials)` - User login with email/password
- `register(userData)` - Register new user
- `loginWithGoogle()` - Google OAuth authentication
- `logout()` - User logout
- `refreshAccessToken(refreshToken)` - Refresh expired JWT
- `getCurrentUser()` - Get current user details
- `isAuthenticated()` - Check if user is authenticated

### `movieApi.js`
Movie-related API functions including:
- `getRandomMovies(limit)` - Get random movies
- `getMostViewedMovies(limit)` - Get most viewed movies
- `getFeaturedMovies(limit)` - Get featured movies
- `getMovieDetails(id)` - Get detailed movie information
- `searchMovies(query, genre, year, page, limit)` - Search for movies
- `incrementMovieView(id)` - Increment movie view count
- `getMoviesByGenre(genre, limit)` - Get movies by genre
- `fetchRelatedMovies(movieId, limit)` - Get related movies

### `profileApi.js`
User profile API functions including:
- `getUserProfile()` - Get user profile information
- `updateProfile(profileData)` - Update user profile
- `uploadAvatar(formData)` - Upload user avatar
- `updateSettings(settingsData)` - Update user settings

### `watchHistoryApi.js`
Watch history API functions including:
- `getWatchStats()` - Get user watch statistics
- `getWatchHistory(page, limit)` - Get user watch history
- `getWatchHistoryEntry(entryId)` - Get specific watch history entry
- `deleteWatchHistoryEntry(entryId)` - Delete watch history entry

## Common Patterns

### Error Handling
All API functions use a consistent error handling pattern:
```javascript
try {
  const response = await axios.get(url);
  return response.data;
} catch (error) {
  return handleApiError(error, 'User-friendly error message');
}
```

The `handleApiError` utility:
1. Logs the error for debugging
2. Extracts proper error messages from response data
3. Handles specific HTTP status codes appropriately
4. Returns a consistent error format to the caller

### Authentication
API requests requiring authentication automatically include the JWT token through Axios interceptors configured in `authApi.js`.

### Request Formatting
- GET requests with parameters use the `params` option
- POST/PUT requests pass data in the request body
- File uploads use `FormData`

## Adding New API Functions

To add a new API function:

1. Choose the appropriate file based on the domain of functionality
2. Follow the established patterns for function structure
3. Use proper JSDoc documentation
4. Implement consistent error handling
5. Test the function with both successful and error states

## Best Practices

1. Keep functions focused on a single responsibility
2. Use clear, descriptive function names
3. Document all parameters and return values
4. Handle errors gracefully with user-friendly messages
5. Use proper typing with JSDoc for better IDE support 