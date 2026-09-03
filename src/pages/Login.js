import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/App login.json';
import womanImg from '../assets/women with tab 1.png';
import '../styles/Login.css';


const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // const defaultOptions = {
    //     loop: true,
    //     autoplay: true,
    //     animationData: animationData,
    //     rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    // };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // role based
                
                if (data.user.role === "company") {
                    navigate('/admin');
                } else if (data.user.role === "superadmin") {
                    navigate('/superadmin');
                } else {
                    navigate('/');
                    alert("Access denied: Unsupported role.");
                }

            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError('Server error. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div className="login-left">
                <div className="login-form-wrapper">

                    <div className="login-lottie">
                        {/* <Lottie options={defaultOptions} height={110} width={110} /> */}
                        <Lottie animationData={animationData} style={{ width: "110px", height: "110px" }} />
                    </div>

                    <h1 className="login-title">LOGIN</h1>
                    <p className="login-subtitle">Welcome back! Please sign in to continue.</p>

                    {error && <div className="login-error">{error}</div>}

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-groupss">
                            <div className="input-icon-wrapper">
                                <span className="input-icon">
                                </span>
                                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required />
                            </div>
                        </div>

                        <div className="form-groupss">
                            <div className="input-icon-wrapper">
                                <span className="input-icon">
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-submit-btn" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Login Now'}
                        </button>
                    </form>

                </div>
            </div>





            {/* ══════════════ RIGHT PANEL ══════════════ */}
            <div className="login-right">

                {/* Wavy SVG background */}
                <svg className="right-wavy-bg" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                    <ellipse cx="620" cy="120" rx="320" ry="220" fill="rgba(255,255,255,0.07)" />
                    <ellipse cx="80" cy="600" rx="280" ry="200" fill="rgba(255,255,255,0.06)" />
                    <ellipse cx="350" cy="350" rx="500" ry="180" fill="rgba(255,255,255,0.04)" />
                </svg>

                {/* Inner promo area */}
                <div className="promo-content">

                    {/* Card — girl overflows out of the top-right */}
                    <div className="promo-card">

                        {/* Girl image — floats above and to the right of the card */}
                        <img src={womanImg} alt="Professional" className="woman-img" />

                        {/* Text — top-left of card */}
                        <div className="promo-card-text">
                            <p className="promo-text">
                                Very good works are<br />
                                waiting for you<br />
                                <strong>Login Now!!!</strong>
                            </p>
                        </div>

                    </div>

                    {/* Lightning badge — left of card, vertically centered */}
                    <div className="lightning-badge">
                        <svg width="22" height="22" viewBox="0 0 24 24"
                            fill="#f6c90e" stroke="#f6c90e" strokeWidth="1"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Login;