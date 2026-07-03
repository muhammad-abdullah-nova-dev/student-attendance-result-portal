# 🔧 Backend API Documentation

RESTful API backend for the Student Attendance & Result Management System built with Node.js, Express, and SQL Server.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Real-time Features](#real-time-features)
- [Error Handling](#error-handling)
- [Validation](#validation)

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js v14+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Security**: bcryptjs, helmet, cors

### Project Structure
```
backend/
├── config/
│   ├── db.js              # Database configuration
│   └── auth.js            # JWT configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User CRUD operations
│   ├── courseController.js      # Course management
│   ├── attendanceController.js  # Attendance operations
│   ├── resultController.js      # Results management
│   └── enrollmentController.js  # Enrollment operations
├── models/
│   ├── index.js           # Sequelize initialization
│   ├── Admin.js
│   ├── Teacher.js
│   ├── Student.js
│   ├── Course.js
│   ├── Attendance.js
│   ├── Result.js
│   └── Enrollment.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── courses.js
│   ├── attendance.js
│   ├── results.js
│   └── enrollments.js
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── errorHandler.js    # Global error handling
│   └── validation.js      # Input validation
├── utils/
│   └── socketManager.js   # Socket.IO event handling
├── .env.example
├── package.json
└── server.js              # Entry point
```

## 💾 Database Schema

### Tables

#### 1. Admins
```sql
CREATE TABLE Admins (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

#### 2. Teachers
```sql
CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher',
    department NVARCHAR(100),
    qualification NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

#### 3. Students
```sql
CREATE TABLE Students (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    roll_number NVARCHAR(50) UNIQUE,
    date_of_birth DATE,
    phone NVARCHAR(20),
    address NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

#### 4. Courses
```sql
CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    course_code NVARCHAR(20) UNIQUE NOT NULL,
    course_title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    credits INT DEFAULT 3,
    teacher_id INT,
    semester NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (teacher_id) REFERENCES Teachers(id) ON DELETE SET NULL
);
```

#### 5. Enrollments
```sql
CREATE TABLE Enrollments (
    id INT PRIMARY KEY IDENTITY(1,1),
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE DEFAULT CAST(GETDATE() AS DATE),
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);
```

#### 6. Attendance
```sql
CREATE TABLE Attendance (
    id INT PRIMARY KEY IDENTITY(1,1),
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent')),
    session_type VARCHAR(50) DEFAULT 'Lecture',
    marked_at DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(id) ON DELETE NO ACTION
);
```

#### 7. Results
```sql
CREATE TABLE Results (
    id INT PRIMARY KEY IDENTITY(1,1),
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    assessment_name NVARCHAR(255),
    total_marks DECIMAL(5,2) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    published_at DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(id) ON DELETE NO ACTION
);
```

### Relationships

```
Admins (1) ────────────────────────────────────────────────
                                                            │
Teachers (1) ──────── (Many) Courses                       │
    │                                                       │
    │                                                       │
    └──────────── (Many) Attendance ──────── (Many) ───────┤
    │                                                       │
    └──────────── (Many) Results ──────────── (Many) ──────┤
                                                            │
Students (1) ──────── (Many) Enrollments ──── (Many) Courses
    │                                                       │
    └──────────── (Many) Attendance ──────────────────────┤
    │                                                       │
    └──────────── (Many) Results ──────────────────────────┘
```

## ⚙️ Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_SERVER=localhost
DB_NAME=school_management
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://127.0.0.1:5500
```

### 3. Database Setup

#### Option A: Automatic (Sequelize Sync)
```bash
npm run dev
```
Sequelize will automatically create all tables on first run.

#### Option B: Manual SQL Scripts
Execute the schema creation scripts in SSMS:
```sql
-- Create database
CREATE DATABASE school_management;
GO

USE school_management;
GO

-- Execute table creation scripts
-- (Copy from the Database Schema section above)
```

### 4. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Users

#### Get All Users
```http
GET /api/users?role=student&limit=50&page=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (optional): Filter by role (student, teacher, admin)
- `search` (optional): Search by name or email
- `limit` (optional): Results per page (default: 50)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "roll_number": "CS20251001"
    }
  ],
  "pagination": {
    "total": 251,
    "page": 1,
    "pages": 6,
    "limit": 50
  }
}
```

#### Get Single User
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

### Courses

#### Get All Courses
```http
GET /api/courses?limit=100
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "course_code": "CS101",
      "course_title": "Introduction to Programming",
      "credits": 3,
      "teacher_id": 5,
      "Teacher": {
        "id": 5,
        "name": "Dr. Smith"
      }
    }
  ]
}
```

#### Create Course
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_code": "CS101",
  "course_title": "Introduction to Programming",
  "description": "Learn programming fundamentals",
  "credits": 3,
  "teacher_id": 5,
  "semester": "Fall 2025"
}
```

#### Update Course
```http
PUT /api/courses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "teacher_id": 6,
  "semester": "Spring 2026"
}
```

#### Delete Course
```http
DELETE /api/courses/:id
Authorization: Bearer <token>
```

---

### Attendance

#### Mark Attendance (Bulk)
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1,
  "date": "2025-12-03",
  "session_type": "Lecture",
  "attendance_records": [
    { "student_id": 1, "status": "present" },
    { "student_id": 2, "status": "absent" },
    { "student_id": 3, "status": "present" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked for 3 students",
  "data": {
    "course_id": 1,
    "date": "2025-12-03",
    "processed": 3,
    "results": [
      { "student_id": 1, "status": "created" },
      { "student_id": 2, "status": "created" },
      { "student_id": 3, "status": "created" }
    ]
  }
}
```

#### Get Attendance Records
```http
GET /api/attendance?course_id=1&date=2025-12-03&limit=1000
Authorization: Bearer <token>
```

**Query Parameters:**
- `course_id` (optional): Filter by course
- `date` (optional): Filter by specific date
- `student_id` (optional): Filter by student
- `status` (optional): Filter by status (present/absent)
- `limit` (optional): Results limit (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_id": 1,
      "date": "2025-12-03",
      "status": "present",
      "session_type": "Lecture",
      "student": {
        "id": 1,
        "name": "John Doe",
        "roll_number": "CS20251001"
      },
      "course": {
        "id": 1,
        "course_code": "CS101",
        "course_title": "Introduction to Programming"
      }
    }
  ]
}
```

#### Get Student Attendance Report
```http
GET /api/attendance/report/:student_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_percentage": 85,
    "total_classes": 100,
    "total_present": 85,
    "total_absent": 15,
    "courses": [
      {
        "course_id": 1,
        "course_code": "CS101",
        "course_title": "Introduction to Programming",
        "total": 20,
        "present": 18,
        "absent": 2,
        "percentage": 90
      }
    ]
  }
}
```

#### Get Monthly Statistics
```http
GET /api/attendance/monthly-stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "month": "Jan", "percentage": 85 },
    { "month": "Feb", "percentage": 88 },
    { "month": "Mar", "percentage": 82 }
  ]
}
```

---

### Results

#### Upload Assessments (Bulk)
```http
POST /api/results/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1,
  "assessment_type": "Midterm",
  "assessment_name": "Midterm Exam - Fall 2025",
  "total_marks": 100,
  "results_data": [
    { "student_id": 1, "marks_obtained": 85 },
    { "student_id": 2, "marks_obtained": 78 },
    { "student_id": 3, "marks_obtained": 92 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Results uploaded for 3 students",
  "data": {
    "course_id": 1,
    "assessment_type": "Midterm",
    "processed": 3
  }
}
```

#### Get Student Results
```http
GET /api/results/student/:student_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cgpa": 3.45,
    "total_credits": 18,
    "results": [
      {
        "id": 1,
        "assessment_type": "Midterm",
        "marks_obtained": 85,
        "total_marks": 100,
        "percentage": 85,
        "grade": "A",
        "course": {
          "course_code": "CS101",
          "course_title": "Introduction to Programming"
        }
      }
    ]
  }
}
```

#### Get Course Results
```http
GET /api/results/course/:course_id
Authorization: Bearer <token>
```

---

### Enrollments

#### Get Student Enrollments
```http
GET /api/enrollments/student/:student_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_id": 1,
      "status": "active",
      "enrollment_date": "2025-09-01",
      "course": {
        "course_code": "CS101",
        "course_title": "Introduction to Programming",
        "credits": 3
      }
    }
  ]
}
```

#### Create Enrollment
```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": 1,
  "course_id": 1
}
```

#### Delete Enrollment
```http
DELETE /api/enrollments/:id
Authorization: Bearer <token>
```

---

## 🔐 Authentication

### JWT Token Structure
```javascript
{
  "id": 1,
  "role": "student",
  "iat": 1638360000,
  "exp": 1638964800
}
```

### Protected Routes
All routes except `/api/auth/register` and `/api/auth/login` require authentication.

**Include token in request header:**
```
Authorization: Bearer <your_jwt_token>
```

### Middleware Implementation
```javascript
// In middleware/auth.js
const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid'
    });
  }
};
```

## 🔌 Real-time Features

### Socket.IO Events

#### Server Events (Emitted to clients)
```javascript
// User registration
io.emit('user:registered', {
  id: 1,
  name: 'John Doe',
  role: 'student'
});

// Attendance marked
io.to('teacher').to('admin').emit('attendance:marked', {
  course_id: 1,
  date: '2025-12-03',
  student_count: 45
});

// Results updated
io.to(`user-${student_id}`).emit('results:updated', {
  course_id: 1,
  assessment_type: 'Midterm'
});

// Course created
io.emit('course:created', {
  id: 1,
  course_title: 'New Course'
});
```

#### Client Setup
```javascript
// Frontend connection
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for events
socket.on('attendance:marked', (data) => {
  console.log('Attendance updated:', data);
  // Refresh UI
});
```

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Global Error Handler
```javascript
// In middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Server Error';

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};
```

## ✅ Validation

### Input Validation Example
```javascript
// In controllers
const { body, validationResult } = require('express-validator');

exports.createCourse = [
  body('course_code').notEmpty().trim(),
  body('course_title').notEmpty().trim(),
  body('credits').isInt({ min: 1, max: 6 }),
  
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    // Process request...
  }
];
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual API Testing with cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test@123","role":"student"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123","role":"student"}'
```

**Get Users (with token):**
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 License

This backend API is part of the Student Attendance & Result Management System.
Licensed under the MIT License.

---

**For questions or issues, please create an issue in the main repository.**
