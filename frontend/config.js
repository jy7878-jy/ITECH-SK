(function () {
    const PROD_BACKEND_URL = 'https://itech-sk.onrender.com';
    const configuredBackend = document.body?.dataset?.backendBaseUrl;
    const backendBaseUrl = PROD_BACKEND_URL || configuredBackend || `${window.location.protocol}//${window.location.hostname}:8000`;
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