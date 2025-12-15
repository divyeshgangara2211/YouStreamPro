# 🎬 YouTube + Twitter Backend

YouStreamPro Backend is the core server-side engine for a powerful and scalable video streaming platform, inspired by YouTube. Designed with modularity, performance, and security in mind, this backend system handles everything from user management to video uploads, playlists, subscriptions, analytics, and even micro-social features like tweets and comments.

Built using **Node.js**, **Express.js**, and **MongoDB**, it provides a robust RESTful API layer that connects seamlessly with the frontend, supports cloud storage (Cloudinary), and implements industry-standard best practices for authentication, validation, and error handling.

---

## 📌 Project Highlights

### 🔐 User Management
- Secure **JWT-based authentication**
- User registration, login, logout
- Password reset with token-based email verification
- Profile management: update avatar, cover image, bio, etc.
- Watch history: tracks watched videos per user

### 📹 Video Management
- Upload and publish videos (stored in **Cloudinary**)
- Edit or delete uploaded videos
- Visibility control (publish/unpublish videos)
- Advanced search, filtering, and pagination
- Video streaming optimized with metadata

### 🐦 Tweet Management *(Mini Social Feature)*
- Create, update, delete tweets
- View tweets by specific users
- Enables short updates or content promotion by users

### 📺 Playlist Management
- Create custom playlists
- Add or remove videos
- View all playlists created by the user

### 🔔 Subscription System
- Subscribe or unsubscribe to channels
- View list of subscribers and subscribed channels

### ❤️ Like System
- Like or unlike videos, tweets, and comments
- Fetch all liked videos for a user

### 💬 Comments
- Add comments to videos
- Edit and delete existing comments
- Like comments for community engagement

### 📊 Dashboard & Analytics
- Real-time channel statistics
  - Total videos
  - Total views
  - Total likes
  - Total subscribers
- Access uploaded video overview for channel owners

### 🩺 Health Check Endpoint
- `/health` route to verify server uptime and API status

---

## 🧪 Tech Stack

| Layer         | Technology                       |
|---------------|----------------------------------|
| Language      | Node.js (JavaScript)             |
| Framework     | Express.js                       |
| Database      | MongoDB with Mongoose ODM        |
| Authentication| JWT + Secure Cookies             |
| Cloud Storage | Cloudinary (for video/images)    |
| Validation    | Joi                              |
| File Uploads  | Multer                           |
| Logging       | Morgan                           |
| Middleware    | Custom error/auth handlers       |

---

## 📁 Project Structure

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
   - Create a `.env` file in the root directory.
   - Add your Appwrite credentials:
     ```
        MONGO_URI=
        JWT_SECRET=
        COOKIE_SECRET=
        CLOUDINARY_CLOUD_NAME=
        CLOUDINARY_API_KEY=
        CLOUDINARY_API_SECRET=
     ```

4. **Start Development Server:**
    ```bash
    npm start
    ```

5. **API Base URL:**  
    ```
    http://localhost:8000/api/v1/
    ```


## 📚 API Documentation

Full API details with routes and sample requests can be found here:  
📄 [Postman API Docs](https://documenter.getpostman.com/view/46277832/2sB3dTt8ah)

### Includes Endpoints For:
- 🔐 **User Authentication**
- 🎥 **Video Upload & Management**
- 🐦 **Tweets**
- 📂 **Playlists**
- 👍 **Likes & Comments**
- 🔔 **Subscriptions**
- 📊 **Dashboard Analytics**

---

## 📬 Contact

For questions, feedback, or collaboration inquiries:  
📧 **Email:** [divyeshgangera22@gmail.com](mailto:divyeshgangera22@gmail.com)  
💻 **GitHub:** [github.com/divyeshgangera2211](https://github.com/divyeshgangara2211)

---

## 🤝 Contributing

Contributions, issue reports, and feature requests are welcome!  
Feel free to **fork the project**, create a **feature branch**, and submit a **pull request**.  
Let’s build better, together! 🚀


## License
Copyright (c) 2025 Divyesh Gangera