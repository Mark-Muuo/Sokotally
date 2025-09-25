import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
	return (
		<div className="welcome-hero" role="img" aria-label="Street kiosk with produce">
			<div className="overlay">
				<div className="container">
					<div className="hero">
						<div className="hero-card">
						<span className="badge">Designed for kiosks</span>
						<header className="hero-header">
							<h1>Sokotally</h1>
							<p>Simple bookkeeping for kiosks: record sales, track debts, and see profit.</p>
						</header>
						<ul className="objectives" aria-label="Key benefits">
							<li>Record sales and expenses in seconds</li>
							<li>Track customer debts and repayments</li>
							<li>View daily profit and monthly reports</li>
						</ul>
						<div className="cta-buttons">
							<Link className="btn primary" to="/signup">Create free account</Link>
							<Link className="btn secondary" to="/signin">Sign in</Link>
						</div>
						<p className="subtext">Your records stay on your device — private and secure.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Welcome;


