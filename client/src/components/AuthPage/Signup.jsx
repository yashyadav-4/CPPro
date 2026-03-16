import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Layers } from "lucide-react";
import FallingStars from "./FallingStar";
import './Auth.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.email || !formData.password || !formData.name) return;

            const response = await fetch('/api/auth/signup', {
                method: "POST",
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            console.log('Response from backend: ', data);
            
            if (response.ok || data.message?.toLowerCase().includes('success')) {
                setMessage("Account created successfully. Redirecting to login...");
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setMessage(data.message || "Signup failed");
            }
        } catch (err) {
            console.log("Error ", err);
            setMessage("An error occurred during signup");
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
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join us and start your journey</p>
                    </div>

                    {/* Tab Toggle */}
                    <div className="auth-tabs">
                        <Link to="/login" style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="auth-tab" style={{ width: '100%' }}>Login</button>
                        </Link>
                        <button className="auth-tab active">Sign Up</button>
                    </div>

                    {/* Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* Name */}
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    className="auth-input"
                                    type="text"
                                    placeholder="Enter your name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

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
                            Sign Up
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    {/* Message */}
                    {message && (
                        <div className={`message ${message.toLowerCase().includes('error') ? 'error' : 'success'}`}>
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