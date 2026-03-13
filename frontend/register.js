const BACKEND_BASE_URL = window.AppConfig.backendBaseUrl;

document.addEventListener('DOMContentLoaded', async () => {
    await window.AppUtils.ensureCsrfCookie();

    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', handleRegister);
    }
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

async function handleRegister(event) {
    event.preventDefault();

    const payload = {
        username: document.getElementById('username').value.trim(),
        password1: document.getElementById('password1').value,
        password2: document.getElementById('password2').value
    };

    if (!payload.username || !payload.password1 || !payload.password2) {
        showMessage('Please complete all fields.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/register/`, {
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
            window.location.href = 'login.html?registered=1';
            return;
        }

        showMessage(result.error || 'Registration failed.', 'danger');
    } catch (err) {
        console.error('Register Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}
