// ========================================
// Student Settings - Backend Integrated
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
    new SettingsController();
});

class SettingsController {
    constructor() {
        this.currentStudent = API.getCurrentUser();
        this.init();
    }

    init() {
        this.setupSidebar();
        if (this.currentStudent) {
            this.updateProfile();
            this.loadPersonalInfo();
            this.loadAcademicInfo();
            this.loadNotificationPreferences();
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

    loadPersonalInfo() {
        const nameParts = this.currentStudent.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (document.getElementById('firstName')) document.getElementById('firstName').value = firstName;
        if (document.getElementById('lastName')) document.getElementById('lastName').value = lastName;
        if (document.getElementById('emailAddress')) document.getElementById('emailAddress').value = this.currentStudent.email || '';
        if (document.getElementById('studentId')) document.getElementById('studentId').value = this.currentStudent.id || '';
        if (document.getElementById('phoneNumber')) document.getElementById('phoneNumber').value = this.currentStudent.phone || '';
        if (document.getElementById('dateOfBirth')) document.getElementById('dateOfBirth').value = this.currentStudent.dob || '';
    }

    loadAcademicInfo() {
        if (document.getElementById('program')) document.getElementById('program').value = this.currentStudent.program || 'Bachelor of Science';
        if (document.getElementById('major')) document.getElementById('major').value = this.currentStudent.major || 'Computer Science';
        if (document.getElementById('semester')) document.getElementById('semester').value = this.currentStudent.semester || 'Fall 2025';
        if (document.getElementById('year')) document.getElementById('year').value = this.currentStudent.year || '3rd Year';
    }

    loadNotificationPreferences() {
        // Mock preferences for now
        const prefs = this.currentStudent.preferences || {};
        if (document.getElementById('notifResults')) document.getElementById('notifResults').checked = prefs.results !== false;
        if (document.getElementById('notifAttendance')) document.getElementById('notifAttendance').checked = prefs.attendance !== false;
        if (document.getElementById('notifAnnouncements')) document.getElementById('notifAnnouncements').checked = prefs.announcements !== false;
        if (document.getElementById('notifExamReminders')) document.getElementById('notifExamReminders').checked = prefs.examReminders !== false;
    }

    setupEventListeners() {
        // Personal Info Form
        const personalForm = document.getElementById('personalInfoForm');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePersonalInfo();
            });
        }

        // Password Form
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Notification Preferences Form
        const notifForm = document.getElementById('notificationPreferencesForm');
        if (notifForm) {
            notifForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationPreferences();
            });
        }
    }

    async savePersonalInfo() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('emailAddress').value.trim();
        const phone = document.getElementById('phoneNumber').value.trim();
        const dob = document.getElementById('dateOfBirth').value;

        if (!firstName || !lastName || !email) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            const updatedData = {
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                dob: dob
            };

            await API.updateUser('student', this.currentStudent.id, updatedData);

            // Update local session
            const updatedUser = { ...this.currentStudent, ...updatedData };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentStudent = updatedUser;

            this.updateProfile();
            showToast('Personal information updated successfully!', 'success');
        } catch (error) {
            console.error('Profile update failed:', error);
            showToast('Failed to update personal information', 'error');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            await API.resetPassword(currentPassword, newPassword);
            showToast('Password updated successfully!', 'success');
            document.getElementById('changePasswordForm').reset();
        } catch (error) {
            console.error('Password update failed:', error);
            showToast(error.message || 'Failed to update password', 'error');
        }
    }

    saveNotificationPreferences() {
        // Mock save
        showToast('Notification preferences saved successfully!', 'success');
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
let settingsController;
document.addEventListener('DOMContentLoaded', () => {
    settingsController = new SettingsController();
});