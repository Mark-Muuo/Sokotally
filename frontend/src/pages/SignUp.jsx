import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
	const { signUp, loading, error } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '' });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// Always use English for pre-login pages
	const t = {
		title: 'Create Account',
		subtitle: 'Sign up to start managing your kiosk records',
		name: 'Full Name',
		phone: 'Phone Number',
		password: 'Password',
		confirm: 'Confirm Password',
		signUp: 'Sign Up',
		haveAccount: 'Already have an account?',
		signIn: 'Sign In',
		allFieldsRequired: 'All fields are required',
		passwordsMatch: 'Passwords do not match'
	};

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		if (!form.name || !form.phone || !form.password) return alert(t.allFieldsRequired);
		if (form.password !== form.confirm) return alert(t.passwordsMatch);
		try {
			await signUp({ name: form.name, phone: form.phone, password: form.password });
			navigate('/signin');
		} catch {}
	};

	return (
		<div className="auth-page">
			<div className="auth-topbar">
				<Link to="/" className="auth-home-link" aria-label="Back to Home" title="Back to Home">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
						<path d="M15 18l-6-6 6-6"/>
					</svg>
					Home
				</Link>
			</div>
			<form className="auth-card" onSubmit={onSubmit}>
				<h2>{t.title}</h2>
				<p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>{t.subtitle}</p>
				{error && <div className="error">{error}</div>}
				<label>{t.name}<input name="name" value={form.name} onChange={onChange} /></label>
				<label>{t.phone}<input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="0712345678 or +254712345678" /></label>
				<label>{t.password}
					<div style={{ display:'flex', alignItems:'center', gap:8 }}>
						<input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} />
						<button type="button" className="btn" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'} style={{ padding: '0.3rem 0.5rem' }}>
							{showPassword ? (
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.16 18.16 0 0 1 5.06-6.94"/>
									<path d="M1 1l22 22"/>
									<path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.14 18.14 0 0 1-3.16 4.19"/>
									<path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
								</svg>
							) : (
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							)}
						</button>
					</div>
				</label>
				<label>{t.confirm}
					<div style={{ display:'flex', alignItems:'center', gap:8 }}>
						<input type={showConfirm ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={onChange} />
						<button type="button" className="btn" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} title={showConfirm ? 'Hide confirm password' : 'Show confirm password'} style={{ padding: '0.3rem 0.5rem' }}>
							{showConfirm ? (
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.16 18.16 0 0 1 5.06-6.94"/>
									<path d="M1 1l22 22"/>
									<path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.14 18.14 0 0 1-3.16 4.19"/>
									<path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
								</svg>
							) : (
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							)}
						</button>
					</div>
				</label>
				<button className="btn primary" disabled={loading} type="submit">{t.signUp}</button>
				<p>{t.haveAccount} <Link to="/signin">{t.signIn}</Link></p>
			</form>
		</div>
	);
};

export default SignUp;


