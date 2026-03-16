import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Layers } from "lucide-react";
import FallingStars from "./FallingStar";
import './Auth.css';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', //important=> include cookies in request
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            console.log("response from backend ", data);

            if (data.message && data.message.toLowerCase().includes('successful')) {
                navigate('/');
            } else {
                setMessage(data.message || data.Error || "Login failed");
            }
        } catch (err) {
            console.log("Error", err);
            setMessage("Login failed. Please try again.");
        }
    };

    return (
        <>
            <div className="auth-wrapper">
                <FallingStars />
                <div className="auth-card">
                    {/* Logo */}
                    <div className="auth-logo">
                        <div className="logo-icon">
                            <Layers size={32} strokeWidth={2} />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="auth-header">
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to your account or create a new one</p>
                    </div>

                    {/* Tab Toggle */}
                    <div className="auth-tabs">
                        <button className="auth-tab active">Login</button>
                        <Link to="/signup" style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="auth-tab" style={{ width: '100%' }}>Sign Up</button>
                        </Link>
                    </div>

                    {/* Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input
                                    className="auth-input"
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    className="auth-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff key="eyeoff" size={20} />
                                        : <Eye key="eye" size={20} />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" className="submit-btn">
                            Sign In
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    {/* Message */}
                    {message && (
                        <div className="message error">
                            {message}
                        </div>
                    )}
                </div>

                {/* Branding */}
                <div className="auth-branding">
                    <div className="auth-branding-logo">
                        CP<span>Pro</span>
                    </div>
                    <p className="auth-branding-tagline">Master Competitive Programming</p>
                </div>
            </div>
        </>
    );
}