// ========================================
// Teacher Upload Results - Backend Integrated
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
    new ResultsController();
});

class ResultsController {
    constructor() {
        this.courses = [];
        this.students = [];
        this.results = []; // Mock results
        this.init();
    }

    init() {
        this.setupSidebar();
        this.loadData();
        this.setupEventListeners();
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

            this.populateCourseFilters();

        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load courses or students', 'error');
        }
    }

    populateCourseFilters() {
        const courseFilter = document.getElementById('courseFilter');
        const modalCourseSelect = document.getElementById('modalCourseSelect');

        const options = this.courses.map(c => `<option value="${c.id}">${c.course_title} (${c.course_code})</option>`).join('');

        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">Select a course</option>' + options;
        }

        if (modalCourseSelect) {
            modalCourseSelect.innerHTML = '<option value="">Select a course</option>' + options;
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
        // Filter changes
        document.getElementById('courseFilter')?.addEventListener('change', () => this.loadResults());
        document.getElementById('examTypeFilter')?.addEventListener('change', () => this.loadResults());

        // Modal interactions
        const modal = document.getElementById('uploadModal');
        const openBtn = document.getElementById('openUploadModalBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelUploadBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                modal.classList.add('show');
                this.resetModal();
            });
        }

        const closeModal = () => modal.classList.remove('show');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Modal Course Change
        document.getElementById('modalCourseSelect')?.addEventListener('change', (e) => {
            this.generateStudentInputs(e.target.value);
        });

        // Save Results
        document.getElementById('saveResultsBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveResults();
        });
    }

    loadResults() {
        const courseId = document.getElementById('courseFilter').value;
        const examType = document.getElementById('examTypeFilter').value;
        const tbody = document.getElementById('resultsTableBody');
        const footer = document.getElementById('tableFooter');

        if (!courseId) {
            tbody.innerHTML = '';
            footer.style.display = 'block';
            footer.textContent = 'Please select a course to view results';
            return;
        }

        // Mock results for now
        const filteredResults = this.results.filter(r => r.courseId == courseId && r.examType === examType);

        if (filteredResults.length === 0) {
            tbody.innerHTML = '';
            footer.style.display = 'block';
            footer.textContent = 'No results found for this selection';
            return;
        }

        footer.style.display = 'none';
        tbody.innerHTML = filteredResults.map(r => {
            let gradeColor = 'var(--text-dark)';
            if (r.grade === 'A' || r.grade === 'A+') gradeColor = 'var(--green)';
            if (r.grade === 'F') gradeColor = 'var(--red)';

            return `
                <tr>
                    <td>${r.rollNo}</td>
                    <td>${r.studentName}</td>
                    <td>${r.marksObtained}</td>
                    <td>${r.totalMarks}</td>
                    <td>${r.percentage}%</td>
                    <td style="color: ${gradeColor}; font-weight: 600;">${r.grade}</td>
                    <td>
                        <button class="btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    generateStudentInputs(courseId) {
        const container = document.getElementById('studentMarksEntry');
        if (!courseId) {
            container.innerHTML = '<div class="empty-state-small"><p>Select a course to enter marks for students</p></div>';
            return;
        }

        if (this.students.length === 0) {
            container.innerHTML = '<div class="empty-state-small"><p>No students found</p></div>';
            return;
        }

        container.innerHTML = this.students.map(student => `
            <div class="student-mark-row" data-student-id="${student.id}">
                <div class="student-info-small">
                    <span class="name">${student.name}</span>
                    <span class="roll">ID: ${student.id}</span>
                </div>
                <input type="number" class="form-input mark-input" placeholder="Marks" min="0" required>
            </div>
        `).join('');
    }

    calculateGrade(percentage) {
        if (percentage >= 90) return 'A+';
        if (percentage >= 85) return 'A';
        if (percentage >= 80) return 'A-';
        if (percentage >= 75) return 'B+';
        if (percentage >= 70) return 'B';
        if (percentage >= 65) return 'B-';
        if (percentage >= 60) return 'C+';
        if (percentage >= 55) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    async saveResults() {
        const courseSelect = document.getElementById('modalCourseSelect');
        const examTypeSelect = document.getElementById('modalExamType');
        const totalMarksInput = document.getElementById('modalTotalMarks');

        if (!courseSelect.value || !totalMarksInput.value) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const courseId = parseInt(courseSelect.value);
        const assessmentType = examTypeSelect.value;
        const totalMarks = parseFloat(totalMarksInput.value);
        const assessmentName = `${assessmentType} ${new Date().getFullYear()}`;

        // Prepare results data for API
        const results_data = [];
        const rows = document.querySelectorAll('.student-mark-row');

        rows.forEach(row => {
            const studentId = parseInt(row.dataset.studentId);
            const marksInput = row.querySelector('.mark-input');
            const marksObtained = parseFloat(marksInput.value);

            if (!isNaN(marksObtained) && marksObtained >= 0) {
                results_data.push({
                    student_id: studentId,
                    marks_obtained: marksObtained
                });
            }
        });

        if (results_data.length === 0) {
            showToast('Please enter marks for at least one student', 'warning');
            return;
        }

        try {
            // Call real API
            const result = await API.uploadAssessments(
                courseId,
                assessmentType,
                assessmentName,
                totalMarks,
                results_data
            );

            console.log('✅ Results uploaded successfully:', result);
            showToast(`Results uploaded for ${results_data.length} students`, 'success');

            document.getElementById('uploadModal').classList.remove('show');

            // Refresh the results table
            await this.loadResults();

        } catch (error) {
            console.error('❌ Failed to upload results:', error);
            showToast('Failed to upload results: ' + error.message, 'error');
        }
    }

    resetModal() {
        document.getElementById('uploadForm')?.reset();
        const container = document.getElementById('studentMarksEntry');
        if (container) {
            container.innerHTML = '<div class="empty-state-small"><p>Select a course to enter marks for students</p></div>';
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
