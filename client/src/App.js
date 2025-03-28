import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import './App.css';

function App() {
    // State Management
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [authMode, setAuthMode] = useState('register');

    // Event Handlers
    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Email validation
        const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
        if (!emailPattern.test(email)) {
            setMessage('Email must end with @spelman.edu or @morehouse.edu.');
            return;
        }

        try {
            const response = await axios.post('/register', { name, email, password });
            setMessage(response.data.message || 'Verification code sent!');
            setIsEmailSent(true);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('/login', { email, password });
            
            if (response.data.success) {
                setName(response.data.name || 'User');
                setIsVerified(true);
                setMessage('Login successful!');
            } else {
                setMessage(response.data.message || 'Login failed');
            }
        } catch (error) {
            setMessage('Login error occurred');
        }
    };

    const handleVerifyEmail = async () => {
        try {
            const response = await axios.post('/verify', { email, verificationCode });
            
            if (response.data.success) {
                setIsVerified(true);
                setMessage('Email verified successfully!');
            } else {
                setMessage('Invalid verification code');
            }
        } catch (error) {
            setMessage('Verification failed');
        }
    };

    const handleLogout = () => {
        // Reset all states
        setName('');
        setEmail('');
        setPassword('');
        setVerificationCode('');
        setMessage('');
        setIsEmailSent(false);
        setIsVerified(false);
        setAuthMode('register');
    };

    // Render Landing and Feature Section
    const renderLandingFeatures = () => (
        <div className="landing-section">
            <div className="landing-content">
                <h1>Welcome to Spelman Connect</h1>
                <p className="subtitle">
                    Stay connected with the Spelman College community, 
                    whether you're on or off campus.
                </p>
                
                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Community Groups</h3>
                        <p>Join residence-based groups to connect with peers</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📅</div>
                        <h3>Campus Events</h3>
                        <p>Stay informed about upcoming events and activities</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <h3>Real-time Chat</h3>
                        <p>Communicate with your community in real-time</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render Verification Form
    const renderVerificationForm = () => (
        <div className="auth-section">
            <div className="verification-container">
                <h2>Verify Your Email</h2>
                <p>Enter the verification code sent to your email</p>
                <input
                    type="text"
                    placeholder="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                />
                <button onClick={handleVerifyEmail}>Verify</button>
            </div>
        </div>
    );

    // Render Registration Form
    const renderRegistrationForm = () => (
        <div className="auth-section">
            <form onSubmit={handleRegister} className="auth-form">
                <h2>Create Account</h2>
                <div>
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Register</button>
                <p className="switch-auth">
                    Already have an account? 
                    <span onClick={() => setAuthMode('login')}> Login</span>
                </p>
            </form>
        </div>
    );

    // Render Login Form
    const renderLoginForm = () => (
        <div className="auth-section">
            <form onSubmit={handleLogin} className="auth-form">
                <h2>Welcome Back</h2>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
                <p className="switch-auth">
                    Don't have an account? 
                    <span onClick={() => setAuthMode('register')}> Register</span>
                </p>
            </form>
        </div>
    );

    // Main Render Function
    return (
        <div className="App">
            {!isVerified ? (
                <div className="auth-wrapper">
                    {renderLandingFeatures()}
                    
                    {isEmailSent ? (
                        renderVerificationForm()
                    ) : (
                        authMode === 'register' ? 
                            renderRegistrationForm() : 
                            renderLoginForm()
                    )}
                </div>
            ) : (
                <Dashboard 
                    name={name} 
                    email={email} 
                    onLogout={handleLogout} 
                />
            )}
            
            {message && <div className="message-banner">{message}</div>}
        </div>
    );
}

export default App;