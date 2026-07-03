// Button event listeners
document.getElementById('admin-btn').addEventListener('click', function() {
    handleLogin('admin');
});

document.getElementById('teacher-btn').addEventListener('click', function() {
    handleLogin('teacher');
});

document.getElementById('student-btn').addEventListener('click', function() {
    handleLogin('student');
});

// Handle login function
function handleLogin(role) {
    // Add a subtle animation feedback
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = '';
        // Here you would typically redirect to the appropriate dashboard
        console.log(`Redirecting to ${role} dashboard...`);
        alert(`Redirecting to ${role.charAt(0).toUpperCase() + role.slice(1)} Login Page`);
        
        // Example redirect (uncomment when you have actual pages):
        // window.location.href = `${role}-login.html`;
    }, 150);
}

// Add ripple effect to buttons
document.querySelectorAll('.login-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
    .login-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add keyboard accessibility
document.querySelectorAll('.role-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.querySelector('.login-btn').click();
        }
    });
});

// Loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.3s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});
