// ========================================
// Student Results - Backend Integrated
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
    new ResultsController();
});

class ResultsController {
    constructor() {
        this.currentStudent = API.getCurrentUser();
        this.selectedCourse = null;
        this.resultsData = null;
        this.init();
    }

    init() {
        this.setupSidebar();
        if (this.currentStudent) {
            this.updateProfile();
            this.loadResultsData();
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

    async loadResultsData() {
        try {
            const data = await API.getStudentResults(this.currentStudent.id);
            this.resultsData = data;

            // Update overall stats
            this.updateOverallStats(data);

            // Render course list
            this.renderCourseList(data.results || []);

            // Load notifications
            this.loadNotifications(data.results || []);

        } catch (error) {
            console.error('Failed to load results:', error);
            showToast('Failed to load results', 'error');
        }
    }

    updateOverallStats(data) {
        const cgpaEl = document.getElementById('currentCGPA');
        const percentageEl = document.getElementById('overallPercentage');
        const completedEl = document.getElementById('coursesCompleted');

        if (cgpaEl) cgpaEl.textContent = data.cgpa !== undefined ? data.cgpa.toFixed(2) : '0.00';
        // Calculate average percentage if not provided
        let avgPercentage = 0;
        if (data.results && data.results.length > 0) {
            const total = data.results.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
            avgPercentage = Math.round(total / data.results.length);
        }
        if (percentageEl) percentageEl.textContent = `${avgPercentage}%`;
        if (completedEl) completedEl.textContent = data.results ? data.results.length : 0;

        const changeEl = document.getElementById('percentageChange');
        if (changeEl) {
            changeEl.textContent = 'Great work!';
            changeEl.classList.add('positive');
        }
    }

    renderCourseList(results) {
        const container = document.getElementById('resultsCoursesList');
        if (!container) return;

        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No results published yet</p>
                </div>
            `;
            return;
        }

        results.forEach((result, index) => {
            const gradeLetter = result.grade ? result.grade.charAt(0) : 'N';

            const courseItem = document.createElement('div');
            courseItem.className = `result-course-item ${index === 0 ? 'active' : ''}`;
            courseItem.dataset.courseId = result.course_id || result.Course?.id; // Handle both structures
            courseItem.innerHTML = `
                <div class="result-course-header">
                    <span class="result-course-name">${result.course_title || result.Course?.course_title || result.course?.course_title || 'Unknown Course'}</span>
                    <span class="result-course-grade ${gradeLetter}">${result.grade}</span>
                </div>
                <div class="result-course-footer">
                    <span>${result.course_code || result.Course?.course_code || result.course?.course_code || 'N/A'}</span>
                    <span>${result.percentage}%</span>
                </div>
            `;

            courseItem.addEventListener('click', () => this.selectCourse(result));
            container.appendChild(courseItem);
        });

        // Auto-select first course
        if (results.length > 0) {
            this.selectCourse(results[0]);
        }
    }

    selectCourse(result) {
        this.selectedCourse = result;

        // Update active state
        const courseId = result.course_id || result.Course?.id;
        document.querySelectorAll('.result-course-item').forEach(item => {
            item.classList.toggle('active', item.dataset.courseId == courseId);
        });

        // Render course details
        this.renderCourseDetails(result);
    }

    renderCourseDetails(result) {
        const nameEl = document.getElementById('resultsCourseName');
        const codeEl = document.getElementById('resultsCourseCode');
        const totalMarksEl = document.getElementById('totalMarks');
        const percentageEl = document.getElementById('coursePercentage');
        const gradeEl = document.getElementById('courseGrade');
        const gpaEl = document.getElementById('courseGPA');

        if (nameEl) nameEl.textContent = result.course_title || result.Course?.course_title;
        if (codeEl) codeEl.textContent = `Course Code: ${result.course_code || result.Course?.course_code || 'N/A'}`;
        if (totalMarksEl) totalMarksEl.textContent = `${result.marks_obtained || 0}/${result.total_marks || 100}`;
        if (percentageEl) percentageEl.textContent = `${result.percentage}%`;
        if (gradeEl) gradeEl.textContent = result.grade;
        if (gpaEl) gpaEl.textContent = result.gpa !== undefined ? result.gpa.toFixed(2) : 'N/A';

        // Render assessment breakdown
        this.renderAssessmentTable(result);
    }

    renderAssessmentTable(result) {
        const tbody = document.getElementById('assessmentTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // If backend provides breakdown, use it. Otherwise show summary as single row.
        // Assuming result object might have 'assessments' array later.
        // For now, we'll just show the main result as the "Final Grade"

        const percentage = parseFloat(result.percentage) || 0;
        const percentageClass = percentage >= 85 ? 'high' : percentage >= 70 ? 'medium' : 'low';
        const gradeLetter = result.grade ? result.grade.charAt(0) : 'N';
        const date = new Date(result.updatedAt || new Date()).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="assessment-name">${result.exam_type || 'Final Grade'}</td>
            <td class="assessment-date">${date}</td>
            <td>${result.marks_obtained || '-'}</td>
            <td>${result.total_marks || 100}</td>
            <td>
                <div class="percentage-bar-cell">
                    <div class="percentage-bar">
                        <div class="percentage-fill ${percentageClass}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="percentage-text">${percentage}%</span>
                </div>
            </td>
            <td><span class="grade-badge-sm ${gradeLetter}">${result.grade}</span></td>
        `;
        tbody.appendChild(row);

        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td></td>
            <td><strong>${result.marks_obtained || '-'}</strong></td>
            <td><strong>${result.total_marks || 100}</strong></td>
            <td><strong>${result.percentage}%</strong></td>
            <td><strong>${result.grade}</strong></td>
        `;
        tbody.appendChild(totalRow);
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
        const downloadBtn = document.getElementById('downloadResultsBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReport());
        }
    }

    downloadReport() {
        if (!this.selectedCourse) {
            showToast('Please select a course first', 'warning');
            return;
        }

        const result = this.selectedCourse;
        const courseTitle = result.course_title || result.Course?.course_title;
        const courseCode = result.course_code || result.Course?.course_code;

        let reportContent = `ACADEMIC RESULTS REPORT\n`;
        reportContent += `=======================\n\n`;
        reportContent += `Student: ${this.currentStudent.name}\n`;
        reportContent += `Course: ${courseTitle}\n`;
        reportContent += `Course Code: ${courseCode || 'N/A'}\n`;
        reportContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
        reportContent += `PERFORMANCE SUMMARY\n`;
        reportContent += `------------------\n`;
        reportContent += `Marks: ${result.marks_obtained}/${result.total_marks}\n`;
        reportContent += `Percentage: ${result.percentage}%\n`;
        reportContent += `Grade: ${result.grade}\n`;
        reportContent += `GPA: ${result.gpa}\n`;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Result_Report_${courseTitle.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Report downloaded successfully!', 'success');
    }

    loadNotifications(results) {
        const notifications = [];
        // Simple logic for notifications
        if (results.some(r => r.grade === 'A' || r.grade === 'A+')) {
            notifications.push({ text: 'Excellent performance in recent exams!', time: 'Recent', type: 'info' });
        }
        if (results.some(r => r.grade === 'F')) {
            notifications.push({ text: 'Warning: Failed grade detected', time: 'Recent', type: 'urgent' });
        }

        if (notifications.length === 0) {
            notifications.push({ text: 'No new notifications', time: 'Just now', type: 'info' });
        }

        const badge = document.getElementById('notificationCount');
        if (badge) badge.textContent = notifications.length;

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
let resultsController;
document.addEventListener('DOMContentLoaded', () => {
    resultsController = new ResultsController();
});