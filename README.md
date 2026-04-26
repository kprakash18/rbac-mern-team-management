# Team Management System

A full-stack team management app with JWT authentication, team and role management, permission checks, and task handling.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Frontend: React, Vite, React Router, Axios

## Project Structure

- [backend](backend) - Express API server
- [frontend](frontend) - React client

## Features

- Email-based JWT login
- Protected frontend routes
- User, team, role, and permission management
- Team membership and role assignment
- Permission-aware task actions

## Requirements

- Node.js 18+ recommended
- MongoDB connection string

## Environment Variables

Create a `.env` file in [backend](backend) with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Install

Install dependencies in each app folder:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run The Apps

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Backend runs on `http://localhost:3000` and the frontend Vite server runs on the default port shown in the terminal.

## API Overview

Base URL: `http://localhost:3000/api`

### Auth

- `POST /auth/login`

### Users

- `GET /users`
- `POST /users`

### Teams

- `GET /teams`
- `POST /teams`
- `PUT /teams/:teamId`
- `DELETE /teams/:teamId`

### Roles

- `GET /roles`
- `POST /roles`

### Permissions

- `GET /permissions`
- `POST /permissions`

### Team Membership and Roles

- `GET /teammemberrole`
- `POST /teammemberrole/add`
- `PUT /teammemberrole/role`
- `DELETE /teammemberrole/remove`

### Permission Service

- `GET /permission-service?userId=...&teamId=...`

### Tasks

- `GET /tasks?teamId=...`
- `POST /tasks`
- `DELETE /tasks/:id`

## Notes

- The frontend stores the JWT in local storage and sends it automatically with Axios requests.
- The app expects MongoDB to be running and reachable through `MONGO_URI`.
- There is no custom test suite in the current backend setup.