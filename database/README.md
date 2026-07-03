# Backend Schema vs Standalone SQL

## ⚠️ Important Note

There are **TWO database options** for this project:

### Option 1: Use Backend Sequelize (RECOMMENDED)
- **Single `users` table** with role field (admin/teacher/student)  
- Includes 7 tables with relationships
- Automated with `npm run migrate && npm run seed`
- Fully integrated with backend API

### Option 2: Use Standalone SQL (SIMPLIFIED)
- **Separate tables**: `admins`, `teachers`, `students`
- Only 5 basic tables
- Run directly in MySQL Workbench/phpMyAdmin
- Good for testing MySQL without Node.js

---

## Recommendation

**Use Option 1** (Backend Sequelize) because:
1. ✅ Backend is already configured for it
2. ✅ Frontend API calls expect this schema
3. ✅ Includes attendance, results, assessments tables
4. ✅ Properly normalized database design
5. ✅ Automatic password hashing

## How to Use Backend Sequelize

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure .env file (already done)
# Make sure DB credentials are correct

# 3. Create database (only once)
# In MySQL: CREATE DATABASE student_portal;

# 4. Run migration (creates tables)
npm run migrate

# 5. Seed data (populates with 261 users + 8 courses)
npm run seed

# 6. Start server
npm start
```

## Schema Created by Backend

### users table
- Unified table for ALL users (admins, teachers, students)
- Fields: `id`, `name`, `email`, `password_hash`, `role`, `department`, `designation`, `status`
- **role** ENUM: 'admin', 'teacher', 'student'

### Other tables
- `courses` - Course information
- `enrollments` - Student-course enrollment
- `timetable` - Class schedules  
- `attendance` - Attendance records
- `assessments` - Quiz/exam marks
- `results` - Final grades with GPA

---

## If You Already Ran the SQL File

If you ran `student_portal.sql` (with separate admins/teachers/students tables):

**Option A: Switch to Backend Schema**
```sql
DROP DATABASE student_portal;
CREATE DATABASE student_portal;
```
Then run: `npm run migrate && npm run seed`

**Option B: Keep SQL Schema (Not Recommended)**
You'd need to update ALL backend controller queries to read from separate tables. This is complex and not recommended.

---

## Summary

✅ **Use Backend Sequelize** for full integration  
⚠️ **Standalone SQL** was for quick MySQL testing only  
🎯 **They are NOT compatible** - choose one approach

**Current frontend expects**: Backend Sequelize schema (unified users table)
