# Movigo Frontend

## Overview
Movigo is a Netflix-inspired movie streaming platform built with React and modern web technologies. This frontend application provides a responsive and engaging user interface for browsing movies, watching content, and managing user profiles.

## Features
- 🎬 Browse movies by category, genre, and popularity
- 👤 User authentication and profile management
- 📊 Watch history and statistics
- 🔍 Search functionality with filters
- 📱 Responsive design for all devices
- 🌙 Dark mode (Netflix-inspired theme)

## Tech Stack
- **React** - UI library
- **React Router** - Navigation
- **Axios** - API client
- **Chart.js** - Data visualization for watch statistics
- **CSS Modules** - Component styling

## Project Structure
```
frontend/
├── public/             # Static assets
│   ├── assets/         # Images and other assets
│   └── index.html      # HTML template
├── src/
│   ├── api/            # API client functions
│   ├── components/     # React components
│   │   ├── Auth/       # Authentication components
│   │   ├── MovieList/  # Movie list components
│   │   └── Profile/    # Profile components
│   ├── config/         # Configuration files
│   ├── pages/          # Page components
│   ├── styles/         # CSS files
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Application entry point
├── .env                # Environment variables (not in repo)
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
└── README.md           # This documentation
```

## Component Organization
The application uses a shared component architecture to minimize code duplication:

### Key Shared Components
- **MovieItem** - Reusable movie card component used in both grid and list views
- **LoadingSpinner** - Consistent loading indicator
- **FeaturedBanner** - Hero banner for featured content

### Feature-specific Components
- **Auth** - Login, Register, and authentication-related components
- **MovieList** - Various movie list display components
- **Profile** - User profile and statistics components

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   cd frontend
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

### Environment Variables
Key environment variables include:
- `VITE_API_URL`: URL to the backend API

## Development Guidelines

### Adding New Components
1. Create component files in the appropriate directory
2. Use the shared components whenever possible
3. Keep styling in separate CSS files
4. Follow the established naming conventions

### Code Style
- Use functional components with hooks
- Follow proper file structure and naming conventions
- Use constants for fixed values
- Document complex logic with comments

## Build and Deployment
Build the application for production:
```
npm run build
```

The build artifacts will be stored in the `dist/` directory, ready to be deployed.

## Available Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Browser Support
The application is tested and supported on the following browsers:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)

## Contributing
Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
