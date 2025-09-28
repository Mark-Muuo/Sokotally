import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
	const { signIn, sendOTP, signInWithOTP, loading, error } = useAuth();
	const navigate = useNavigate();
	const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
	const [form, setForm] = useState({ phone: '', password: '', otp: '' });
	const [showPassword, setShowPassword] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [countdown, setCountdown] = useState(0);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// Start countdown timer for resend OTP
	const startCountdown = () => {
		setCountdown(60);
		const timer = setInterval(() => {
			setCountdown(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	// Send OTP for login
	const handleSendOTP = async (e) => {
		e.preventDefault();
		if (!form.phone) return alert('Phone number is required');
		try {
			await sendOTP({ phone: form.phone });
			setOtpSent(true);
			startCountdown();
		} catch {}
	};

	// Resend OTP
	const resendOTP = async () => {
		if (countdown > 0) return;
		try {
			await sendOTP({ phone: form.phone });
			startCountdown();
		} catch {}
	};

	// Password login
	const handlePasswordLogin = async (e) => {
		e.preventDefault();
		if (!form.phone || !form.password) return alert('Phone and password are required');
		try {
			await signIn({ phone: form.phone, password: form.password });
			navigate('/dashboard');
		} catch {}
	};

	// OTP login
	const handleOTPLogin = async (e) => {
		e.preventDefault();
		if (!form.phone || !form.otp) return alert('Phone and OTP are required');
		try {
			await signInWithOTP({ phone: form.phone, otp: form.otp });
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
			<form className="auth-card" onSubmit={loginMode === 'password' ? handlePasswordLogin : (otpSent ? handleOTPLogin : handleSendOTP)}>
				<h2>Sign In</h2>
				{error && <div className="error">{error}</div>}
				
				{/* Login Mode Toggle */}
				<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
					<button 
						type="button"
						className={`btn ${loginMode === 'password' ? 'primary' : ''}`}
						onClick={() => {
							setLoginMode('password');
							setOtpSent(false);
							setForm({ ...form, otp: '' });
						}}
						style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
					>
						Password
					</button>
					<button 
						type="button"
						className={`btn ${loginMode === 'otp' ? 'primary' : ''}`}
						onClick={() => {
							setLoginMode('otp');
							setOtpSent(false);
							setForm({ ...form, password: '' });
						}}
						style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
					>
						OTP
					</button>
				</div>

				{/* Phone Number - Always shown */}
				<label>Phone Number<input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="0712345678 or +254712345678" /></label>

				{/* Password Field - Only shown in password mode */}
				{loginMode === 'password' && (
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
				)}

				{/* OTP Field - Only shown in OTP mode after OTP is sent */}
				{loginMode === 'otp' && otpSent && (
					<>
						<div style={{ marginBottom: '1rem', textAlign: 'center' }}>
							<p style={{ fontSize: '1rem', color: '#666' }}>
								We sent a 6-digit code to <strong>{form.phone}</strong>
							</p>
						</div>
						<label>Enter OTP
							<input 
								type="text" 
								name="otp" 
								value={form.otp} 
								onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} 
								placeholder="123456"
								maxLength="6"
								style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
							/>
						</label>
					</>
				)}

				{/* Submit Button */}
				<button className="btn primary" disabled={loading} type="submit">
					{loginMode === 'password' ? 'Sign In' : (otpSent ? 'Sign In' : 'Send OTP')}
				</button>

				{/* OTP Resend and Change Phone - Only shown in OTP mode after OTP is sent */}
				{loginMode === 'otp' && otpSent && (
					<div style={{ textAlign: 'center' }}>
						{countdown > 0 ? (
							<p style={{ fontSize: '0.9rem', color: '#666' }}>
								Resend OTP in {countdown}s
							</p>
						) : (
							<button 
								type="button" 
								className="btn" 
								onClick={resendOTP}
								style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
							>
								Resend OTP
							</button>
						)}
						<button 
							type="button" 
							className="btn" 
							onClick={() => setOtpSent(false)}
							style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}
						>
							Change Phone Number
						</button>
					</div>
				)}

				{/* Links */}
				{loginMode === 'password' && <p><Link to="/reset">Forgot password?</Link></p>}
				<p>New here? <Link to="/signup">Create an account</Link></p>
			</form>
		</div>
	);
};

export default SignIn;


