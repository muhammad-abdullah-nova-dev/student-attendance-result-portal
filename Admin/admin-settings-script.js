// ========================================
// Admin Settings - Backend Integrated
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
    new SettingsController();
});

class SettingsController {
    constructor() {
        this.init();
    }

    init() {
        this.setupSidebar();
        this.loadSettings();
        this.setupEventListeners();
        this.setupNotificationDropdown();
    }

    setupSidebar() {
        const user = API.getCurrentUser();
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl && user) {
            adminNameEl.textContent = user.name || 'Admin';
        }

        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    loadSettings() {
        const user = API.getCurrentUser();
        if (user) {
            if (document.getElementById('firstName')) document.getElementById('firstName').value = user.name.split(' ')[0] || '';
            if (document.getElementById('lastName')) document.getElementById('lastName').value = user.name.split(' ').slice(1).join(' ') || '';
            if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
        }

        // Load system settings (mock/stub for now as backend doesn't store these yet)
        // In a real app, fetch from API.request('/settings/system')
        if (document.getElementById('academicYear')) document.getElementById('academicYear').value = '2025-2026';
        if (document.getElementById('semester')) document.getElementById('semester').value = 'Fall';
        if (document.getElementById('attendanceThreshold')) document.getElementById('attendanceThreshold').value = 75;
    }

    setupEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileSettings();
        });

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // System form
        const systemForm = document.getElementById('systemForm');
        systemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemSettings();
        });

        // Notification form
        const notificationForm = document.getElementById('notificationForm');
        notificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationPreferences();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    API.logout();
                    window.location.href = '../Login/admin-login.html';
                }
            });
        }
    }

    async saveProfileSettings() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!firstName || !lastName || !email) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Update user profile via API
            // Assuming endpoint exists or using generic update
            const user = API.getCurrentUser();
            await API.updateUser('admin', user.id, {
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone // Note: phone not in DB schema yet, but passed for completeness
            });

            // Update local user info
            const updatedUser = { ...user, name: `${firstName} ${lastName}`, email: email };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            // Update UI
            document.getElementById('adminName').textContent = updatedUser.name;
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Profile update failed:', error);
            showToast('Failed to update profile', 'error');
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

            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            console.error('Password change failed:', error);
            showToast(error.message || 'Failed to change password', 'error');
        }
    }

    saveSystemSettings() {
        // Mock save - backend doesn't have system settings table yet
        showToast('System settings saved (simulated)!', 'success');
    }

    saveNotificationPreferences() {
        // Mock save
        showToast('Notification preferences saved (simulated)!', 'success');
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
                this.populateNotifications();
            }
        });

        document.addEventListener('click', (e) => {
            if (!notificationIcon.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    populateNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        // Mock alerts
        const alerts = [];

        let notificationsHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="mark-all-read" onclick="markAllNotificationsRead()">Mark all read</button>
            </div>
            <div class="notification-list">
        `;

        if (alerts.length === 0) {
            notificationsHTML += `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            `;
        }

        notificationsHTML += `
            </div>
            <div class="notification-footer">
                <a href="#" class="view-all-notifications">View All Notifications</a>
            </div>
        `;

        dropdown.innerHTML = notificationsHTML;
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

function markAllNotificationsRead() {
    showToast('All notifications marked as read', 'info');
}
