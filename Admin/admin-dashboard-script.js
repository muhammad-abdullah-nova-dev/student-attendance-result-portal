// ========================================
// Admin Dashboard Script (Backend Integrated)
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication first
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

    // Update Sidebar User Info
    updateSidebarInfo(user);

    // Initialize Dashboard
    await loadDashboardData();
    await loadAttendanceChart();
    await loadAttendanceAlerts();

    // Setup Event Listeners
    setupEventListeners();

    // Setup Real-time Listeners
    setupRealTimeListeners();
});

function setupRealTimeListeners() {
    if (!window.API || !API.socket) return;

    // Listen for new users
    API.on('user:registered', (data) => {
        console.log('🔔 New user registered:', data);
        showToast(`New user registered: ${data.name} (${data.role})`, 'info');
        loadDashboardData(); // Refresh stats
    });

    // Listen for new courses
    API.on('course:created', (data) => {
        console.log('🔔 New course created:', data);
        showToast(`New course created: ${data.course_title}`, 'info');
        loadDashboardData(); // Refresh stats
    });
}


function updateSidebarInfo(user) {
    if (!user) return;
    const nameEl = document.getElementById('adminName');
    const emailEl = document.getElementById('adminEmail');
    if (nameEl) nameEl.textContent = user.name || 'Admin';
    if (emailEl) emailEl.textContent = user.email || 'admin@school.test';
}

// ========================================
// Data Loading & Rendering
// ========================================

async function loadDashboardData() {
    try {
        // Fetch data in parallel - request ALL users for accurate counts
        const [usersData, coursesData] = await Promise.all([
            API.request('/users?limit=1000'), // Fetch up to 1000 users to get all
            API.getCourses()
        ]);

        const users = usersData.data || [];
        const courses = coursesData.data || [];

        // Update Stats
        updateStats(users, courses);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (error.message.includes('Unauthorized') || error.message.includes('token')) {
            API.logout();
            window.location.href = '../Login/admin-login.html';
        } else {
            alert('Failed to load data. Please check if backend server is running.');
        }
    }
}

function updateStats(users, courses) {
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    const totalCourses = courses.length;

    // Update DOM safely
    safeSetText('totalStudents', totalStudents);
    safeSetText('totalTeachers', totalTeachers);
    safeSetText('totalCourses', totalCourses);
}

function safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ========================================
// Attendance Chart (Dynamic from Database)
// ========================================

async function loadAttendanceChart() {
    try {
        const response = await API.request('/attendance/monthly-stats');
        const data = response.data || [];

        const chartContainer = document.getElementById('attendanceChart');
        if (!chartContainer) return;

        // Clear existing content
        chartContainer.innerHTML = '';

        if (data.length === 0) {
            chartContainer.innerHTML = '<div class="empty-state-small">No attendance data available yet</div>';
            return;
        }

        // Generate bars from real data
        data.forEach(monthData => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bar-wrapper';

            const percentage = parseInt(monthData.percentage) || 0;

            wrapper.innerHTML = `
                <div class="bar-value">${percentage}%</div>
                <div class="bar" style="height: ${percentage}%"></div>
                <div class="bar-label">${monthData.month}</div>
            `;

            chartContainer.appendChild(wrapper);
        });

        console.log('✅ Attendance chart loaded with', data.length, 'months of data');
    } catch (error) {
        console.error('Failed to load attendance chart:', error);
        // Show fallback message
        const chartContainer = document.getElementById('attendanceChart');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="empty-state-small">Unable to load attendance trends</div>';
        }
    }
}

// ========================================
// UI Helpers
// ========================================

function setupEventListeners() {
    // Quick Actions
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            window.location.href = 'admin-users.html';
        });
    }

    const createCourseBtn = document.getElementById('createCourseBtn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', () => {
            window.location.href = 'admin-courses.html';
        });
    }

    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            window.location.href = 'admin-reports.html';
        });
    }

    // Sidebar Toggle
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function showNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Load Recent Attendance Alerts (Dynamic from Database)
async function loadAttendanceAlerts() {
    try {
        // Fetch recent low attendance records from API
        const response = await API.request('/attendance/alerts');
        const alerts = response.data || [];

        const container = document.querySelector('tbody#alertsTableBody');
        if (!container) return;

        container.innerHTML = '';

        if (alerts.length === 0) {
            container.innerHTML = '<tr><td colspan="4" style="text-align:center">No recent alerts</td></tr>';
            return;
        }

        alerts.forEach(alert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${alert.message.split('(')[0]}</td>
                <td>${alert.title}</td>
                <td>${alert.message.match(/(\d+)%/)[0]}</td>
                <td><span class="status-badge ${alert.severity}">${alert.severity === 'critical' ? 'Critical' : 'Warning'}</span></td>
            `;
            container.appendChild(row);
        });

        console.log('✅ Loaded', alerts.length, 'attendance alerts');
    } catch (error) {
        console.error('Failed to load attendance alerts:', error);
        const container = document.querySelector('tbody#alertsTableBody');
        if (container) {
            container.innerHTML = '<tr><td colspan="4" style="text-align:center">Unable to load alerts</td></tr>';
        }
    }
}
