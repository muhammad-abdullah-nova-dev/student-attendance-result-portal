// ========================================
// Admin Users Management - Backend Integrated
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
    window.usersController = new UsersController();
});

class UsersController {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.editingUser = null;
        this.searchQuery = '';
        this.users = [];

        this.init();
    }

    async init() {
        setupSidebar();
        this.setupEventListeners();
        this.setupNotificationDropdown();
        await this.loadUsers();
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
                // Populate with dummy or real data
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
        // Reuse the logic or fetch real alerts
        const alerts = [];
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

    async loadUsers() {
        try {
            const response = await API.getUsers({ limit: 1000 });
            this.users = response.data || [];
            this.renderTable();
        } catch (error) {
            console.error('Failed to load users:', error);
            showToast('Failed to load users', 'error');
        }
    }

    setupEventListeners() {
        // Add user button
        document.getElementById('addUserModalBtn')?.addEventListener('click', () => this.openModal());

        // Modal close
        document.getElementById('closeUserModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelUserBtn')?.addEventListener('click', () => this.closeModal());

        // Form submit
        document.getElementById('userForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Search
        document.getElementById('userSearch')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.currentPage = 1;
            this.renderTable();
        });

        // Pagination
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

    getFilteredUsers() {
        if (!this.searchQuery) return this.users;

        const query = this.searchQuery.toLowerCase();
        return this.users.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query)
        );
    }

    getTotalPages() {
        return Math.ceil(this.getFilteredUsers().length / this.itemsPerPage);
    }

    renderTable() {
        const filtered = this.getFilteredUsers();
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const paginated = filtered.slice(start, start + this.itemsPerPage);

        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = paginated.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${this.getInitials(user.name)}</div>
                        <span>${user.name}</span>
                    </div>
                </td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.status || 'active'}">${user.status || 'Active'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit-btn" onclick="usersController.editUser(${user.id})">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="icon-btn delete-btn" onclick="usersController.deleteUserById('${user.role}', ${user.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updatePagination(filtered.length);
    }

    updatePagination(total) {
        const totalPages = this.getTotalPages();
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, total);

        const info = document.getElementById('paginationInfo');
        if (info) {
            info.textContent = total > 0 ? `Showing ${start} to ${end} of ${total} users (Page ${this.currentPage} of ${totalPages})` : 'No users found';
        }

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;

        // Update page numbers display
        const pageNumbersContainer = document.getElementById('paginationNumbers');
        if (pageNumbersContainer && totalPages > 1) {
            let pageHTML = '';

            // Show first page
            if (this.currentPage > 3) {
                pageHTML += `<button class="pagination-btn ${1 === this.currentPage ? 'active' : ''}" onclick="usersController.goToPage(1)">1</button>`;
                if (this.currentPage > 4) pageHTML += '<span>...</span>';
            }

            // Show pages around current
            for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
                pageHTML += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="usersController.goToPage(${i})">${i}</button>`;
            }

            // Show last page
            if (this.currentPage < totalPages - 2) {
                if (this.currentPage < totalPages - 3) pageHTML += '<span>...</span>';
                pageHTML += `<button class="pagination-btn ${totalPages === this.currentPage ? 'active' : ''}" onclick="usersController.goToPage(${totalPages})">${totalPages}</button>`;
            }

            pageNumbersContainer.innerHTML = pageHTML;
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    openModal(user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        const submitBtn = document.getElementById('submitUserBtn');

        if (user) {
            this.editingUser = user;
            title.textContent = 'Edit User';
            submitBtn.textContent = 'Update User';
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPassword').required = false;
            document.getElementById('userPassword').placeholder = 'Leave blank to keep current';
        } else {
            this.editingUser = null;
            title.textContent = 'Create New User';
            submitBtn.textContent = 'Create User';
            form.reset();
            document.getElementById('userPassword').required = true;
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('userModal').classList.remove('active');
        this.editingUser = null;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value,
            password: document.getElementById('userPassword').value
        };

        try {
            if (this.editingUser) {
                // Update
                await API.updateUser(this.editingUser.role, this.editingUser.id, userData);
                showToast('User updated successfully!', 'success');
            } else {
                // Create
                await API.createUser(userData);
                showToast('User created successfully!', 'success');
            }

            this.closeModal();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showToast(error.message || 'Failed to save user', 'error');
        }
    }

    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.openModal(user);
        }
    }

    async deleteUserById(role, id) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await API.deleteUser(role, id);
            showToast('User deleted successfully!', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast(error.message || 'Failed to delete user', 'error');
        }
    }
}

// ========================================
// Shared UI Functions
// ========================================

function setupSidebar() {
    // Update admin name
    const user = API.getCurrentUser();
    const nameEl = document.getElementById('adminName');
    if (nameEl && user) {
        nameEl.textContent = user.name || 'Admin';
    }

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

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
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

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle'
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

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
