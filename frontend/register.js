console.log("REGISTER JS DIRECT REDIRECT");
const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        let result = {};
        try {
            result = await response.json();
        } catch (e) {
            console.log('REGISTER json parse failed');
        }

        console.log('REGISTER status:', response.status);
        console.log('REGISTER result:', result);

        if (response.ok) {
           window.location.href = 'http://127.0.0.1:5500/frontend/login.html?registered=1';
            return;
        }

        showMessage(result.error || 'Registration failed.', 'danger');
    } catch (err) {
        console.error('Register Error:', err);
        showMessage('Server unreachable.', 'danger');
    }
}