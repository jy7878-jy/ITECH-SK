(function () {
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const backendBaseUrl = window.__APP_BACKEND_BASE_URL__ || (isLocal ? 'http://127.0.0.1:8000' : 'https://itech-sk.onrender.com');

    const apiBaseUrl = `${backendBaseUrl}/api`;

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return '';
    }

    async function ensureCsrfCookie() {
        await fetch(`${apiBaseUrl}/csrf/`, {
            method: 'GET',
            credentials: 'include'
        });
    }

    window.AppConfig = {
        backendBaseUrl,
        apiBaseUrl,
        habitsApiBaseUrl: `${apiBaseUrl}/habits`
    };

    window.AppUtils = {
        getCsrfToken: () => getCookie('csrftoken'),
        ensureCsrfCookie
    };
})();