// Login Form Handler
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const backLink = document.getElementById('back-link');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const supportLink = document.getElementById('support-link');

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            // Get the role type from the page title
            const pageTitle = document.title;
            let role = 'Student';
            if (pageTitle.includes('Admin')) {
                role = 'Admin';
            } else if (pageTitle.includes('Teacher')) {
                role = 'Teacher';
            }

            // For demonstration purposes, show an alert
            // In production, this would make an API call to authenticate
            console.log('Login attempt:', {
                role: role,
                email: email,
                password: password,
                remember: remember
            });

            // Show loading state
            const submitBtn = loginForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            // Authenticate with backend API
            try {
                const { token, user } = await API.login(email, password);

                console.log('✅ Login successful:', user);

                // Validate that user's role matches the expected role for this login page
                const expectedRole = role.toLowerCase();
                const actualRole = user.role.toLowerCase();

                if (actualRole !== expectedRole) {
                    // Clear the token since this is not the correct login page
                    API.logout();
                    throw new Error(`Access denied. This is the ${expectedRole} login page. Please use the ${actualRole} login page to access your account.`);
                }

                // Redirect based on role (only if validation passed)
                if (user.role === 'admin') {
                    window.location.href = '../Admin/admin-dashboard.html';
                } else if (user.role === 'teacher') {
                    window.location.href = '../Teacher/teacher-dashboard.html';
                } else if (user.role === 'student') {
                    window.location.href = '../Student/student-dashboard.html';
                } else {
                    throw new Error('Invalid user role');
                }
            } catch (error) {
                console.error('❌ Login failed:', error);
                alert('Login failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Handle back link with smooth transition
    if (backLink) {
        backLink.addEventListener('click', function (e) {
            e.preventDefault();
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 300);
        });
    }

    // Handle forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Password reset functionality would be implemented here.\n\nYou would receive an email with instructions to reset your password.');
        });
    }

    // Handle support link
    if (supportLink) {
        supportLink.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Contact Support:\n\nEmail: support@studentportal.com\nPhone: +1 (555) 123-4567\n\nSupport hours: Monday-Friday, 9am-5pm');
        });
    }

    // Add input validation feedback
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value.trim() === '' && this.hasAttribute('required')) {
                this.style.borderColor = '#E53935';
            } else if (this.type === 'email' && this.value.trim() !== '') {
                // Basic email validation
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(this.value)) {
                    this.style.borderColor = '#E53935';
                } else {
                    this.style.borderColor = '#4CAF50';
                }
            } else if (this.value.trim() !== '') {
                this.style.borderColor = '#4CAF50';
            }
        });

        input.addEventListener('focus', function () {
            this.style.borderColor = '#1D88E5';
        });
    });

    // Add smooth page transitions
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '1';
    }, 100);
});
