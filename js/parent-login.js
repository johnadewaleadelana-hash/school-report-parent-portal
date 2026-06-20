// js/parent-login.js
// ============================================
// Parent Login Logic
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const storedStudent = sessionStorage.getItem('parentStudent');
    if (storedStudent) {
        try {
            const student = JSON.parse(storedStudent);
            if (student && student['Student ID']) {
                window.location.href = 'parent-dashboard.html';
                return;
            }
        } catch (e) {
            sessionStorage.removeItem('parentStudent');
        }
    }
    
    // DOM Elements
    const form = document.getElementById('pinForm');
    const classSelect = document.getElementById('classSelect');
    const pinInput = document.getElementById('pinInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const togglePin = document.getElementById('togglePin');
    const pinToggleIcon = document.getElementById('pinToggleIcon');
    
    // Toggle PIN visibility
    togglePin.addEventListener('click', function() {
        if (pinInput.type === 'password') {
            pinInput.type = 'text';
            pinToggleIcon.className = 'fas fa-eye-slash';
        } else {
            pinInput.type = 'password';
            pinToggleIcon.className = 'fas fa-eye';
        }
    });
    
    // Auto-format PIN: only allow numbers
    pinInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const className = classSelect.value;
        const pin = pinInput.value.trim();
        
        // Validate inputs
        if (!className) {
            showError('Please select your child\'s class');
            return;
        }
        
        if (pin.length !== 6) {
            showError('Please enter a valid 6-digit PIN');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginText.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        hideError();
        
        try {
            // Validate PIN
            const result = await api.validatePin(pin, className);
            
            if (result.valid) {
                // Store student data
                sessionStorage.setItem('parentStudent', JSON.stringify(result.student));
                sessionStorage.setItem('parentPin', pin);
                sessionStorage.setItem('parentClass', className);
                
                // Redirect to dashboard
                window.location.href = 'parent-dashboard.html';
            } else {
                showError(result.message || 'Invalid PIN. Please try again.');
            }
        } catch (error) {
            showError(error.message || 'Unable to validate PIN. Please try again.');
        } finally {
            // Reset button
            loginBtn.disabled = false;
            loginText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    });
    
    // Helper functions
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
    }
    
    function hideError() {
        errorMessage.classList.add('d-none');
    }
});