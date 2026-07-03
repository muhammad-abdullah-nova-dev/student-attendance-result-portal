// ========================================
// Teacher Settings - Backend Integrated
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
    new SettingsController();
});

class SettingsController {
    constructor() {
        this.currentUser = API.getCurrentUser();
        this.init();
    }

    init() {
        this.setupSidebar();
        if (this.currentUser) {
            this.loadProfileData();
            this.loadPreferences();
        }
        this.setupEventListeners();
    }

    loadProfileData() {
        const nameParts = this.currentUser.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (document.getElementById('firstName')) document.getElementById('firstName').value = firstName;
        if (document.getElementById('lastName')) document.getElementById('lastName').value = lastName;
        if (document.getElementById('email')) document.getElementById('email').value = this.currentUser.email || '';
        if (document.getElementById('phone')) document.getElementById('phone').value = this.currentUser.phone || '';
        if (document.getElementById('department')) document.getElementById('department').value = this.currentUser.department || 'General';
    }

    loadPreferences() {
        // Mock preferences for now
        const prefs = this.currentUser.preferences || {};
        if (document.getElementById('notifClasses')) document.getElementById('notifClasses').checked = prefs.upcomingClasses !== false;
        if (document.getElementById('notifSubmissions')) document.getElementById('notifSubmissions').checked = prefs.submissions !== false;
        if (document.getElementById('notifAlerts')) document.getElementById('notifAlerts').checked = prefs.lowAttendance === true;
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
        // Profile Form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Password Form
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePassword();
        });

        // Preferences Form
        document.getElementById('preferencesForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePreferences();
        });
    }

    async saveProfile() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const department = document.getElementById('department').value;

        if (!firstName || !lastName || !email) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            await API.updateUser('teacher', this.currentUser.id, {
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                department: department
            });

            // Update local session
            const updatedUser = {
                ...this.currentUser,
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                department: department
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;

            document.getElementById('teacherName').textContent = updatedUser.name;
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Profile update failed:', error);
            showToast('Failed to update profile', 'error');
        }

    }

    async updatePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            await API.resetPassword(currentPassword, newPassword);
            showToast('Password updated successfully', 'success');
            document.getElementById('passwordForm').reset();
        } catch (error) {
            console.error('Password update failed:', error);
            showToast(error.message || 'Failed to update password', 'error');
        }
    }

    savePreferences() {
        // Mock save
        showToast('Preferences saved successfully (Simulated)', 'success');
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
