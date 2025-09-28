import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { apiLogin, apiRegister, saveToken, clearToken, sendOTP, verifyOTPLogin, getProfile, updateProfile, getValidToken, isTokenExpired, refreshToken } from '../storage/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Check for valid token on app load
	useEffect(() => {
		const checkAuthStatus = async () => {
			const token = getValidToken();
			if (token) {
				try {
					const me = await getProfile();
					setUser(me.user || me);
				} catch (e) {
					// Token is invalid or expired, clear it
					clearToken();
					setUser(null);
				}
			}
		};
		checkAuthStatus();
	}, []);

	// Set up token expiration check and refresh
	useEffect(() => {
		const checkAndRefreshToken = async () => {
			const token = getValidToken();
			if (!token && user) {
				// Token expired, sign out user
				setUser(null);
				return;
			}
			
			// If token exists but is close to expiration (within 1 hour), try to refresh
			if (token && !isTokenExpired(token)) {
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					const currentTime = Date.now() / 1000;
					const timeUntilExpiry = payload.exp - currentTime;
					
					// If token expires within 1 hour, refresh it
					if (timeUntilExpiry < 3600 && timeUntilExpiry > 0) {
						await refreshToken();
					}
				} catch (e) {
					// If we can't parse the token, it's invalid
					clearToken();
					setUser(null);
				}
			}
		};

		// Check every 30 minutes
		const interval = setInterval(checkAndRefreshToken, 1800000);
		return () => clearInterval(interval);
	}, [user]);

	const value = useMemo(() => ({
		user, loading, error,
		signUp: async ({ name, phone, password }) => {
			setLoading(true); setError('');
			try {
				await apiRegister({ name, phone, password });
				// Do not auto-login on signup; user should sign in explicitly
				return true;
			} catch (e) { setError(e.message || 'Registration failed'); throw e; }
			finally { setLoading(false); }
		},
		signIn: async ({ phone, password }) => {
			setLoading(true); setError('');
			try {
				const { token } = await apiLogin({ phone, password });
				saveToken(token);
				const me = await getProfile();
				setUser(me.user || me);
				return me.user || me;
			} catch (e) { 
				setError(e.message || 'Login failed'); 
				// Clear token if login failed
				clearToken();
				throw e; 
			}
			finally { setLoading(false); }
		},
		sendOTP: async ({ phone }) => {
			setLoading(true); setError('');
			try {
				await sendOTP({ phone });
				return true;
			} catch (e) { setError(e.message || 'Failed to send OTP'); throw e; }
			finally { setLoading(false); }
		},
		signInWithOTP: async ({ phone, otp }) => {
			setLoading(true); setError('');
			try {
				const { token } = await verifyOTPLogin({ phone, otp });
				saveToken(token);
				const me = await getProfile();
				setUser(me.user || me);
				return me.user || me;
			} catch (e) { 
				setError(e.message || 'OTP verification failed'); 
				// Clear token if OTP verification failed
				clearToken();
				throw e; 
			}
			finally { setLoading(false); }
		},
		refreshProfile: async () => {
			setLoading(true); setError('');
			try {
				const me = await getProfile();
				setUser(me.user || me);
				return me.user || me;
			} catch (e) { 
				setError(e.message || 'Failed to load profile'); 
				// If token expired, sign out user
				if (e.message.includes('Session expired')) {
					setUser(null);
				}
				throw e; 
			}
			finally { setLoading(false); }
		},
		updateProfile: async (payload) => {
			setLoading(true); setError('');
			try {
				const res = await updateProfile(payload);
				const me = await getProfile();
				setUser(me.user || me);
				return res;
			} catch (e) { 
				setError(e.message || 'Failed to update profile'); 
				// If token expired, sign out user
				if (e.message.includes('Session expired')) {
					setUser(null);
				}
				throw e; 
			}
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

