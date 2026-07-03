# 🎓 Student Attendance & Result Portal

A full-stack web application for educational institutions with three dedicated portals — **Admin**, **Teacher**, and **Student** — powered by a Node.js/Express REST API with real-time WebSocket updates.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange.svg)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black.svg)](https://socket.io/)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

---

## Overview

The Student Attendance & Result Portal is designed to simplify academic record management. It provides role-based access for three user types, each with a dedicated dashboard and set of workflows.

- **Admins** control the full system — users, courses, reports, and settings.
- **Teachers** mark attendance in bulk and publish student results.
- **Students** monitor their own attendance percentages and academic results in real time.

All data flows through a REST API with JWT authentication. Socket.IO keeps every portal updated instantly without page refreshes.

---

## Features

### 👨‍💼 Admin Portal
- Dashboard with real-time statistics (students, teachers, courses, attendance trends)
- Full user management — create, edit, and delete students and teachers
- Course management with teacher assignment
- Attendance and result reports with PDF export
- System settings for academic year, semester, and attendance thresholds
- Low attendance alerts

### 👨‍🏫 Teacher Portal
- Bulk attendance marking with configurable session types (Lecture, Lab, etc.)
- Attendance history with date and course filters
- Batch result uploads for any assessment type (Midterm, Final, Quiz, Assignment)
- Per-student performance analytics
- Real-time notifications on system events

### 👨‍🎓 Student Portal
- Personal dashboard showing CGPA, overall attendance, and recent results
- Course-wise attendance with visual progress bars
- Full results view with grades and percentage breakdowns
- Real-time notifications for new attendance records and published results
- Profile and settings management

### System-wide
- JWT-based authentication with role separation
- Real-time updates via Socket.IO (attendance marked, results published, users added)
- PDF report generation (jsPDF + AutoTable)
- Responsive, mobile-friendly UI
- Centralized error handling and input validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Icons | Font Awesome |
| PDF Export | jsPDF, jsPDF-AutoTable |
| Real-time | Socket.IO Client |
| Backend | Node.js (v14+), Express.js |
| ORM | Sequelize |
| Database | MySQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| WebSocket | Socket.IO |
| Logging | Morgan |
| Validation | express-validator |

---

## Project Structure

```
student-attendance-result-portal/
│
├── index.html                     # Landing / role selection page
├── RoleSelection.css
├── RoleSelection.js
├── api-service.js                 # Shared frontend API client
├── style.css
├── START_BACKEND.bat              # Quick-start script (Windows)
│
├── Login/                         # Login pages for each role
│   ├── admin-login.html
│   ├── teacher-login.html
│   ├── student-login.html
│   └── login-script.js
│
├── Admin/                         # Admin portal
│   ├── admin-dashboard.html
│   ├── admin-users.html
│   ├── admin-courses.html
│   ├── admin-reports.html
│   ├── admin-settings.html
│   └── admin-styles.css
│
├── Teacher/                       # Teacher portal
│   ├── teacher-dashboard.html
│   ├── teacher-mark-attendance.html
│   ├── teacher-attendance-history.html
│   ├── teacher-upload-results.html
│   ├── teacher-settings.html
│   └── teacher-styles.css
│
├── Student/                       # Student portal
│   ├── student-dashboard.html
│   ├── student-attendance.html
│   ├── student-results.html
│   ├── student-notifications.html
│   ├── student-settings.html
│   └── student-styles.css
│
├── database/
│   └── student_portal.sql         # Standalone SQL schema (optional)
│
└── backend/                       # Node.js REST API
    ├── server.js                  # Entry point
    ├── package.json
    ├── config/
    │   └── db.js                  # Sequelize DB connection
    ├── controllers/               # Business logic per resource
    ├── models/                    # Sequelize models
    ├── routes/                    # Express route definitions
    ├── middleware/
    │   ├── auth.js                # JWT verification
    │   ├── errorHandler.js        # Global error handler
    │   └── validate.js            # Input validation
    ├── scripts/
    │   └── migrate.js             # Table creation
    └── seeders/
        └── seed.js                # Sample data population
```

---

## Prerequisites

Make sure you have these installed before continuing:

- [Node.js](https://nodejs.org/) v14+
- [MySQL](https://dev.mysql.com/downloads/) or [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (recommended for frontend) or any static server

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/student-attendance-result-portal.git
cd student-attendance-result-portal
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create the database

Open MySQL and create the database:

```sql
CREATE DATABASE student_portal;
```

### 4. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_SERVER=localhost
DB_NAME=student_portal
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# CORS — must match where you serve the frontend
CORS_ORIGIN=http://127.0.0.1:5500
```

### 5. Run migrations and seed data

```bash
npm run migrate   # Creates all tables
npm run seed      # Populates with sample users and courses
```

### 6. Start the backend server

```bash
npm start          # Production
# or
npm run dev        # Development with auto-reload (nodemon)
```

Server runs at `http://localhost:5000`. You can verify with:

```
GET http://localhost:5000/health
```

### 7. Open the frontend

- Open `index.html` with **VS Code Live Server** (right-click → "Open with Live Server")
- Or use Python: `python -m http.server 5500` from the project root
- Navigate to `http://127.0.0.1:5500`

> **Windows shortcut:** Double-click `START_BACKEND.bat` to start the backend automatically.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API server listens on | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DB_SERVER` | MySQL host | `localhost` |
| `DB_NAME` | Database name | `student_portal` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `yourpassword` |
| `DB_PORT` | MySQL port | `3306` |
| `JWT_SECRET` | Secret key for signing tokens | `change-me-in-prod` |
| `JWT_EXPIRE` | Token expiry duration | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://127.0.0.1:5500` |

---

## Default Credentials

These are created by the seeder. **Change them immediately in any real deployment.**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.test` | `Admin@123` |
| Teacher | `teacher1@school.test` | `Teacher@123` |
| Student | `student1@school.test` | `Student@123` |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <jwt_token>
```

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users (supports `?role=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/users/:id` | Get a single user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Courses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create a course |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |

### Attendance

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/attendance` | Mark bulk attendance |
| GET | `/api/attendance` | Get records (`?course_id=`, `?date=`, `?student_id=`) |
| GET | `/api/attendance/report/:student_id` | Per-student report |
| GET | `/api/attendance/monthly-stats` | Monthly summary |

### Results

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/results/assessments` | Upload batch results |
| GET | `/api/results/student/:student_id` | Student results + CGPA |
| GET | `/api/results/course/:course_id` | Course-wide results |

### Enrollments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/enrollments/student/:student_id` | Student's enrolled courses |
| POST | `/api/enrollments` | Enroll a student |
| DELETE | `/api/enrollments/:id` | Remove enrollment |

For full request/response examples, see [`backend/README.md`](backend/README.md).

---

## Database Schema

The backend uses Sequelize to manage these tables:

| Table | Description |
|---|---|
| `Admins` | Admin accounts |
| `Teachers` | Teacher accounts with department info |
| `Students` | Student accounts with roll number |
| `Courses` | Course catalog with teacher assignments |
| `Enrollments` | Student ↔ Course relationships |
| `Attendance` | Daily per-student attendance records |
| `Results` | Assessment marks with auto-calculated grade/percentage |
| `Notifications` | System notifications per user |
| `Timetable` | Class schedule information |

> **Two schema options exist.** The backend Sequelize schema (above) is the recommended one — it's what the frontend expects. The standalone `database/student_portal.sql` file is provided only for quick MySQL testing without the Node.js backend.

---

## Troubleshooting

**Backend won't start**
- Check that MySQL is running and your `.env` credentials are correct.
- Ensure the `student_portal` database exists before running migrations.

**Frontend shows "Cannot connect to server"**
- Confirm the backend is running on port `5000`.
- Check that `CORS_ORIGIN` in `.env` matches the URL your frontend is served from (usually `http://127.0.0.1:5500`).

**Real-time updates not working**
- Open browser DevTools → Network tab → filter by WS to check for WebSocket connections.
- Verify your firewall isn't blocking WebSocket traffic.

**Seeded data not appearing**
- Make sure you ran `npm run migrate` before `npm run seed`.
- Check the terminal output — any constraint violations will be logged.

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request

Please keep PRs focused and describe what was changed and why.

---

## Authors

**M. Abdullah & Junaid Haider**

---

## License

This project is licensed under the [MIT License](LICENSE).

---

> ⭐ If this project helped you, consider giving it a star on GitHub!
