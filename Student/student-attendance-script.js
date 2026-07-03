// ========================================
// Student Attendance - Backend Integrated
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!window.API || !API.isAuthenticated()) {
        window.location.href = '../Login/student-login.html';
        return;
    }

    const user = API.getCurrentUser();
    if (user && user.role !== 'student') {
        alert('Unauthorized access');
        API.logout();
        window.location.href = '../Login/student-login.html';
        return;
    }

    // Initialize controller
    new AttendanceController();
});

class AttendanceController {
    constructor() {
        this.currentStudent = API.getCurrentUser();
        this.selectedCourse = null;
        this.attendanceData = null;
        this.init();
    }

    init() {
        this.setupSidebar();
        if (this.currentStudent) {
            this.updateProfile();
            this.loadAttendanceData();
            this.setupEventListeners();
        }
    }

    updateProfile() {
        const nameEl = document.getElementById('studentName');
        const avatarEl = document.querySelector('.user-avatar');

        if (nameEl) nameEl.textContent = this.currentStudent.name;

        if (avatarEl) {
            const initials = this.currentStudent.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatarEl.textContent = initials;
        }
    }

    async loadAttendanceData() {
        try {
            // Fetch attendance report from backend
            const report = await API.getAttendanceReport(this.currentStudent.id);
            this.attendanceData = report;

            // Calculate overall stats
            this.updateOverallStats(report);

            // Render course list
            this.renderCourseList(report.courses || []);

            // Load notifications
            this.loadNotifications(report.courses || []);

        } catch (error) {
            console.error('Failed to load attendance data:', error);
            showToast('Failed to load attendance data', 'error');
        }
    }

    updateOverallStats(report) {
        // Update UI
        const overallEl = document.getElementById('overallAttendancePercent');
        const presentEl = document.getElementById('totalPresent');
        const absentEl = document.getElementById('totalAbsent');
        const classesEl = document.getElementById('totalClasses');

        if (overallEl) overallEl.textContent = `${report.overall_percentage || 0}%`;
        if (presentEl) presentEl.textContent = report.total_present || 0;
        if (absentEl) absentEl.textContent = report.total_absent || 0;
        if (classesEl) classesEl.textContent = report.total_classes || 0;
    }

    renderCourseList(courses) {
        const container = document.getElementById('coursesList');
        if (!container) return;

        container.innerHTML = '';

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No courses enrolled</p>
                </div>
            `;
            return;
        }

        courses.forEach((course, index) => {
            const percentage = course.percentage || 0;
            const percentageClass = percentage >= 75 ? 'high' :
                percentage >= 60 ? 'medium' : 'low';

            const item = document.createElement('div');
            item.className = `course-item ${index === 0 ? 'active' : ''}`;
            item.dataset.courseId = course.course_id;
            item.innerHTML = `
                <div class="course-item-header">
                    <span class="course-item-name">${course.course_title}</span>
                    <span class="course-item-percentage ${percentageClass}">${percentage}%</span>
                </div>
                <div class="course-item-classes">${course.present}/${course.total_classes} classes</div>
            `;

            item.addEventListener('click', () => this.selectCourse(course));
            container.appendChild(item);
        });

        // Auto-select first course
        if (courses.length > 0) {
            this.selectCourse(courses[0]);
        }
    }

    selectCourse(course) {
        this.selectedCourse = course;

        // Update active state
        document.querySelectorAll('.course-item').forEach(item => {
            item.classList.toggle('active', item.dataset.courseId == course.course_id);
        });

        // Render course details
        this.renderCourseDetails();
    }

    renderCourseDetails() {
        if (!this.selectedCourse) return;

        const nameEl = document.getElementById('courseDetailsName');
        const codeEl = document.getElementById('courseDetailsCode');

        if (nameEl) nameEl.textContent = this.selectedCourse.course_title;
        if (codeEl) codeEl.textContent = `Course Code: ${this.selectedCourse.course_code || 'N/A'}`;

        const attendedEl = document.getElementById('classesAttended');
        const missedEl = document.getElementById('classesMissed');
        const rateEl = document.getElementById('attendanceRate');

        if (attendedEl) attendedEl.textContent = this.selectedCourse.present;
        if (missedEl) missedEl.textContent = this.selectedCourse.absent;
        if (rateEl) rateEl.textContent = `${this.selectedCourse.percentage}%`;

        // Render session history
        this.renderSessionHistory();
    }

    renderSessionHistory() {
        const container = document.getElementById('sessionHistoryList');
        if (!container) return;

        const sessions = this.selectedCourse.sessions || [];

        container.innerHTML = '';

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No attendance records yet</p>
                </div>
            `;
            return;
        }

        // Sort by date descending
        sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

        sessions.forEach(session => {
            const date = new Date(session.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const status = session.status.toLowerCase();

            const item = document.createElement('div');
            item.className = `session-item ${status}`;
            item.innerHTML = `
                <div class="session-item-left">
                    <div class="session-icon">
                        <i class="fas fa-${status === 'present' ? 'check' : 'times'}"></i>
                    </div>
                    <div class="session-info">
                        <h5>${session.type || 'Class Session'}</h5>
                        <div class="session-date">${date}</div>
                    </div>
                </div>
                <span class="session-badge ${status}">${status}</span>
            `;

            container.appendChild(item);
        });
    }

    setupSidebar() {
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
                    window.location.href = '../Login/student-login.html';
                }
            });
        }

        // Notification Dropdown Logic
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

    setupEventListeners() {
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReport());
        }
    }

    downloadReport() {
        if (!this.selectedCourse) {
            showToast('Please select a course first', 'warning');
            return;
        }

        // Create report content
        let reportContent = `ATTENDANCE REPORT\n`;
        reportContent += `=================\n\n`;
        reportContent += `Student: ${this.currentStudent.name}\n`;
        reportContent += `Course: ${this.selectedCourse.course_title}\n`;
        reportContent += `Course Code: ${this.selectedCourse.course_code || 'N/A'}\n`;
        reportContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
        reportContent += `SUMMARY\n`;
        reportContent += `-------\n`;
        reportContent += `Classes Attended: ${this.selectedCourse.present}\n`;
        reportContent += `Classes Missed: ${this.selectedCourse.absent}\n`;
        reportContent += `Total Classes: ${this.selectedCourse.total_classes}\n`;
        reportContent += `Attendance Rate: ${this.selectedCourse.percentage}%\n\n`;
        reportContent += `SESSION HISTORY\n`;
        reportContent += `---------------\n`;

        const sessions = this.selectedCourse.sessions || [];
        sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

        sessions.forEach(session => {
            const date = new Date(session.date).toLocaleDateString();
            const status = session.status.toUpperCase();
            reportContent += `${date} - ${session.type || 'Class Session'} - ${status}\n`;
        });

        // Create downloadable file
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_Report_${this.selectedCourse.course_title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Report downloaded successfully!', 'success');
    }

    loadNotifications(courses) {
        const notifications = [];

        courses.forEach(course => {
            if (course.percentage < 75 && course.percentage > 0) {
                notifications.push({
                    text: `Your attendance is below 75% in ${course.course_title}`,
                    time: 'Just now',
                    type: 'urgent'
                });
            }
        });

        if (notifications.length === 0) {
            notifications.push({
                text: 'Your attendance is looking good! Keep it up!',
                time: 'Just now',
                type: 'info'
            });
        }

        // Update badge
        const badge = document.getElementById('notificationCount');
        if (badge) badge.textContent = notifications.length;

        // Update dropdown
        const dropdownContainer = document.getElementById('dropdownNotifications');
        if (dropdownContainer) {
            dropdownContainer.innerHTML = notifications.map(notif => `
                <div class="dropdown-item">
                    <p>${notif.text}</p>
                    <span class="time">${notif.time}</span>
                </div>
            `).join('');
        }
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