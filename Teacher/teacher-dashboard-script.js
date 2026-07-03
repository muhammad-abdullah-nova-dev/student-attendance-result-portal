// ========================================
// Teacher Dashboard Script (Backend Integrated - 100% Dynamic)
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

    // Update Sidebar
    updateSidebarInfo(user);

    // Initialize Dashboard
    await loadDashboardData(user.id);

    // Setup Listeners
    setupEventListeners();

    // Setup Real-time Listeners
    setupRealTimeListeners();
});

function setupRealTimeListeners() {
    if (!window.API || !API.socket) return;

    // Listen for attendance updates
    API.on('attendance:marked', (data) => {
        console.log('🔔 Attendance update:', data);
        showToast(`Attendance updated for course ID: ${data.course_id}`, 'info');
    });

    // Listen for results updates
    API.on('results:updated', (data) => {
        console.log('🔔 Results update:', data);
        showToast(`Results updated for course ID: ${data.course_id}`, 'info');
    });
}

function updateSidebarInfo(user) {
    if (!user) return;
    const nameEl = document.getElementById('teacherName');
    if (nameEl) nameEl.textContent = user.name || 'Teacher';

    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.name || 'Teacher'}!`;
}

async function loadDashboardData(teacherId) {
    try {
        // Fetch all courses and filter by teacher
        const response = await API.getCourses();
        const allCourses = response.data || [];

        // Filter courses taught by this teacher
        const myCourses = allCourses.filter(c => c.teacher_id === teacherId);

        // Update Stats (100% Dynamic)
        await updateStats(myCourses);

        // Render Lists (100% Dynamic)
        await renderTodaysClasses();
        await renderPendingTasks();

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function updateStats(courses) {
    // My Courses (dynamic from database)
    const myCoursesEl = document.getElementById('myCourses');
    if (myCoursesEl) myCoursesEl.textContent = courses.length;

    // Fetch real teacher statistics from NEW API
    try {
        const user = API.getCurrentUser();
        const statsResponse = await API.request(`/teachers/${user.id}/stats`);
        const stats = statsResponse.data;

        // Today's Classes (from real timetable table)
        const todaysClassesEl = document.getElementById('todaysClasses');
        if (todaysClassesEl) todaysClassesEl.textContent = stats.todaysClasses || 0;

        // Pending Tasks (from database - unmarked attendance)
        const pendingTasksEl = document.getElementById('pendingTasks');
        if (pendingTasksEl) pendingTasksEl.textContent = stats.pendingTasks || 0;

        // Attendance Percentage (calculated from real attendance records)
        const attendanceMarkedEl = document.getElementById('attendanceMarked');
        if (attendanceMarkedEl) attendanceMarkedEl.textContent = stats.attendancePercentage || '0%';

    } catch (error) {
        console.error('Failed to load teacher stats:', error);
        // Fallback to zeros if API fails
        if (document.getElementById('todaysClasses')) document.getElementById('todaysClasses').textContent = '0';
        if (document.getElementById('pendingTasks')) document.getElementById('pendingTasks').textContent = '0';
        if (document.getElementById('attendanceMarked')) document.getElementById('attendanceMarked').textContent = '0%';
    }
}

async function renderTodaysClasses() {
    const container = document.getElementById('todaysClassesList');
    if (!container) return;

    container.innerHTML = '';

    try {
        // Fetch real today's schedule from API
        const user = API.getCurrentUser();
        const statsResponse = await API.request(`/teachers/${user.id}/stats`);
        const schedule = statsResponse.data.todaysSchedule || [];

        if (schedule.length === 0) {
            container.innerHTML = '<div class="empty-state-small">No classes scheduled for today</div>';
            return;
        }

        schedule.forEach(classItem => {
            const item = document.createElement('div');
            item.className = 'class-item';
            item.innerHTML = `
                <div class="class-info">
                    <h4>${classItem.course}</h4>
                    <p class="class-meta">${classItem.code} • ${classItem.time} • ${classItem.room}</p>
                </div>
                <button class="btn-sm btn-outline" onclick="window.location.href='teacher-mark-attendance.html'">Mark Attendance</button>
            `;
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid #eee';
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Failed to load today\'s classes:', error);
        container.innerHTML = '<div class="empty-state-small">Unable to load schedule</div>';
    }
}

async function renderPendingTasks() {
    const container = document.getElementById('pendingTasksList');
    if (!container) return;

    container.innerHTML = '';

    try {
        // Fetch real pending tasks from API
        const user = API.getCurrentUser();
        const statsResponse = await API.request(`/teachers/${user.id}/stats`);
        const tasks = statsResponse.data.tasks || [];

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state-small">No pending tasks</div>';
            return;
        }

        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.innerHTML = `
                <div class="task-info">
                    <h4>${task.message}</h4>
                    <p class="task-meta">${task.course}</p>
                </div>
                <div class="task-status pending">Pending</div>
            `;
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid #eee';
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Failed to load pending tasks:', error);
        container.innerHTML = '<div class="empty-state-small">Unable to load tasks</div>';
    }
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                API.logout();
                window.location.href = '../Login/teacher-login.html';
            }
        });
    }

    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Notification Dropdown Toggle
    const notifIcon = document.querySelector('.notification-icon');
    const notifDropdown = document.getElementById('notificationDropdown');
    if (notifIcon && notifDropdown) {
        notifIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!notifIcon.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }
}

// Quick Actions
document.getElementById('markAttendanceAction')?.addEventListener('click', () => {
    window.location.href = 'teacher-mark-attendance.html';
});

document.getElementById('uploadResultsAction')?.addEventListener('click', () => {
    window.location.href = 'teacher-upload-results.html';
});

document.getElementById('viewHistoryAction')?.addEventListener('click', () => {
    window.location.href = 'teacher-attendance-history.html';
});
