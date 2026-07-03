// ========================================
// Student Dashboard Script (Backend Integrated)
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

    // Update Sidebar
    updateSidebarInfo(user);

    // Initialize Dashboard
    await loadDashboardData(user.id);

    // Setup Listeners
    setupEventListeners();

    // Setup Real-time Listeners
    setupRealTimeListeners(user.id);
});

function setupRealTimeListeners(studentId) {
    if (!window.API || !API.socket) return;

    // Listen for results updates
    API.on('results:updated', (data) => {
        console.log('🔔 New results available:', data);
        showToast('New results available! Refreshing...', 'info');
        loadDashboardData(studentId); // Reload data
    });

    // Listen for attendance updates
    API.on('attendance:marked', (data) => {
        console.log('🔔 Attendance updated:', data);
        showToast('Attendance updated! Refreshing...', 'info');
        loadDashboardData(studentId); // Reload data
    });
}


function updateSidebarInfo(user) {
    if (!user) return;
    const nameEl = document.getElementById('studentName');
    const emailEl = document.getElementById('studentEmail');
    const rollEl = document.getElementById('studentRoll');

    if (nameEl) nameEl.textContent = user.name || 'Student';
    if (emailEl) emailEl.textContent = user.email || 'student@school.test';
    if (rollEl) rollEl.textContent = user.roll_number || 'N/A';

    // Update Welcome Message
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
    }
}

async function loadDashboardData(studentId) {
    try {
        // Fetch Results, Attendance, Enrollments, and Notifications in parallel
        const [resultsResponse, attendanceResponse, enrollmentsResponse, notificationsResponse] = await Promise.all([
            API.getStudentResults(studentId).catch(() => null),
            API.getAttendanceReport(studentId).catch(() => null),
            API.getStudentEnrollments(studentId).catch(() => null),
            API.getNotifications(studentId).catch(() => null)
        ]);

        // Update CGPA
        const cgpaEl = document.getElementById('currentGPA');
        if (cgpaEl && resultsResponse && resultsResponse.data && resultsResponse.data.cgpa !== undefined) {
            cgpaEl.textContent = resultsResponse.data.cgpa.toFixed(2);
        } else if (cgpaEl) {
            cgpaEl.textContent = '0.0';
        }

        // Update Attendance Chart (Dynamic Donut)
        const attendanceEl = document.getElementById('overallAttendance');
        let overallPct = 0;
        if (attendanceResponse && attendanceResponse.data && attendanceResponse.data.overall_percentage !== undefined) {
            overallPct = attendanceResponse.data.overall_percentage;
            if (attendanceEl) attendanceEl.textContent = overallPct + '%';

            // Update Donut Chart Conic Gradient
            const chartEl = document.getElementById('attendanceChart');
            if (chartEl) {
                chartEl.style.background = `conic-gradient(var(--primary-color) ${overallPct * 3.6}deg, #e0e0e0 ${overallPct * 3.6}deg)`;
            }
        } else if (attendanceEl) {
            attendanceEl.textContent = '0%';
        }

        // Update Enrolled Courses Count
        const enrolledEl = document.getElementById('enrolledCoursesCount');
        if (enrolledEl && enrollmentsResponse && enrollmentsResponse.data) {
            enrolledEl.textContent = enrollmentsResponse.data.length;
        } else if (enrolledEl) {
            enrolledEl.textContent = '0';
        }

        // Update Results Published Count
        const resultsCountEl = document.getElementById('resultsPublishedCount');
        if (resultsCountEl && resultsResponse && resultsResponse.data && resultsResponse.data.results) {
            resultsCountEl.textContent = resultsResponse.data.results.length;
        } else if (resultsCountEl) {
            resultsCountEl.textContent = '0';
        }

        // Render Recent Results
        if (resultsResponse && resultsResponse.data && resultsResponse.data.results && resultsResponse.data.results.length > 0) {
            renderResultsList(resultsResponse.data.results);
        } else {
            const container = document.getElementById('latestResultsList');
            if (container) {
                container.innerHTML = '<div class="empty-state-small">No results available yet.</div>';
            }
        }

        // Render Course Attendance List
        if (attendanceResponse && attendanceResponse.data && attendanceResponse.data.courses) {
            renderCourseAttendance(attendanceResponse.data.courses);
        }

        // Render Notifications
        if (notificationsResponse && notificationsResponse.length > 0) {
            renderNotifications(notificationsResponse);
        } else {
            renderNotifications([]); // clear or show empty state
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Set default placeholders
        ['currentGPA', 'overallAttendance', 'enrolledCoursesCount', 'resultsPublishedCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = id === 'currentGPA' ? '0.0' : (id === 'overallAttendance' ? '0%' : '0');
        });
    }
}

function renderCourseAttendance(courses) {
    const container = document.getElementById('courseAttendanceList');
    if (!container) return;

    container.innerHTML = '';

    if (courses.length === 0) {
        container.innerHTML = '<div class="empty-state-small">No attendance records found.</div>';
        return;
    }

    courses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'course-attendance-item';

        // Determine color based on percentage
        let colorClass = 'green';
        if (course.percentage < 75) colorClass = 'red';
        else if (course.percentage < 85) colorClass = 'orange';

        item.innerHTML = `
            <div class="course-info">
                <div class="course-code">${course.course_code}</div>
                <div class="course-name">${course.course_title}</div>
            </div>
            <div class="course-stat">
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width: ${course.percentage}%"></div>
                </div>
                <span class="percentage-text">${course.percentage}%</span>
            </div>
        `;

        // Inline styles for basic layout if CSS is missing
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '10px 0';
        item.style.borderBottom = '1px solid #f0f0f0';

        const progressContainer = item.querySelector('.progress-bar');
        progressContainer.style.width = '100px';
        progressContainer.style.height = '6px';
        progressContainer.style.backgroundColor = '#eee';
        progressContainer.style.borderRadius = '3px';
        progressContainer.style.marginRight = '10px';

        const progressFill = item.querySelector('.progress-fill');
        progressFill.style.height = '100%';
        progressFill.style.borderRadius = '3px';
        progressFill.style.backgroundColor = course.percentage < 75 ? '#f44336' : (course.percentage < 85 ? '#ff9800' : '#4CAF50');

        container.appendChild(item);
    });
}

function renderResultsList(results) {
    const container = document.getElementById('latestResultsList');
    if (!container) return;

    container.innerHTML = '';

    // Take only last 5 results
    const recentResults = results.slice(0, 5);

    recentResults.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const gradeColor = result.grade === 'F' ? 'var(--red, red)' : 'var(--green, green)';

        // Fix: Correctly access nested course object
        const courseTitle = result.course?.course_title || result.Course?.course_title || 'Unknown Course';
        const courseCode = result.course?.course_code || result.Course?.course_code || 'N/A';

        item.innerHTML = `
            <div class="result-info">
                <div class="result-course">${courseTitle}</div>
                <div class="result-code">${courseCode}</div>
            </div>
            <div class="result-grade" style="color: ${gradeColor}; font-weight: bold;">
                ${result.grade || 'N/A'}
            </div>
        `;

        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '12px';
        item.style.borderBottom = '1px solid #eee';

        container.appendChild(item);
    });
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationList');
    const badge = document.querySelector('.notification-badge');

    if (!container) return;

    container.innerHTML = '';

    // Update badge count
    const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="empty-state-small" style="padding:15px; text-align:center; color:#666;">No notifications</div>';
        return;
    }

    // Take last 5 notifications
    notifications.slice(0, 5).forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
        item.style.padding = '10px 15px';
        item.style.borderBottom = '1px solid #eee';
        item.style.cursor = 'pointer';
        if (!notification.is_read) item.style.backgroundColor = '#f0f7ff';

        const date = new Date(notification.created_at).toLocaleDateString();

        item.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px;">${notification.title}</div>
            <div style="font-size: 0.9em; color: #666;">${notification.message}</div>
            <div style="font-size: 0.8em; color: #999; margin-top: 4px;">${date}</div>
        `;

        container.appendChild(item);
    });
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            API.logout();
            window.location.href = '../index.html';
        });
    }

    // Sidebar toggle
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
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
