// ========================================
// Admin Reports Management - Backend Integrated
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
    new ReportsController();
});

class ReportsController {
    constructor() {
        this.init();
    }

    init() {
        this.setupSidebar();
        this.setupEventListeners();
        this.renderRecentReports();
        this.setupNotificationDropdown();
        this.loadReportsChart();
    }

    setupSidebar() {
        // Update admin name
        const user = API.getCurrentUser();
        const nameEl = document.getElementById('adminName');
        if (nameEl && user) {
            nameEl.textContent = user.name || 'Admin';
        }

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Highlight active nav item
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
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

    async populateNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        // Fetch alerts from backend (stubbed)
        let alerts = [];
        try {
            // This endpoint might not exist yet, so we handle failure gracefully
            // or use a known stub if available. For now, we'll assume empty or mock if failed.
            // const response = await API.request('/attendance/alerts');
            // alerts = response.data || [];
            alerts = []; // Default to empty for now as backend stub returns generic success
        } catch (error) {
            console.warn('Failed to fetch notifications:', error);
        }

        const notificationsHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="mark-all-read" onclick="markAllNotificationsRead()">Mark all read</button>
            </div>
            <div class="notification-list">
                ${alerts.length > 0 ? alerts.map(alert => `
                    <div class="notification-item ${alert.read ? '' : 'unread'}" data-id="${alert.id}">
                        <div class="notification-icon-wrapper ${alert.status ? alert.status.toLowerCase() : 'warning'}">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">Low Attendance Alert</div>
                            <div class="notification-message">${alert.studentName} - ${alert.course}: ${alert.attendance}% attendance</div>
                            <div class="notification-time">2 hours ago</div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>No new notifications</p>
                    </div>
                `}
            </div>
            ${alerts.length > 0 ? `
                <div class="notification-footer">
                    <a href="#" class="view-all-notifications">View all notifications</a>
                </div>
            ` : ''}
        `;

        dropdown.innerHTML = notificationsHTML;
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                API.logout();
                window.location.href = '../Login/admin-login.html';
            }
        });

        // Form Submissions
        document.getElementById('attendanceReportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePDF('Attendance Report', 'attendanceModal');
        });

        document.getElementById('resultsReportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePDF('Results Report', 'resultsModal');
        });

        document.getElementById('customReportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePDF('Custom Report', 'customModal');
        });

        // Export All
        document.getElementById('exportAllBtn')?.addEventListener('click', () => {
            this.generateExportAllPDF();
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    renderRecentReports() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        // Mock data for recent reports (static for now as reports aren't stored in DB yet)
        const reports = [
            { title: 'Monthly Attendance Report - October', type: 'Attendance', date: '2025-11-01', typeClass: 'attendance' },
            { title: 'Midterm Results Analysis', type: 'Results', date: '2025-10-28', typeClass: 'results' },
            { title: 'Student Performance Overview', type: 'Results', date: '2025-10-15', typeClass: 'results' },
            { title: 'Weekly Attendance Summary', type: 'Attendance', date: '2025-10-10', typeClass: 'attendance' }
        ];

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>
                    <div class="file-icon">
                        <i class="fas fa-file-pdf"></i>
                        <span>${report.title}</span>
                    </div>
                </td>
                <td><span class="report-type ${report.typeClass}">${report.type}</span></td>
                <td>${report.date}</td>
                <td>
                    <button class="action-link" onclick="downloadReport('${report.title}')">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async generatePDF(title, modalId) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add logo/header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 137); // #2C3E89
        doc.text("School Management System", 20, 20);

        doc.setFontSize(16);
        doc.setTextColor(51, 51, 51);
        doc.text(title, 20, 35);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);
        const user = API.getCurrentUser();
        doc.text(`Generated by: ${user ? user.name : 'Admin'}`, 20, 50);

        // Add dummy content based on report type
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Report Summary", 20, 65);

        const lorem = "This is a generated report containing detailed analysis and statistics. The data presented here reflects the current state of the system based on the selected parameters. This document is confidential and intended for administrative use only.";
        const splitText = doc.splitTextToSize(lorem, 170);
        doc.text(splitText, 20, 75);

        // Add a table using autoTable
        // Add a table using autoTable
        if (title.includes('Attendance')) {
            // Fetch real data
            let tableData = [];
            try {
                // Get all students and their attendance
                const response = await API.request('/attendance?limit=1000');
                const records = response.data || [];

                // Group by student
                const studentMap = {};
                records.forEach(record => {
                    const studentName = record.student ? record.student.name : 'Unknown';
                    const courseCode = record.course ? record.course.course_code : 'N/A';

                    if (!studentMap[studentName]) {
                        studentMap[studentName] = {
                            name: studentName,
                            course: courseCode,
                            total: 0,
                            present: 0
                        };
                    }

                    studentMap[studentName].total++;
                    if (record.status === 'present') studentMap[studentName].present++;
                });

                tableData = Object.values(studentMap).map(s => {
                    const percentage = Math.round((s.present / s.total) * 100);
                    return [s.name, s.course, `${percentage}%`, percentage < 75 ? 'Low' : 'Active'];
                });

            } catch (error) {
                console.error('Error fetching report data:', error);
                tableData = [['Error loading data', '-', '-', '-']];
            }

            if (tableData.length === 0) {
                tableData = [['No attendance records found', '-', '-', '-']];
            }

            doc.autoTable({
                startY: 90,
                head: [['Student Name', 'Course', 'Attendance', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 137] }
            });
        } else {
            // Generic table for other reports
            doc.autoTable({
                startY: 90,
                head: [['Metric', 'Value', 'Change']],
                body: [
                    ['Total Students', '1,248', '+12%'],
                    ['Average Attendance', '87%', '+2%'],
                    ['Course Completion', '94%', '+5%'],
                    ['New Enrollments', '45', '+8%']
                ],
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 137] }
            });
        }

        // Save PDF
        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);

        // Close modal and show toast
        closeModal(modalId);
        showToast(`${title} generated successfully!`, 'success');
    }

    generateExportAllPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(44, 62, 137);
        doc.text("Comprehensive School Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

        // Add sections
        doc.text("Recent Reports Summary", 20, 45);

        const reports = [
            ['Monthly Attendance Report', 'Attendance', '2025-11-01'],
            ['Midterm Results Analysis', 'Results', '2025-10-28'],
            ['Student Performance Overview', 'Results', '2025-10-15'],
            ['Weekly Attendance Summary', 'Attendance', '2025-10-10']
        ];

        doc.autoTable({
            startY: 50,
            head: [['Report Title', 'Type', 'Date']],
            body: reports,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 137] }
        });

        doc.save('All_Reports_Export.pdf');
        showToast('All reports exported successfully!', 'success');
    }

    async loadReportsChart() {
        const chartContainer = document.getElementById('reportsChart');
        if (!chartContainer) return;

        try {
            // Fetch attendance data
            const response = await API.request('/attendance?limit=1000');
            const records = response.data || [];

            // Group by course
            const courseStats = {};
            records.forEach(record => {
                const courseName = record.course ? record.course.course_code : 'Unknown';
                if (!courseStats[courseName]) {
                    courseStats[courseName] = { total: 0, present: 0 };
                }
                courseStats[courseName].total++;
                if (record.status === 'present') {
                    courseStats[courseName].present++;
                }
            });

            // Calculate percentages
            const data = Object.keys(courseStats).map(course => {
                const stats = courseStats[course];
                const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                return { label: course, value: percentage };
            });

            // Render Chart
            chartContainer.innerHTML = '';
            if (data.length === 0) {
                chartContainer.innerHTML = '<div class="empty-state-small">No attendance data available</div>';
                return;
            }

            data.forEach(item => {
                const wrapper = document.createElement('div');
                wrapper.className = 'bar-wrapper';
                wrapper.innerHTML = `
                    <div class="bar-value">${item.value}%</div>
                    <div class="bar" style="height: ${item.value}%"></div>
                    <div class="bar-label">${item.label}</div>
                `;
                chartContainer.appendChild(wrapper);
            });

        } catch (error) {
            console.error('Error loading reports chart:', error);
            chartContainer.innerHTML = '<div class="empty-state-small">Failed to load chart data</div>';
        }
    }
}

// Global functions for HTML onclick events
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Set today's date in title if present
        const titleInput = modal.querySelector('input[type="text"]');
        if (titleInput && titleInput.value.includes('11/27/2025')) {
            // Optional: update date
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function markAllNotificationsRead() {
    const items = document.querySelectorAll('.notification-item.unread');
    items.forEach(item => item.classList.remove('unread'));
    showToast('All notifications marked as read', 'success');
}

function downloadReport(title) {
    const controller = new ReportsController();
    controller.generatePDF(title, 'none');
}

// Toast Notification Helper
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
