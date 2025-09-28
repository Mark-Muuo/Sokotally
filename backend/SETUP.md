# Backend Setup Instructions

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sokotally?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=4000
```

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster or use an existing one
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and replace the placeholders in MONGODB_URI

## Avatar Upload Features

The backend now supports:
- Profile photo uploads via POST `/auth/profile/avatar`
- Static file serving for uploaded avatars via `/uploads/avatars/`
- Avatar field in user profile responses
- File validation (images only, 5MB max)
- Automatic file naming with user ID and timestamp

## Running the Server

```bash
npm install
npm run dev  # for development with nodemon
# or
npm start    # for production
```

The server will start on port 4000 by default.
