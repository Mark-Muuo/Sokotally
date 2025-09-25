import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../storage/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => getCurrentUser());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		setUser(getCurrentUser());
	}, []);

	const value = useMemo(() => ({
		user,
		loading,
		error,
		signUp: async ({ name, email, password }) => {
			setLoading(true); setError('');
			try {
				const u = registerUser({ name, email, password });
				setUser(u);
				return u;
			} catch (e) {
				setError(e.message || 'Registration failed');
				throw e;
			} finally { setLoading(false); }
		},
		signIn: async ({ email, password }) => {
			setLoading(true); setError('');
			try {
				const u = loginUser({ email, password });
				setUser(u);
				return u;
			} catch (e) {
				setError(e.message || 'Login failed');
				throw e;
			} finally { setLoading(false); }
		},
		signOut: () => { logoutUser(); setUser(null); }
	}), [user, loading, error]);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);


