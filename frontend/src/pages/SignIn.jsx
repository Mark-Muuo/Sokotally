import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
	const { signIn, loading, error } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState({ phone: '', password: '' });
	const [otpMode, setOtpMode] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [otpCode, setOtpCode] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});

	const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (validationErrors[e.target.name]) {
            setValidationErrors({ ...validationErrors, [e.target.name]: '' });
        }
    };

	const handlePasswordLogin = async (e) => {
		e.preventDefault();
		const errors = {};

        if (!form.phone.trim()) errors.phone = 'Phone number is required';
        if (!form.password) errors.password = 'Password is required';        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

		try {
			await signIn({ phone: form.phone.trim(), password: form.password });
			navigate('/dashboard');
		} catch (err) {
            console.error('Sign in error:', err);
        }
	};

	const handleSendOTP = async (e) => {
		e.preventDefault();
		const errors = {};
		if (!form.phone.trim()) errors.phone = 'Phone number is required';
		if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
		try {
			const ok = await useAuth().sendOTP({ phone: form.phone.trim() });
			if (ok) { setOtpSent(true); }
		} catch (err) { }
	};

	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		const errors = {};
		if (!form.phone.trim()) errors.phone = 'Phone number is required';
		if (!otpCode.trim()) errors.otp = 'OTP code is required';
		if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
		try {
			await useAuth().signInWithOTP({ phone: form.phone.trim(), otp: otpCode.trim() });
			navigate('/dashboard');
		} catch (err) { console.error('Verify OTP error:', err); }
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#0e1726] to-[#0b1320] p-6 relative overflow-hidden">
			{/* Subtle animated background glow */}
			<div className="absolute inset-0 opacity-20">
				<div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
			</div>

			{/* Back to Home */}
			<div className="fixed top-0 left-0 right-0 p-6 z-50">
				<Link to="/" className="inline-flex items-center gap-2 text-slate-300 font-medium text-base px-4 py-2 hover:text-white transition-all duration-300">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M15 18l-6-6 6-6"/>
					</svg>
					Back to Home
				</Link>
			</div>

			{/* Form Card */}
			<form onSubmit={handlePasswordLogin} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-10 w-full max-w-md shadow-2xl relative z-10 border border-slate-700/50">
				{/* Logo Header */}
				<div className="text-center mb-8">
				<h1 className="text-4xl font-light text-white mb-2 tracking-wide">
					SokoTally
				</h1>
				<p className="text-slate-400 text-sm font-light">Sign in to your SokoTally account</p>
			</div>

				<h2 className="text-2xl font-light text-white mb-6 text-center">Welcome back</h2>				{error && (
					<div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-light border border-red-500/20 flex items-center gap-3">
						<span className="text-lg flex-shrink-0">⚠️</span>
						<span>{error}</span>
					</div>
				)}
				
				{/* Phone Number */}
				<label className="block mb-5">
					<span className="block mb-2 font-light text-slate-300 text-sm">Phone Number</span>
					<input 
						type="tel" 
						name="phone" 
						value={form.phone} 
						onChange={onChange} 
						placeholder="0712345678 or +254712345678"
						className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
							validationErrors.phone 
								? 'border-red-500/50 focus:border-red-500' 
								: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
						}`}
					/>
					{validationErrors.phone && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.phone}
						</span>
					)}
				</label>

				{/* Password or OTP */}
				{!otpMode && (
				<label className="block mb-5">
					<span className="block mb-2 font-light text-slate-300 text-sm">Password</span>
					<div className="relative flex items-center gap-2">
						<input 
							type={showPassword ? 'text' : 'password'} 
							name="password" 
							value={form.password} 
							onChange={onChange} 
							placeholder="Enter your password"
							className={`flex-1 px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
								validationErrors.password 
									? 'border-red-500/50 focus:border-red-500' 
									: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
							}`}
						/>
						<button 
							type="button" 
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 text-slate-400 text-sm font-light hover:text-slate-200 transition-all duration-200"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							👁
						</button>
					</div>
					{validationErrors.password && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.password}
						</span>
					)}
				</label>
				)}

				{otpMode && (
				<div className="mb-5">
					<span className="block mb-2 font-light text-slate-300 text-sm">Enter the 6-digit code</span>
					<input 
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={otpCode}
						onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0,6))}
						placeholder="123456"
						className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
							validationErrors.otp 
								? 'border-red-500/50 focus:border-red-500' 
								: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
						}`}
					/>
					<p className="text-slate-400 text-xs mt-2">We will send a 6-digit code to your phone.</p>
					{validationErrors.otp && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.otp}
						</span>
					)}
				</div>
				)}

				{/* Simple helpers (hide on OTP mode) */}
				{!otpMode && (
				<div className="flex justify-between items-center mb-6 text-sm">
					<label className="flex items-center gap-2 font-light text-slate-300 cursor-pointer hover:text-white transition-colors">
						<input 
							type="checkbox" 
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="w-4 h-4 cursor-pointer accent-blue-500 bg-slate-800 border-slate-600 rounded"
						/>
						<span>Remember me</span>
					</label>
					<Link to="/reset" className="text-blue-500 font-light hover:text-blue-400 transition-all">
						Forgot password?
					</Link>
				</div>
				)}

				{/* Actions */}
				{!otpMode ? (
					<>
					<button 
						className="w-full px-6 py-3.5 bg-white text-slate-900 text-base font-medium rounded-lg hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading} 
						type="submit"
					>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
					<div className="flex items-center justify-center gap-3 my-4 text-slate-400 text-sm">
						<span className="h-px w-10 bg-slate-700" />
						<span>or</span>
						<span className="h-px w-10 bg-slate-700" />
					</div>
					<button 
						type="button"
						onClick={() => setOtpMode(true)}
						className="w-full px-6 py-3.5 bg-slate-800/60 text-white text-base font-medium rounded-lg hover:bg-slate-800 transition-all duration-200"
					>
						Sign in with OTP
					</button>
					</>
				) : (
					<>
					<div className="flex gap-3">
						<button 
							type="button"
							onClick={handleSendOTP}
							className="flex-1 px-6 py-3.5 bg-white text-slate-900 text-base font-medium rounded-lg hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading || otpSent}
						>
							{otpSent ? 'Code Sent' : 'Send Code'}
						</button>
						<button 
							type="button"
							onClick={handleVerifyOTP}
							className="flex-1 px-6 py-3.5 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading}
						>
							Verify & Sign In
						</button>
					</div>
					{otpSent && (
					  <button 
						type="button"
							onClick={() => { setOtpSent(false); handleSendOTP(new Event('submit')); }}
							className="mt-3 w-full px-6 py-3.5 bg-slate-800/60 text-white text-base font-medium rounded-lg hover:bg-slate-800 transition-all duration-200"
						  >
							Resend Code
					  </button>
					)}
					<button 
						type="button"
						onClick={() => { setOtpMode(false); setOtpSent(false); setOtpCode(''); }}
						className="mt-4 w-full px-6 py-3.5 bg-slate-800/60 text-white text-base font-medium rounded-lg hover:bg-slate-800 transition-all duration-200"
					>
						Use password instead
					</button>
					</>
				)}
				
				{/* Footer */}
				<div className="text-center mt-6 text-slate-400 text-sm font-light">
					<p>
						Don't have an account?{' '}
						<Link to="/signup" className="text-blue-500 font-normal hover:text-blue-400 transition-all">
							Sign up
						</Link>
					</p>
				</div>
			</form>
		</div>
	);
};

export default SignIn;



