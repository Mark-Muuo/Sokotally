import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
	const { signIn, loading, error } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '' });
	const [showPassword, setShowPassword] = useState(false);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		if (!form.email || !form.password) return alert('Email and password are required');
		try {
			await signIn({ email: form.email, password: form.password });
			navigate('/dashboard');
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
				<h2>Sign In</h2>
				{error && <div className="error">{error}</div>}
				<label>Email<input type="email" name="email" value={form.email} onChange={onChange} /></label>
				<label>Password
					<div style={{ display:'flex', alignItems:'center', gap:8 }}>
						<input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} />
						<button type="button" className="btn" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'} style={{ padding: '0.3rem 0.5rem' }}>
							{showPassword ? (
								// eye-off icon
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.16 18.16 0 0 1 5.06-6.94"/>
									<path d="M1 1l22 22"/>
									<path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.14 18.14 0 0 1-3.16 4.19"/>
									<path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
								</svg>
							) : (
								// eye icon
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							)}
						</button>
					</div>
				</label>
				<button className="btn primary" disabled={loading} type="submit">Sign In</button>
				<p><Link to="/reset">Forgot password?</Link></p>
				<p>New here? <Link to="/signup">Create an account</Link></p>
			</form>
		</div>
	);
};

export default SignIn;


