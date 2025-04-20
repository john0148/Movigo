# Movigo API Backend

## Overview
Movigo is a Netflix-inspired movie streaming platform backend built with FastAPI, MongoDB, and modern Python. This API provides all the core services needed to run a movie streaming platform including:

- User authentication (register, login, social auth)
- User profile management
- Movie browsing and searching
- Watch history tracking and statistics
- Subscription management

## Project Structure

```
backend/
├── app/                  # Main application package
│   ├── api/              # API endpoints and routers
│   ├── core/             # Core configurations and settings
│   ├── crud/             # Database operations
│   ├── db/               # Database connection and models
│   ├── schemas/          # Pydantic models/schemas
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── main.py           # FastAPI application entry point
├── tests/                # Test suite
├── migrations/           # Database migrations
├── .env                  # Environment variables (not in repo)
├── .env.example          # Example environment variables
└── README.md             # This documentation
```

## Key Features

### Authentication and Security
- JWT-based authentication
- Token refresh mechanism
- Password hashing with bcrypt
- Role-based access control
- Google OAuth integration

### Movie Management
- Movie metadata and search
- Genre-based categorization
- Featured movies and recommendations
- View count tracking

### User Profiles
- User registration and profile management
- Avatar upload and management
- Subscription tiers (Basic, Standard, Premium)
- Watch history and statistics

### Watch History
- Track watch progress
- Generate watch statistics
- Time-based analytics (weekly, monthly, yearly)
- Genre preferences analysis

## API Endpoints

The API is organized around the following main resources:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/movies/*` - Movie browsing and details
- `/api/v1/profile/*` - User profile management
- `/api/v1/watch-stats/*` - Watch history and statistics

For detailed API documentation, visit the `/api/v1/docs` endpoint when the server is running.

## Getting Started

### Prerequisites
- Python 3.9+
- MongoDB 4.4+
- Poetry (Python dependency management)

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   cd backend
   poetry install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   poetry run uvicorn app.main:app --reload
   ```

### Environment Variables
Key environment variables include:
- `MONGODB_URL`: MongoDB connection string
- `SECRET_KEY`: Secret key for JWT token generation
- `ALGORITHM`: Algorithm used for JWT (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT expiration time

## Development

### Adding a New Feature
1. Create schemas in `app/schemas/`
2. Implement CRUD operations in `app/crud/`
3. Add business logic in `app/services/` if needed
4. Create API endpoints in `app/api/`
5. Register the router in `app/main.py`
6. Add tests in `tests/`

### Database Operations
All database operations are handled through CRUD classes in the `app/crud/` directory. Each resource (movies, users, etc.) has its own CRUD class with standard operations.

### Testing
Run the test suite with:
```
poetry run pytest
```

## Deployment
The API can be deployed using various methods:
- Docker container
- Kubernetes
- Traditional hosting with Gunicorn and Uvicorn

Detailed deployment instructions are available in the `/docs/deployment.md` file.

## Contributing
Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 