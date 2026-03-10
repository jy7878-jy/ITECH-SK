console.log("LOGIN JS DIRECT REDIRECT");
const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }

    showRegisteredMessageIfNeeded();
});

function showMessage(message, type = 'danger') {
    const box = document.getElementById('messageBox');
    if (!box) {
        alert(message);
        return;
    }

    box.className = `alert alert-${type}`;
    box.textContent = message;
    box.classList.remove('d-none');
}

function showRegisteredMessageIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
        showMessage('Registration successful. Please log in.', 'success');

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const payload = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };

    if (!payload.username || !payload.password) {
        showMessage('Please enter both username and password.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        let result = {};
        try {
            result = await response.json();
        } catch (e) {
            console.log('LOGIN json parse failed');
        }

        console.log('LOGIN status:', response.status);
        console.log('LOGIN result:', result);

        if (response.ok) {
            window.location.href = 'http://127.0.0.1:5500/frontend/index.html';
            return;
        }

        showMessage(result.error || 'Login failed.', 'danger');
    } catch (err) {
        console.error('Login Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}