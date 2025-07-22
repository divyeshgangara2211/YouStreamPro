# YouStreamPro Backend

YouStreamPro Backend powers a scalable, feature-rich video streaming platform inspired by YouTube. Built with Node.js, Express, and MongoDB, it provides secure, modular RESTful APIs for user management, video uploads, playlists, comments, likes, analytics, and more. The backend is designed for extensibility, maintainability, and high performance, with robust authentication, cloud integration, and real-time features.

## Features

- **User Authentication & Authorization:** Secure JWT-based login, registration, password management, and protected routes.
- **Video Management:** Upload, stream, and manage videos with Cloudinary cloud storage integration.
- **Playlists:** Create, update, delete, and manage video playlists.
- **Comments & Likes:** Add, edit, delete comments; like/unlike videos and comments.
- **Subscriptions:** Subscribe/unsubscribe to channels and manage user subscriptions.
- **Analytics & Dashboard:** Real-time analytics for channels, videos, and user engagement.
- **Profile Management:** Update user details, avatars, and cover images.
- **Robust Error Handling:** Centralized error and response handling for consistent API output.
- **Scalable Architecture:** Modular controllers, middleware, and models for easy maintenance and future expansion.
- **Security:** Input validation, secure cookies, and best practices for API security.
- **Logging:** Integrated request logging for monitoring and debugging.

## Tech Stack

- **Language:** Node.js (JavaScript)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Cloud Storage:** Cloudinary
- **Other:** Multer (file uploads), Morgan (logging), Joi (validation), CORS, Cookie-Parser

## System Design

View the system architecture and data model:  
[Eraser Model Workspace](https://app.eraser.io/workspace/WoERn6ttsXm9kcMNwYD5?origin=)

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/divyeshgangara2211/YouStreamPro.git
    cd YouStreamPro/Backend
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Configure environment variables:**
    - Copy `.env.example` to `.env` and fill in your configuration (MongoDB URI, JWT secrets, Cloudinary keys, etc.).

4. **Run the server:**
    ```bash
    npm start
    ```

5. **API Base URL:**  
    ```
    http://localhost:8000/api/v1/
    ```

## API Documentation

See [API Docs](./docs/api.md) for detailed endpoints and usage examples.

## Folder Structure

```
src/
  controllers/    # Route controllers for all resources
  models/         # Mongoose models
  routes/         # Express route definitions
  middlewares/    # Custom middleware (auth, multer, etc.)
  utils/          # Utility functions and helpers
  db/             # Database connection logic
  constants.js    # Project constants
  app.js          # Express app setup
  index.js        # Entry point
public/           # Static files and uploads
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or new features.

## License

[MIT](./LICENSE)