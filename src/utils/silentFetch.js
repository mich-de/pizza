const TIMEOUT = 5000;

export function silentFetch(url, options = {}) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url, true);
        xhr.timeout = TIMEOUT;
        xhr.withCredentials = options.credentials === 'include';

        const headers = options.headers || {};
        Object.keys(headers).forEach((key) => {
            xhr.setRequestHeader(key, headers[key]);
        });

        xhr.onload = () => {
            const ok = xhr.status >= 200 && xhr.status < 300;
            resolve({
                ok,
                status: xhr.status,
                json: () => {
                    try {
                        return Promise.resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
                    } catch (e) {
                        return Promise.resolve(null);
                    }
                }
            });
        };

        xhr.onerror = () => resolve({ ok: false, status: 0, json: () => Promise.resolve(null) });
        xhr.ontimeout = () => resolve({ ok: false, status: 0, json: () => Promise.resolve(null) });

        xhr.send(options.body || null);
    });
}
