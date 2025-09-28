import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
	// Always use English for pre-login pages
	const t = {
		badge: 'Designed for kiosks',
		title: 'Sokotally',
		subtitle: 'Simple bookkeeping for kiosks: record sales, track debts, and see profit.',
		objective1: 'Record sales and expenses in seconds',
		objective2: 'Track customer debts and repayments',
		objective3: 'View daily profit and monthly reports',
		createAccount: 'Create free account',
		signIn: 'Sign in',
		privacy: 'Your records stay on your device — private and secure.'
	};

	return (
		<div className="welcome-hero" role="img" aria-label="Street kiosk with produce">
			<div className="overlay">
				<div className="container">
					<div className="hero">
						<div className="hero-card">
						<span className="badge">{t.badge}</span>
						<header className="hero-header">
							<h1>{t.title}</h1>
							<p>{t.subtitle}</p>
						</header>
						<ul className="objectives" aria-label="Key benefits">
							<li>{t.objective1}</li>
							<li>{t.objective2}</li>
							<li>{t.objective3}</li>
						</ul>
						<div className="cta-buttons">
							<Link className="btn primary" to="/signup">{t.createAccount}</Link>
							<Link className="btn secondary" to="/signin">{t.signIn}</Link>
						</div>
						<p className="subtext">{t.privacy}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Welcome;


