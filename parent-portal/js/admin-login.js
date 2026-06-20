// js/admin-login.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const adminSession = sessionStorage.getItem('adminSession');
    if (adminSession) {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    const form = document.getElementById('adminLoginForm');
    const username = document.getElementById('adminUsername');
    const password = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('adminLoginBtn');
    const loginText = document.getElementById('adminLoginText');
    const loginSpinner = document.getElementById('adminLoginSpinner');
    const errorDiv = document.getElementById('adminError');
    const errorText = document.getElementById('adminErrorText');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = username.value.trim();
        const pass = password.value.trim();
        
        if (!user || !pass) {
            showError('Please enter username and password');
            return;
        }
        
        // Show loading
        loginBtn.disabled = true;
        loginText.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        errorDiv.classList.add('d-none');
        
        try {
            // Simple admin authentication
            // In production, use proper authentication
            if (user === 'admin@school.com' && pass === 'admin123') {
                sessionStorage.setItem('adminSession', JSON.stringify({
                    username: user,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                }));
                window.location.href = 'admin-dashboard.html';
            } else {
                showError('Invalid username or password');
            }
        } catch (error) {
            showError('Login error: ' + error.message);
        } finally {
            loginBtn.disabled = false;
            loginText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    });
    
    function showError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('d-none');
    }
});