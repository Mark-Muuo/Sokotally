import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../storage/auth';

const ResetPassword = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState('');
	const [ok, setOk] = useState('');

	const onSubmit = (e) => {
		e.preventDefault();
		setError(''); setOk('');
		if (!email || !password || !confirm) return setError('Please fill all fields');
		if (password !== confirm) return setError('Passwords do not match');
		try {
			resetPassword({ email, newPassword: password });
			setOk('Password updated. You can now sign in.');
			setTimeout(() => navigate('/signin'), 1200);
		} catch (e) {
			setError(e.message || 'Could not reset password');
		}
	};

	return (
		<div className="auth-page">
			<form className="auth-card" onSubmit={onSubmit}>
				<h2 style={{ fontSize: '1.6rem' }}>Reset Password</h2>
				{error && <div className="error" role="alert">{error}</div>}
				{ok && (
					<div className="success" style={{background:'#e9f7ef', color:'#1e7e34', padding:'0.7rem 0.9rem', borderRadius:8}} role="status">{ok}</div>
				)}
				<label style={{ fontSize: '1.05rem' }}>Email
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				</label>
				<label style={{ fontSize: '1.05rem' }}>New Password
					<div style={{ display:'flex', alignItems:'center', gap:8 }}>
						<input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
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
				<label style={{ fontSize: '1.05rem' }}>Confirm Password
					<div style={{ display:'flex', alignItems:'center', gap:8 }}>
						<input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
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
				<button className="btn primary" type="submit" style={{ fontSize: '1rem' }}>Update Password</button>
				<p><Link to="/signin">Back to Sign In</Link></p>
			</form>
		</div>
	);
};

export default ResetPassword;


