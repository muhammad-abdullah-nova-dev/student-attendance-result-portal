// ========================================
// Admin Courses Management - Backend Integrated
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!window.API || !API.isAuthenticated()) {
        window.location.href = '../Login/admin-login.html';
        return;
    }

    const user = API.getCurrentUser();
    if (user && user.role !== 'admin') {
        alert('Unauthorized access');
        API.logout();
        window.location.href = '../Login/admin-login.html';
        return;
    }

    // Initialize controller
    window.coursesController = new CoursesController();
});

class CoursesController {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.editingCourse = null;
        this.courses = [];
        this.teachers = [];

        this.init();
    }

    async init() {
        setupSidebar();
        this.setupEventListeners();
        this.setupNotificationDropdown();
        await this.loadData();
    }

    setupNotificationDropdown() {
        const notificationIcon = document.querySelector('.notification-icon');
        if (!notificationIcon) return;

        let dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'notificationDropdown';
            dropdown.className = 'notification-dropdown';
            notificationIcon.appendChild(dropdown);
        }

        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            if (dropdown.classList.contains('active')) {
                this.populateNotifications(dropdown);
            }
        });

        document.addEventListener('click', (e) => {
            if (!notificationIcon.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    populateNotifications(dropdown) {
        const notificationsHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <a href="#" class="mark-read">Mark all as read</a>
            </div>
            <div class="notification-list">
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            </div>
        `;
        dropdown.innerHTML = notificationsHTML;
    }

    async loadData() {
        try {
            const [coursesResp, usersResp] = await Promise.all([
                API.getCourses({ limit: 1000 }),
                API.getUsers({ limit: 1000 })
            ]);

            this.courses = coursesResp.data || [];
            const users = usersResp.data || [];
            this.teachers = users.filter(u => u.role === 'teacher');

            this.renderTable();
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load courses', 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('addCourseModalBtn')?.addEventListener('click', () => this.openModal());
        document.getElementById('closeCourseModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelCourseBtn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('courseForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('nextPageBtn')?.addEventListener('click', () => {
            if (this.currentPage < this.getTotalPages()) {
                this.currentPage++;
                this.renderTable();
            }
        });
    }

    getTotalPages() {
        return Math.ceil(this.courses.length / this.itemsPerPage);
    }

    renderTable() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const paginated = this.courses.slice(start, start + this.itemsPerPage);

        const tbody = document.getElementById('coursesTableBody');
        if (!tbody) return;

        if (this.courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No courses found</td></tr>';
            return;
        }

        tbody.innerHTML = paginated.map(course => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-book" style="color:#4a90e2;"></i>
                        <span>${course.course_title || 'Untitled'}</span>
                    </div>
                </td>
                <td>${course.course_code || 'N/A'}</td>
                <td>${course.teacher ? course.teacher.name : 'Unassigned'}</td>
                <td>${course.credit_hours || 0}</td>
                <td><span class="status-badge active">Active</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="coursesController.editCourse(${course.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="coursesController.deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updatePagination();
    }

    updatePagination() {
        const totalPages = this.getTotalPages();
        const info = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (info) info.textContent = `Showing ${this.courses.length} courses`;
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages || totalPages === 0;
    }

    openModal(course = null) {
        const modal = document.getElementById('courseModal');
        const form = document.getElementById('courseForm');
        const title = document.getElementById('courseModalTitle');

        if (course) {
            this.editingCourse = course;
            title.textContent = 'Edit Course';
            document.getElementById('courseName').value = course.course_title;
            document.getElementById('courseCode').value = course.course_code || '';
            document.getElementById('courseDescription').value = course.description || '';
            if (document.getElementById('courseCreditHours')) {
                document.getElementById('courseCreditHours').value = course.credit_hours || 3;
            }
        } else {
            this.editingCourse = null;
            title.textContent = 'Create New Course';
            form.reset();
        }

        // Populate teacher dropdown
        const teacherSelect = document.getElementById('courseTeacher');
        if (teacherSelect) {
            teacherSelect.innerHTML = '<option value="">Select a teacher</option>' +
                this.teachers.map(t => `<option value="${t.id}" ${this.editingCourse && this.editingCourse.teacher_id === t.id ? 'selected' : ''}>${t.name}</option>`).join('');
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('courseModal').classList.remove('active');
        this.editingCourse = null;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const courseData = {
            course_title: document.getElementById('courseName').value,
            course_code: document.getElementById('courseCode').value,
            teacher_id: parseInt(document.getElementById('courseTeacher').value),
            description: document.getElementById('courseDescription').value,
            credit_hours: document.getElementById('courseCreditHours') ? parseInt(document.getElementById('courseCreditHours').value) : 3
        };

        try {
            if (this.editingCourse) {
                await API.updateCourse(this.editingCourse.id, courseData);
                showToast('Course updated successfully!', 'success');
            } else {
                await API.createCourse(courseData);
                showToast('Course created successfully!', 'success');
            }

            this.closeModal();
            await this.loadData();
        } catch (error) {
            console.error('Error saving course:', error);
            showToast(error.message || 'Failed to save course', 'error');
        }
    }

    editCourse(id) {
        const course = this.courses.find(c => c.id === id);
        if (course) {
            this.openModal(course);
        }
    }

    async deleteCourse(id) {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            await API.deleteCourse(id);
            showToast('Course deleted successfully!', 'success');
            await this.loadData();
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast(error.message || 'Failed to delete course', 'error');
        }
    }
}

// Shared UI Functions (same as admin-users-script.js)
function setupSidebar() {
    const user = API.getCurrentUser();
    const nameEl = document.getElementById('adminName');
    if (nameEl && user) nameEl.textContent = user.name || 'Admin';

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                API.logout();
                window.location.href = '../Login/admin-login.html';
            }
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.success}"></i></div>
        <div class="toast-content"><div class="toast-message">${message}</div></div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
