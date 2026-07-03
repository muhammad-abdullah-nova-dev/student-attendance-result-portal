// ========================================
// Teacher Attendance History - Backend Integrated
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
    new HistoryController();
});

class HistoryController {
    constructor() {
        this.records = [];
        this.filteredRecords = [];
        this.courses = [];
        this.init();
    }

    init() {
        this.setupSidebar();
        this.loadInitialData();
        this.setupEventListeners();
    }

    async loadInitialData() {
        try {
            const user = API.getCurrentUser();
            const [coursesResp, attendanceResp] = await Promise.all([
                API.getCourses(),
                API.getAttendance({ limit: 1000 }) // Fetch all records
            ]);

            const allCourses = coursesResp.data || [];
            this.courses = allCourses.filter(c => c.teacher_id === user.id);
            this.populateCourseFilter();

            const allAttendance = attendanceResp.data || [];

            // Filter attendance for this teacher's courses ONLY
            const teacherCourseIds = this.courses.map(c => c.id);
            const teacherAttendance = allAttendance.filter(r => teacherCourseIds.includes(r.course_id));

            // Aggregate by Course + Date
            const sessionMap = new Map();

            teacherAttendance.forEach(record => {
                const key = `${record.course_id}-${record.date}`;

                if (!sessionMap.has(key)) {
                    sessionMap.set(key, {
                        id: key, // Use composite key as ID
                        date: record.date,
                        courseId: record.course_id,
                        courseName: record.course ? record.course.course_title : 'Unknown',
                        courseCode: record.course ? record.course.course_code : 'N/A',
                        sessionType: record.session_type || 'Lecture',
                        presentCount: 0,
                        absentCount: 0,
                        totalStudents: 0
                    });
                }

                const session = sessionMap.get(key);
                session.totalStudents++;
                if (record.status === 'present') {
                    session.presentCount++;
                } else {
                    session.absentCount++;
                }
            });

            this.records = Array.from(sessionMap.values())
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            this.filteredRecords = [...this.records];
            this.renderTable();
            this.updateStats();

        } catch (error) {
            console.error('Failed to load history data:', error);
            showToast('Failed to load attendance history', 'error');
        }
    }

    populateCourseFilter() {
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="all">All Courses</option>' +
                this.courses.map(c => `<option value="${c.id}">${c.course_title} (${c.course_code})</option>`).join('');
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

    setupEventListeners() {
        document.getElementById('courseFilter')?.addEventListener('change', () => this.filterRecords());
        document.getElementById('dateFilter')?.addEventListener('change', () => this.filterRecords());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportToExcel());
    }

    filterRecords() {
        const courseId = document.getElementById('courseFilter').value;
        const date = document.getElementById('dateFilter').value;

        this.filteredRecords = this.records.filter(record => {
            const matchCourse = courseId === 'all' || record.courseId.toString() === courseId;
            const matchDate = !date || record.date === date;
            return matchCourse && matchDate;
        });

        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const tbody = document.getElementById('attendanceTableBody');
        const countSpan = document.getElementById('showingCount');

        if (!tbody) return;

        tbody.innerHTML = '';
        if (countSpan) countSpan.textContent = this.filteredRecords.length;

        if (this.filteredRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px;">
                        <i class="fas fa-search" style="font-size: 24px; color: var(--text-light); margin-bottom: 10px;"></i>
                        <p style="color: var(--text-light);">No records found matching your filters</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredRecords.forEach(record => {
            const rate = Math.round((record.presentCount / record.totalStudents) * 100) || 0;
            let progressColor = 'var(--green)';
            if (rate < 75) progressColor = 'var(--orange)';
            if (rate < 50) progressColor = 'var(--red)';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.courseName} <span style="color: var(--text-light); font-size: 12px;">(${record.courseCode})</span></td>
                <td style="color: var(--green); font-weight: 600;">${record.presentCount}</td>
                <td style="color: var(--red); font-weight: 600;">${record.absentCount}</td>
                <td>
                    <div class="attendance-progress">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${rate}%; background-color: ${progressColor};"></div>
                        </div>
                        <span class="progress-text">${rate}%</span>
                    </div>
                </td>
                <td>
                    <a href="#" class="action-link" onclick="viewDetails('${record.id}')">View Details</a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateStats() {
        // Average Attendance
        let totalRate = 0;
        this.filteredRecords.forEach(r => {
            totalRate += (r.presentCount / r.totalStudents) * 100 || 0;
        });
        const avgRate = this.filteredRecords.length > 0 ? Math.round(totalRate / this.filteredRecords.length) : 0;

        const avgEl = document.getElementById('avgAttendance');
        if (avgEl) avgEl.textContent = `${avgRate}%`;

        // Classes Conducted
        const classesEl = document.getElementById('classesConducted');
        if (classesEl) classesEl.textContent = this.filteredRecords.length;

        // Low Attendance Alerts (< 75%)
        const lowCount = this.filteredRecords.filter(r => (r.presentCount / r.totalStudents) * 100 < 75).length;
        const lowEl = document.getElementById('lowAttendance');
        if (lowEl) lowEl.textContent = lowCount;
    }

    exportToExcel() {
        if (this.filteredRecords.length === 0) {
            alert('No records to export');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Course Name', 'Course Code', 'Session Type', 'Total Students', 'Present', 'Absent', 'Attendance Rate'];
        const rows = this.filteredRecords.map(r => [
            r.date,
            `"${r.courseName}"`,
            r.courseCode,
            r.sessionType,
            r.totalStudents,
            r.presentCount,
            r.absentCount,
            `${Math.round((r.presentCount / r.totalStudents) * 100)}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function viewDetails(recordId) {
    alert('Detailed view implementation coming soon!');
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
let historyController;
document.addEventListener('DOMContentLoaded', () => {
    historyController = new HistoryController();
});
