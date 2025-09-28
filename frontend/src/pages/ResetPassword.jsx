import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../storage/auth';

const ResetPassword = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: new password
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState('');
	const [ok, setOk] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [countdown, setCountdown] = useState(0);

	// Always use English for pre-login pages
	const t = {
		title: 'Reset Password',
		subtitle: 'Enter your phone number to receive a reset code',
		phone: 'Phone Number',
		sendCode: 'Send Code',
		enterCode: 'Enter the code sent to your phone',
		code: 'Verification Code',
		resend: 'Resend Code',
		newPassword: 'Enter your new password',
		password: 'New Password',
		confirm: 'Confirm Password',
		reset: 'Reset Password',
		backToSignIn: 'Back to Sign In',
		codeSent: 'Code sent to your phone',
		passwordReset: 'Password reset successfully',
		invalidCode: 'Invalid verification code',
		passwordsMatch: 'Passwords do not match'
	};

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

	// Send OTP to phone number
	const sendOTP = async (e) => {
		e.preventDefault();
		setError(''); setOk('');
		if (!phone) return setError('Please enter your phone number');
		
		// TODO: Implement actual OTP sending logic
		console.log('Sending OTP to:', phone);
		setOtpSent(true);
		setStep(2);
		startCountdown();
		setOk('OTP sent to your phone number');
	};

	// Verify OTP
	const verifyOTP = async (e) => {
		e.preventDefault();
		setError(''); setOk('');
		if (!otp) return setError('Please enter the OTP');
		if (otp.length !== 6) return setError('OTP must be 6 digits');
		
		// TODO: Implement actual OTP verification logic
		console.log('Verifying OTP:', otp);
		setStep(3);
		setOk('OTP verified successfully');
	};

	// Resend OTP
	const resendOTP = async () => {
		if (countdown > 0) return;
		setError(''); setOk('');
		
		// TODO: Implement actual OTP resending logic
		console.log('Resending OTP to:', phone);
		startCountdown();
		setOk(t.codeSent);
	};

	// Final password reset submission
	const onSubmit = async (e) => {
		e.preventDefault();
		setError(''); setOk('');
		if (!password || !confirm) return setError('Please fill all fields');
		if (password !== confirm) return setError(t.passwordsMatch);
		try {
			await resetPassword({ phone, newPassword: password });
			setOk(t.passwordReset);
			setTimeout(() => navigate('/signin'), 1200);
		} catch (e) {
			setError(e.message || 'Could not reset password');
		}
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
		<form className="auth-card" onSubmit={step === 1 ? sendOTP : step === 2 ? verifyOTP : onSubmit}>
			<h2 style={{ fontSize: '1.6rem' }}>{t.title}</h2>
			<p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>{t.subtitle}</p>
			{error && <div className="error" role="alert">{error}</div>}
			{ok && (
				<div className="success" style={{background:'#e9f7ef', color:'#1e7e34', padding:'0.7rem 0.9rem', borderRadius:8}} role="status">{ok}</div>
			)}

			{/* Step 1: Phone */}
			{step === 1 && (
				<label style={{ fontSize: '1.05rem' }}>{t.phone}
					<input 
						type="tel" 
						value={phone} 
						onChange={(e) => setPhone(e.target.value)} 
						placeholder="0712345678 or +254712345678" 
						disabled={otpSent}
					/>
				</label>
			)}

			{/* Step 2: OTP */}
			{step === 2 && (
				<>
					<div style={{ marginBottom: '0.25rem', textAlign: 'center' }}>
						<p style={{ fontSize: '1rem', color: '#666' }}>
							{t.enterCode} <strong>{phone}</strong>
						</p>
					</div>
					<label style={{ fontSize: '1.05rem' }}>{t.code}
						<input 
							type="text" 
							value={otp} 
							onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
							placeholder="123456"
							maxLength="6"
							style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
						/>
					</label>
					<div style={{ textAlign: 'center' }}>
						{countdown > 0 ? (
							<p style={{ fontSize: '0.9rem', color: '#666' }}>
								{t.resend} in {countdown}s
							</p>
						) : (
							<button 
								type="button" 
								className="btn" 
								onClick={resendOTP}
								style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
							>
								{t.resend}
							</button>
						)}
					</div>
					<button 
						type="button" 
						className="btn" 
						onClick={() => setStep(1)}
						style={{ fontSize: '0.9rem' }}
					>
						Change Phone Number
					</button>
				</>
			)}

			{/* Step 3: New Password */}
			{step === 3 && (
				<>
					<div style={{ marginBottom: '0.25rem', textAlign: 'center' }}>
						<p style={{ fontSize: '1rem', color: '#666' }}>
							{t.newPassword} <strong>{phone}</strong>
						</p>
					</div>
					<label style={{ fontSize: '1.05rem' }}>{t.password}
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
					<label style={{ fontSize: '1.05rem' }}>{t.confirm}
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
				</>
			)}

			{/* Submit */}
			<button className="btn primary" type="submit" style={{ fontSize: '1rem' }}>
				{step === 1 ? t.sendCode : step === 2 ? 'Verify OTP' : t.reset}
			</button>

			{/* Footer links */}
			<p><Link to="/signin">{t.backToSignIn}</Link></p>
		</form>
	</div>
);
};

export default ResetPassword;


