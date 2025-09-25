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

export function resetPassword({ email, newPassword }) {
	const users = loadUsers();
	const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
	if (idx === -1) throw new Error('No account found for this email');
	users[idx] = { ...users[idx], password: newPassword };
	saveUsers(users);
	return true;
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


