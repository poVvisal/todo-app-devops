# Todo App DevOps

A full-stack todo list application with a Node.js/Express backend and React frontend.

## Project Structure

```
todo-app-devops/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── database.js        # SQLite database setup
│   ├── package.json       # Backend dependencies
│   └── todos.db           # SQLite database file (auto-generated)
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── index.js       # React entry point
│   └── package.json       # Frontend dependencies
└── README.md
```

## Features

- Create, Read, Update, Delete (CRUD) todos
- Mark todos as complete/incomplete
- Persistent storage with SQLite
- RESTful API design
- Modern React UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Backend Setup

```bash
cd backend
npm install
npm start
```

The API server will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The React app will run on `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos | Get all todos |
| GET | /api/todos/:id | Get a single todo |
| POST | /api/todos | Create a new todo |
| PUT | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: React, CSS
- **Database**: SQLite

## License

MIT
