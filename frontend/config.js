(function () {
    const backendBaseUrl = window.location.origin;
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