const { sequelize, Admin, Teacher, Student, Course, Timetable } = require('../models');

const teachersData = [
    { name: 'Dr. Sarah Wilson', email: 'teacher1@school.test', password: 'Teacher@123', department: 'Computer Science', designation: 'Associate Professor' },
    { name: 'Prof. Michael Chen', email: 'teacher2@school.test', password: 'Teacher@123', department: 'Mathematics', designation: 'Professor' },
    { name: 'Dr. Emma Rodriguez', email: 'teacher3@school.test', password: 'Teacher@123', department: 'Physics', designation: 'Associate Professor' },
    { name: 'Dr. David Kim', email: 'teacher4@school.test', password: 'Teacher@123', department: 'Chemistry', designation: 'Assistant Professor' },
    { name: 'Dr. Lisa Johnson', email: 'teacher5@school.test', password: 'Teacher@123', department: 'English', designation: 'Associate Professor' },
    { name: 'Prof. James Martinez', email: 'teacher6@school.test', password: 'Teacher@123', department: 'Computer Science', designation: 'Professor' },
    { name: 'Dr. Anna Patel', email: 'teacher7@school.test', password: 'Teacher@123', department: 'Mathematics', designation: 'Assistant Professor' },
    { name: 'Dr. Robert Lee', email: 'teacher8@school.test', password: 'Teacher@123', department: 'Physics', designation: 'Associate Professor' },
    { name: 'Dr. Maria Garcia', email: 'teacher9@school.test', password: 'Teacher@123', department: 'Chemistry', designation: 'Assistant Professor' },
    { name: 'Prof. Thomas Anderson', email: 'teacher10@school.test', password: 'Teacher@123', department: 'English', designation: 'Professor' }
];

async function seed() {
    try {
        console.log('🌱 Starting database seeder...\n');

        // Drop all tables and recreate
        await sequelize.sync({ force: true });
        console.log('✅ Tables reset\n');

        // 1. Create Admin
        console.log('📝 Creating admin...');
        await Admin.create({
            name: 'System Administrator',
            email: 'admin@school.test',
            password: 'Admin@12345'
        });
        console.log('✅ Admin created: admin@school.test / Admin@12345\n');

        // 2. Create Teachers
        console.log('👨‍🏫 Creating 10 teachers...');
        const teachers = await Teacher.bulkCreate(teachersData);
        console.log('✅ Teachers created: teacher1@school.test to teacher10@school.test\n   Password: Teacher@123\n');

        // 3. Create Students
        console.log('👩‍🎓 Creating 250 students...');
        const studentsData = [];
        const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English'];
        const names = [
            'Ahmed', 'Fatima', 'Ali', 'Zainab', 'Hassan', 'Mariam', 'Omar', 'Ayesha', 'Hamza', 'Sara',
            'Ibrahim', 'Hira', 'Bilal', 'Amna', 'Usman', 'Noor', 'Faisal', 'Zara', 'Tariq', 'Maha'
        ];

        for (let i = 1; i <= 250; i++) {
            const deptIndex = Math.floor((i - 1) / 50);
            const dept = departments[deptIndex];
            const nameIndex = (i - 1) % names.length;
            const rollPrefix = dept === 'Computer Science' ? 'CS' :
                dept === 'Mathematics' ? 'MATH' :
                    dept === 'Physics' ? 'PHY' :
                        dept === 'Chemistry' ? 'CHEM' : 'ENG';
            const rollNumber = `${rollPrefix}${String(((i - 1) % 50) + 1).padStart(3, '0')}`;

            studentsData.push({
                name: `${names[nameIndex]} Student${i}`,
                email: `student${i}@school.test`,
                password: 'Student@123',
                roll_number: rollNumber,
                semester: 'Fall 2025',
                department: dept
            });
        }

        await Student.bulkCreate(studentsData);
        console.log('✅ Students created: student1@school.test to student250@school.test\n   Password: Student@123\n');

        // 4. Create Courses
        console.log('📚 Creating 8 courses...');
        const courses = await Course.bulkCreate([
            { course_code: 'CS101', course_title: 'Introduction to Programming', credit_hours: 3, teacher_id: teachers[0].id, description: 'Fundamentals of programming using Python' },
            { course_code: 'CS201', course_title: 'Data Structures & Algorithms', credit_hours: 4, teacher_id: teachers[5].id, description: 'Advanced data structures and algorithmic techniques' },
            { course_code: 'MATH201', course_title: 'Calculus II', credit_hours: 3, teacher_id: teachers[1].id, description: 'Integral calculus and differential equations' },
            { course_code: 'MATH301', course_title: 'Linear Algebra', credit_hours: 3, teacher_id: teachers[6].id, description: 'Vector spaces, matrices, and linear transformations' },
            { course_code: 'PHY301', course_title: 'Quantum Mechanics', credit_hours: 4, teacher_id: teachers[2].id, description: 'Introduction to quantum physics and applications' },
            { course_code: 'CHEM102', course_title: 'Organic Chemistry', credit_hours: 3, teacher_id: teachers[3].id, description: 'Structure and reactivity of organic compounds' },
            { course_code: 'ENG201', course_title: 'English Literature', credit_hours: 3, teacher_id: teachers[4].id, description: 'Analysis of classic and modern literature' },
            { course_code: 'CS301', course_title: 'Database Systems', credit_hours: 4, teacher_id: teachers[0].id, description: 'Database design, SQL, and management systems' }
        ]);
        console.log('✅ Courses created\n');

        // 5. Create Timetable
        console.log('📅 Creating timetable...');
        await Timetable.bulkCreate([
            { course_id: courses[0].id, teacher_id: teachers[0].id, day_of_week: 'Monday', time_from: '08:00:00', time_to: '09:30:00', room_number: 'A-101' },
            { course_id: courses[0].id, teacher_id: teachers[0].id, day_of_week: 'Wednesday', time_from: '08:00:00', time_to: '09:30:00', room_number: 'A-101' },
            { course_id: courses[1].id, teacher_id: teachers[5].id, day_of_week: 'Monday', time_from: '10:00:00', time_to: '11:30:00', room_number: 'A-102' },
            { course_id: courses[1].id, teacher_id: teachers[5].id, day_of_week: 'Wednesday', time_from: '10:00:00', time_to: '11:30:00', room_number: 'A-102' },
            { course_id: courses[2].id, teacher_id: teachers[1].id, day_of_week: 'Tuesday', time_from: '08:00:00', time_to: '09:30:00', room_number: 'B-201' },
            { course_id: courses[2].id, teacher_id: teachers[1].id, day_of_week: 'Thursday', time_from: '08:00:00', time_to: '09:30:00', room_number: 'B-201' }
        ]);
        console.log('✅ Timetable created\n');

        console.log('═══════════════════════════════════════');
        console.log('✅ Database seeding completed!');
        console.log('═══════════════════════════════════════');
        console.log('\n📊 Summary:');
        console.log('  - 1 Admin');
        console.log('  - 10 Teachers');
        console.log('  - 250 Students');
        console.log('  - 8 Courses');
        console.log('  - Timetable entries');
        console.log('\n🔑 Login Credentials:');
        console.log('  Admin:   admin@school.test / Admin@12345');
        console.log('  Teacher: teacher1@school.test / Teacher@123');
        console.log('  Student: student1@school.test / Student@123');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
