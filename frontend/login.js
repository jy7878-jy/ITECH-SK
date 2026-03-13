const BACKEND_BASE_URL = window.AppConfig.backendBaseUrl;

document.addEventListener('DOMContentLoaded', async () => {
    await window.AppUtils.ensureCsrfCookie();

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
        window.history.replaceState({}, document.title, window.location.pathname);
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
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.AppUtils.getCsrfToken()
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = 'index.html';
            return;
        }

        showMessage(result.error || 'Login failed.', 'danger');
    } catch (err) {
        console.error('Login Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}
