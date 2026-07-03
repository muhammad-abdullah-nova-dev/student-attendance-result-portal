// ========================================
// Teacher Mark Attendance - Backend Integrated
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!window.API || !API.isAuthenticated()) {
        window.location.href = '../Login/teacher-login.html';
        return;
    }

    const user = API.getCurrentUser();
    if (user && user.role !== 'teacher') {
        alert('Unauthorized access');
        API.logout();
        window.location.href = '../Login/teacher-login.html';
        return;
    }

    // Initialize controller
    new AttendanceController();
});

class AttendanceController {
    constructor() {
        this.studentAttendance = new Map(); // studentId -> 'present' | 'absent'
        this.selectedCourse = null;
        this.courses = [];
        this.students = [];
        this.init();
    }

    init() {
        this.setupSidebar();
        this.loadData();
        this.setupEventListeners();
        this.setTodayDate();
    }

    async loadData() {
        try {
            const user = API.getCurrentUser();
            const [coursesResp, usersResp] = await Promise.all([
                API.getCourses(),
                API.getUsers()
            ]);

            // Filter courses for this teacher
            const allCourses = coursesResp.data || [];
            this.courses = allCourses.filter(c => c.teacher_id === user.id);

            // Get all students
            const allUsers = usersResp.data || [];
            this.students = allUsers.filter(u => u.role === 'student');

            this.populateCourseSelect();
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load courses or students', 'error');
        }
    }

    populateCourseSelect() {
        const courseSelect = document.getElementById('courseSelect');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">Select a course</option>' +
            this.courses.map(c => `<option value="${c.id}">${c.course_title} (${c.course_code})</option>`).join('');
    }

    setTodayDate() {
        const dateInput = document.getElementById('dateSelect');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    setupSidebar() {
        const user = API.getCurrentUser();
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl && user) {
            teacherNameEl.textContent = user.name || 'Teacher';
        }

        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    API.logout();
                    window.location.href = '../Login/teacher-login.html';
                }
            });
        }
    }

    setupEventListeners() {
        // Course selection
        document.getElementById('courseSelect')?.addEventListener('change', (e) => {
            this.handleCourseChange(e.target.value);
        });

        // Date selection
        document.getElementById('dateSelect')?.addEventListener('change', () => {
            if (this.selectedCourse) {
                this.loadStudents();
            }
        });

        // Mark All buttons
        document.getElementById('markAllPresentBtn')?.addEventListener('click', () => {
            this.markAllAs('present');
        });

        document.getElementById('markAllAbsentBtn')?.addEventListener('click', () => {
            this.markAllAs('absent');
        });

        // Save and Cancel buttons
        document.getElementById('saveAttendanceBtn')?.addEventListener('click', () => {
            this.saveAttendance();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.resetAttendance();
        });

        // Notification Dropdown
        const notifIcon = document.querySelector('.notification-icon');
        const notifDropdown = document.getElementById('notificationDropdown');

        if (notifIcon && notifDropdown) {
            notifIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target) && !notifIcon.contains(e.target)) {
                    notifDropdown.classList.remove('show');
                }
            });
        }
    }

    handleCourseChange(courseId) {
        if (!courseId) {
            this.selectedCourse = null;
            this.showEmptyState();
            return;
        }

        this.selectedCourse = this.courses.find(c => c.id == courseId);

        if (this.selectedCourse) {
            this.loadStudents();
        }
    }

    loadStudents() {
        if (this.students.length === 0) {
            showToast('No students found in the system', 'warning');
            return;
        }

        // Initialize all students as present by default
        this.studentAttendance.clear();
        this.students.forEach(student => {
            this.studentAttendance.set(student.id, 'present');
        });

        this.renderStudentList();
        this.updateStats();
        this.showActionButtons();
    }

    generateRollNumber(studentId, courseCode) {
        const code = courseCode || 'CS';
        const year = '2025';
        const number = String(studentId).padStart(3, '0');
        return `${code}${year}${number}`;
    }

    renderStudentList() {
        const container = document.getElementById('studentList');
        if (!container) return;

        const courseCode = this.selectedCourse?.course_code?.substring(0, 2) || 'CS';

        container.innerHTML = this.students.map(student => {
            const status = this.studentAttendance.get(student.id) || 'present';
            const rollNo = student.roll_number || this.generateRollNumber(student.id, courseCode);

            return `
                <div class="student-attendance-item ${status}" data-student-id="${student.id}">
                    <div class="student-status-icon ${status}">
                        <i class="fas ${status === 'present' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-roll">Roll No: ${rollNo}</div>
                    </div>
                    <button class="student-toggle-btn ${status === 'present' ? 'btn-mark-absent' : 'btn-mark-present'}" 
                            onclick="attendanceController.toggleStudentStatus(${student.id})">
                        ${status === 'present' ? 'Mark Absent' : 'Mark Present'}
                    </button>
                </div>
            `;
        }).join('');
    }

    toggleStudentStatus(studentId) {
        const currentStatus = this.studentAttendance.get(studentId);
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';

        this.studentAttendance.set(studentId, newStatus);

        // Update the UI for this specific student
        const studentElement = document.querySelector(`[data-student-id="${studentId}"]`);
        if (studentElement) {
            studentElement.className = `student-attendance-item ${newStatus}`;

            const icon = studentElement.querySelector('.student-status-icon');
            icon.className = `student-status-icon ${newStatus}`;
            icon.innerHTML = `<i class="fas ${newStatus === 'present' ? 'fa-check-circle' : 'fa-times-circle'}"></i>`;

            const button = studentElement.querySelector('.student-toggle-btn');
            button.className = `student-toggle-btn ${newStatus === 'present' ? 'btn-mark-absent' : 'btn-mark-present'}`;
            button.textContent = newStatus === 'present' ? 'Mark Absent' : 'Mark Present';
        }

        this.updateStats();
    }

    markAllAs(status) {
        this.studentAttendance.forEach((_, studentId) => {
            this.studentAttendance.set(studentId, status);
        });

        this.renderStudentList();
        this.updateStats();

        showToast(`All students marked as ${status}`, 'success');
    }

    updateStats() {
        const total = this.studentAttendance.size;
        let present = 0;
        let absent = 0;

        this.studentAttendance.forEach(status => {
            if (status === 'present') present++;
            else absent++;
        });

        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        document.getElementById('totalStudents').textContent = total;
        document.getElementById('presentCount').textContent = present;
        document.getElementById('absentCount').textContent = absent;
        document.getElementById('attendanceRate').textContent = `${rate}%`;
    }

    showActionButtons() {
        const actions = document.getElementById('attendanceActions');
        if (actions) {
            actions.style.display = 'flex';
        }
    }

    showEmptyState() {
        const container = document.getElementById('studentList');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Please select a course and date to view students</p>
                </div>
            `;
        }

        const actions = document.getElementById('attendanceActions');
        if (actions) {
            actions.style.display = 'none';
        }

        // Reset stats
        document.getElementById('totalStudents').textContent = '0';
        document.getElementById('presentCount').textContent = '0';
        document.getElementById('absentCount').textContent = '0';
        document.getElementById('attendanceRate').textContent = '0%';
    }

    async saveAttendance() {
        if (!this.selectedCourse) {
            showToast('Please select a course', 'error');
            return;
        }

        const date = document.getElementById('dateSelect')?.value;
        if (!date) {
            showToast('Please select a date', 'error');
            return;
        }

        const sessionType = document.getElementById('sessionType')?.value || 'Lecture';

        // Prepare attendance records for API
        const attendance_records = [];
        this.studentAttendance.forEach((status, student_id) => {
            attendance_records.push({
                student_id: student_id,
                status: status
            });
        });

        if (attendance_records.length === 0) {
            showToast('No students to mark attendance for', 'warning');
            return;
        }

        try {
            // Call real API
            const result = await API.markAttendance(
                this.selectedCourse.id,
                date,
                sessionType,
                attendance_records
            );

            console.log('✅ Attendance saved successfully:', result);
            showToast(`Attendance saved for ${attendance_records.length} students`, 'success');

            // Reset after a short delay
            setTimeout(() => {
                this.resetAttendance();
            }, 1500);
        } catch (error) {
            console.error('❌ Failed to save attendance:', error);
            showToast('Failed to save attendance: ' + error.message, 'error');
        }
    }

    resetAttendance() {
        document.getElementById('courseSelect').value = '';
        this.studentAttendance.clear();
        this.selectedCourse = null;
        this.showEmptyState();
        showToast('Attendance form reset', 'info');
    }
}

// Helper Functions
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.success}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
}

// Initialize
let attendanceController;
document.addEventListener('DOMContentLoaded', () => {
    attendanceController = new AttendanceController();
});
