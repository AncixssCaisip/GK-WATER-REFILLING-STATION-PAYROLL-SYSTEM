// Talks to the backend
const BASE = '/api';

export async function api(path, method = 'GET', body) {
    const response = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Something went wrong.');
    return data;
}

// runs a save action and returns the error text (or nothing) so the modal can show it
export const attempt = async (fn) => {
    try { await fn(); } catch (e) { return e.message; }
};

export const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const today = () => new Date().toLocaleDateString('en-CA');
