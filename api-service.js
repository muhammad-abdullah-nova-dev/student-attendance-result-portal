/**
 * API Service for Student Portal Backend Integration
 * 
 * This service provides a centralized way to communicate with the backend API.
 * It handles authentication, request formatting, error handling, and real-time updates.
 * 
 * Usage:
 * import './api-service.js';
 * const result = await API.login(email, password);
 */

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

class APIService {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
        this.socket = null;
        this.eventListeners = new Map();

        // Initialize Socket.IO connection if token exists
        if (this.token) {
            this.connectSocket();
        }
    }

    /**
     * Connect to WebSocket server
     */
    connectSocket() {
        // Load Socket.IO from CDN if not already loaded
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded. Real-time updates disabled.');
            return;
        }

        if (this.socket && this.socket.connected) {
            return; // Already connected
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token: this.token
            },
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.eventListeners.clear();
        }
    }

    /**
     * Subscribe to real-time events
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (!this.socket) {
            console.warn('Socket not connected. Event listener not added.');
            return;
        }

        this.socket.on(event, callback);

        // Track listeners for cleanup
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Unsubscribe from real-time events
     * @param {string} event - Event name
     * @param {function} callback - Callback function (optional)
     */
    off(event, callback) {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event, callback);
        } else {
            this.socket.off(event);
            this.eventListeners.delete(event);
        }
    }

    /**
     * Generic request handler
     */
    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        const url = `${this.baseURL}${endpoint}`;
        console.log(`🔵 API Request: ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                console.error('❌ API Error:', data);
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ API Success:', data);
            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                console.error('❌ Connection Error: Cannot reach backend server at', this.baseURL);
                console.error('   → Make sure backend is running: cd backend && npm start');
                throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
            }
            console.error('❌ API Request Error:', error);
            throw error;
        }
    }

    // ========================================
    // AUTHENTICATION
    // ========================================

    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{token: string, user: object}>}
     */
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        // Store token and user info
        this.token = data.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));

        // Connect socket after login
        this.connectSocket();

        return data.data;
    }

    /**
     * Get current logged in user
     * @returns {Promise<object>}
     */
    async getMe() {
        const data = await this.request('/auth/me');
        return data.data;
    }

    /**
     * Reset password
     * @param {string} currentPassword 
     * @param {string} newPassword 
     */
    async resetPassword(currentPassword, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    /**
     * Logout user
     */
    logout() {
        this.disconnectSocket();
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.token = null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Get current user from localStorage
     * @returns {object|null}
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    // ========================================
    // USERS
    // ========================================

    /**
     * Get all users
     * @param {object} params - Query parameters (role, search, page, limit)
     * @returns {Promise<{data: array, pagination: object}>}
     */
    async getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        const result = await this.request(`/users${query ? '?' + query : ''}`);
        return result;
    }

    /**
     * Get single user by ID and Role
     * @param {string} role
     * @param {number} id 
     * @returns {Promise<object>}
     */
    async getUser(role, id) {
        const result = await this.request(`/users/${role}/${id}`);
        return result.data;
    }

    /**
     * Create new user
     * @param {object} userData 
     * @returns {Promise<object>}
     */
    async createUser(userData) {
        const result = await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return result.data;
    }

    /**
     * Update user
     * @param {string} role
     * @param {number} id 
     * @param {object} userData 
     * @returns {Promise<object>}
     */
    async updateUser(role, id, userData) {
        const result = await this.request(`/users/${role}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return result.data;
    }

    /**
     * Delete user
     * @param {string} role
     * @param {number} id 
     */
    async deleteUser(role, id) {
        return this.request(`/users/${role}/${id}`, {
            method: 'DELETE'
        });
    }

    // ========================================
    // COURSES
    // ========================================

    /**
     * Get all courses
     * @param {object} params - Query parameters (status, teacher_id, page, limit)
     * @returns {Promise<{data: array, pagination: object}>}
     */
    async getCourses(params = {}) {
        const query = new URLSearchParams(params).toString();
        const result = await this.request(`/courses${query ? '?' + query : ''}`);
        return result;
    }

    /**
     * Get single course by ID
     * @param {number} id 
     * @returns {Promise<object>}
     */
    async getCourse(id) {
        const result = await this.request(`/courses/${id}`);
        return result.data;
    }

    /**
     * Create new course
     * @param {object} courseData 
     * @returns {Promise<object>}
     */
    async createCourse(courseData) {
        const result = await this.request('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
        return result.data;
    }

    /**
     * Update course
     * @param {number} id 
     * @param {object} courseData 
     * @returns {Promise<object>}
     */
    async updateCourse(id, courseData) {
        const result = await this.request(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
        return result.data;
    }

    /**
     * Delete course
     * @param {number} id 
     */
    async deleteCourse(id) {
        return this.request(`/courses/${id}`, {
            method: 'DELETE'
        });
    }

    // ========================================
    // ATTENDANCE
    // ========================================

    /**
     * Mark attendance (batch)
     * @param {number} course_id - Course ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} session_type - Session type (Lecture, Lab, Tutorial)
     * @param {array} attendance_records - Array of {student_id, status}
     * @returns {Promise<object>}
     */
    async markAttendance(course_id, date, session_type, attendance_records) {
        return this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify({
                course_id,
                date,
                session_type,
                attendance_records
            })
        });
    }

    /**
     * Get attendance records
     * @param {object} params - Query parameters (student_id, course_id, date_from, date_to)
     * @returns {Promise<{data: array, pagination: object}>}
     */
    async getAttendance(params = {}) {
        const query = new URLSearchParams(params).toString();
        const result = await this.request(`/attendance${query ? '?' + query : ''}`);
        return result;
    }

    /**
     * Get attendance report for a student
     * @param {number} student_id 
     * @returns {Promise<object>}
     */
    async getAttendanceReport(student_id) {
        const result = await this.request(`/attendance/report/${student_id}`);
        return result.data;
    }

    // ========================================
    // RESULTS
    // ========================================

    /**
     * Get student results with CGPA
     * @param {number} student_id 
     * @returns {Promise<object>}
     */
    async getStudentResults(student_id) {
        const result = await this.request(`/results/student/${student_id}`);
        return result.data;
    }

    /**
     * Create single result
     * @param {object} resultData 
     * @returns {Promise<object>}
     */
    async createResult(resultData) {
        return this.request('/results', {
            method: 'POST',
            body: JSON.stringify(resultData)
        });
    }

    /**
     * Upload assessments (batch)
     * @param {number} course_id - Course ID
     * @param {string} assessment_type - Assessment type (Midterm, Final, Quiz, etc)
     * @param {string} assessment_name - Name of the assessment
     * @param {number} total_marks - Total marks for the assessment
     * @param {array} results_data - Array of {student_id, marks_obtained}
     * @returns {Promise<object>}
     */
    async uploadAssessments(course_id, assessment_type, assessment_name, total_marks, results_data) {
        return this.request('/results/assessments', {
            method: 'POST',
            body: JSON.stringify({
                course_id,
                assessment_type,
                assessment_name,
                total_marks,
                results_data
            })
        });
    }

    /**
     * Get performance analysis report
     * @param {object} params - Query parameters (course_id, semester)
     * @returns {Promise<object>}
     */
    async getPerformanceAnalysis(params = {}) {
        const query = new URLSearchParams(params).toString();
        const result = await this.request(`/results/performance-analysis${query ? '?' + query : ''}`);
        return result.data;
    }
    /**
     * Get student enrollments
     * @param {number} student_id 
     * @returns {Promise<array>}
     */
    async getStudentEnrollments(student_id) {
        const result = await this.request(`/enrollments/student/${student_id}`);
        return result.data;
    }

    /**
     * Get notifications for a user
     * @param {number} userId 
     * @returns {Promise<array>}
     */
    async getNotifications(userId) {
        const result = await this.request(`/notifications/${userId}`);
        return result.data;
    }
}

// Create global API instance
window.API = new APIService();
