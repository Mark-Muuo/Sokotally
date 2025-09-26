import React, { createContext, useContext, useMemo, useState } from 'react';
import { apiLogin, apiRegister, saveToken, clearToken } from '../storage/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const value = useMemo(() => ({
		user, loading, error,
		signUp: async ({ name, email, password }) => {
			setLoading(true); setError('');
			try {
				await apiRegister({ name, email, password });
				// Do not auto-login on signup; user should sign in explicitly
				return true;
			} catch (e) { setError(e.message || 'Registration failed'); throw e; }
			finally { setLoading(false); }
		},
		signIn: async ({ email, password }) => {
			setLoading(true); setError('');
			try {
				const { token, user } = await apiLogin({ email, password });
				saveToken(token);
				setUser(user);
				return user;
			} catch (e) { setError(e.message || 'Login failed'); throw e; }
			finally { setLoading(false); }
		},
		signOut: () => { clearToken(); setUser(null); }
	}), [user, loading, error]);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

