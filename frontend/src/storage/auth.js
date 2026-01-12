import { API_BASE } from '../config/api.js';

export async function apiRegister({ firstName, lastName, phone, password }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, password })
	});
	if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
	return res.json();
}

export async function apiLogin({ phone, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ phone, password })
	});
	if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
	return res.json();
}

export function saveToken(token) {
	localStorage.setItem('sokotally_token', token);
}

export function getToken() {
	return localStorage.getItem('sokotally_token');
}

export function clearToken() {
	localStorage.removeItem('sokotally_token');
}

// Check if token is expired
export function isTokenExpired(token) {
	if (!token) return true;
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		const currentTime = Date.now() / 1000;
		return payload.exp < currentTime;
	} catch {
		return true;
	}
}

// Get token with expiration check
export function getValidToken() {
	const token = getToken();
	if (!token || isTokenExpired(token)) {
		clearToken();
		return null;
	}
	return token;
}

const USERS_KEY = 'sokotally_users_v1';
const SESSION_KEY = 'sokotally_session_v1';

function loadUsers() {
	try {
		const raw = localStorage.getItem(USERS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveUsers(users) {
	localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser({ name, email, password }) {
	const users = loadUsers();
	if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
		throw new Error('Email already registered');
	}
	const user = { id: crypto.randomUUID(), name, email, password };
	users.push(user);
	saveUsers(users);
	return user;
}

export function loginUser({ email, password }) {
	const users = loadUsers();
	const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
	if (!user) throw new Error('Invalid credentials');
	localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
	return user;
}

export async function resetPassword({ phone, newPassword }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ phone, newPassword })
	});
	if (!res.ok) throw new Error((await res.json()).error || 'Password reset failed');
	return res.json();
}

export async function sendOTP({ phone }) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ phone })
	});
	const contentType = res.headers.get('content-type') || '';
	if (!res.ok) {
		let message = 'Failed to send OTP';
		try {
			if (contentType.includes('application/json')) {
				const data = await res.json();
				message = data.error || message;
			} else {
				// Read text (likely HTML) to avoid JSON parse crash
				await res.text();
				message = `${message}. Server responded with ${res.status}`;
			}
		} catch {}
		throw new Error(message);
	}
	if (contentType.includes('application/json')) return res.json();
	// Fallback if server responds without JSON
	return { ok: true };
}

export async function verifyOTPLogin({ phone, otp }) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ phone, otp })
	});
	const contentType = res.headers.get('content-type') || '';
	if (!res.ok) {
		let message = 'OTP verification failed';
		try {
			if (contentType.includes('application/json')) {
				const data = await res.json();
				message = data.error || message;
			} else {
				await res.text();
				message = `${message}. Server responded with ${res.status}`;
			}
		} catch {}
		throw new Error(message);
	}
	if (!contentType.includes('application/json')) {
		throw new Error('Unexpected server response. Ensure OTP API returns JSON.');
	}
	return res.json();
}

export async function getProfile() {
	const token = getValidToken();
	if (!token) {
		clearToken();
		throw new Error('No valid token available');
	}
	
	try {
		const res = await fetch(`${API_BASE}/auth/me`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		});
		const contentType = res.headers.get('content-type') || '';
		if (!res.ok) {
			let message = 'Failed to load profile';
			try {
				if (contentType.includes('application/json')) {
					const data = await res.json();
					message = data.error || message;
					// Handle token expiration or unauthorized access
					if (data.code === 'TOKEN_EXPIRED' || res.status === 401 || res.status === 403) {
						clearToken();
						throw new Error('401: Session expired. Please sign in again.');
					}
				} else {
					await res.text();
					message = `${message}. Server responded with ${res.status}`;
					// Only clear token for auth errors, not network/server errors
					if (res.status === 401 || res.status === 403) {
						clearToken();
						throw new Error(`${res.status}: Authentication failed`);
					}
				}
			} catch (e) {
				if (e.message.includes('401') || e.message.includes('403') || e.message.includes('Session expired')) throw e;
			}
			throw new Error(message);
		}
		if (!contentType.includes('application/json')) throw new Error('Unexpected profile response');
		return res.json();
	} catch (e) {
		// Only clear token for authentication errors, not network errors
		if (e.message?.includes('401') || e.message?.includes('403') || e.message?.includes('Session expired')) {
			throw e;
		}
		// For network errors, keep the token and let the user stay logged in
		throw new Error('Network error. Please check your connection.');
	}
}

export async function updateProfile(payload) {
	const token = getValidToken();
	if (!token) {
		clearToken();
		throw new Error('No valid token available');
	}
	
    const res = await fetch(`${API_BASE}/auth/profile`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(payload)
	});
	const contentType = res.headers.get('content-type') || '';
	if (!res.ok) {
		let message = 'Failed to update profile';
		try {
			if (contentType.includes('application/json')) {
				const data = await res.json();
				message = data.error || message;
				// Handle token expiration
				if (data.code === 'TOKEN_EXPIRED') {
					clearToken();
					throw new Error('Session expired. Please sign in again.');
				}
			} else {
				await res.text();
				message = `${message}. Server responded with ${res.status}`;
			}
		} catch (e) {
			if (e.message.includes('Session expired')) throw e;
		}
		throw new Error(message);
	}
	if (!contentType.includes('application/json')) throw new Error('Unexpected update response');
	return res.json();
}

// Refresh token function
export async function refreshToken() {
	const token = getToken();
	if (!token) {
		throw new Error('No token to refresh');
	}
	
    const res = await fetch(`${API_BASE}/auth/refresh`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});
	
	if (!res.ok) {
		clearToken();
		throw new Error('Token refresh failed');
	}
	
	const data = await res.json();
	saveToken(data.token);
	return data.token;
}

export function getCurrentUser() {
	try {
		const sessRaw = localStorage.getItem(SESSION_KEY);
		if (!sessRaw) return null;
		const { userId } = JSON.parse(sessRaw);
		const users = loadUsers();
		return users.find(u => u.id === userId) || null;
	} catch {
		return null;
	}
}

export function logoutUser() {
	localStorage.removeItem(SESSION_KEY);
}


