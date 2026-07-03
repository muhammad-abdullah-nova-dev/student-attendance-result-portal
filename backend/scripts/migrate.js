const { sequelize, Admin, Teacher, Student, Course, Timetable } = require('../models');

async function runMigration() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        console.log('🔄 Creating tables...');

        // Sync all models (creates tables if they don't exist)
        await sequelize.sync({ alter: true });

        console.log('✅ All tables created successfully!');
        console.log(`
Tables created:
  - admins
  - teachers
  - students
  - courses
  - timetable

Run 'npm run seed' to populate with sample data.
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
