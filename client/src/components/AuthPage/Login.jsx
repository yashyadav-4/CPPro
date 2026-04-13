import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import FallingStars from "./FallingStar";
import './Auth.css';

const ease = [0.16, 1, 0.3, 1];

export default function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const theme = isDark ? {
    bg: '#0a0a0a',
    card: '#111111',
    border: '#222222',
    text: '#ffffff',
    subtle: '#a3a3a3',
    input: '#161616',
    accent: '#16a34a',
    accentLt: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.08)'
  } : {
    bg: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    subtle: '#64748b',
    input: '#f8fafc',
    accent: '#16a34a',
    accentLt: '#22c55e',
    glow: 'rgba(22, 163, 74, 0.04)'
  };

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.message && data.message.toLowerCase().includes('successful')) {
        navigate('/');
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      setMessage("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: theme.bg,
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <FallingStars />
      {/* Background Decor */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${theme.border} 1px,transparent 1px),linear-gradient(90deg,${theme.border} 1px,transparent 1px)`, backgroundSize: '64px 64px', opacity: 0.3, pointerEvents: 'none', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: -1 }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.4)' : '0 24px 48px rgba(0,0,0,0.06)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            style={{ 
              width: '56px', height: '56px', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', 
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 1.25rem', border: `1px solid ${theme.accent}33`
            }}
          >
            <ShieldCheck size={28} color={theme.accent} />
          </motion.div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p style={{ color: theme.subtle, fontSize: '0.9rem' }}>Sign in to continue your CP journey</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text, marginLeft: '4px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.subtle }} size={18} />
              <input 
                type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com"
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', backgroundColor: theme.input,
                  border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text, outline: 'none', fontSize: '0.9rem',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text }}>Password</label>
              <Link to="/forgot" style={{ fontSize: '0.75rem', color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.subtle }} size={18} />
              <input 
                type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.85rem 3rem 0.85rem 2.75rem', backgroundColor: theme.input,
                  border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text, outline: 'none', fontSize: '0.9rem'
                }}
              />
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: theme.subtle, cursor: 'pointer', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit" disabled={loading}
            style={{
              marginTop: '0.75rem', padding: '0.9rem', backgroundColor: theme.accent, color: '#fff', 
              border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: `0 8px 20px ${theme.accent}33`, transition: 'background 0.2s'
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </motion.button>
        </form>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
            {message}
          </motion.div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: `1px solid ${theme.border}` }}>
          <p style={{ color: theme.subtle, fontSize: '0.9rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: theme.accent, textDecoration: 'none', fontWeight: 700 }}>Sign Up</Link>
          </p>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div style={{ position: 'absolute', bottom: '1.5rem', textAlign: 'center', width: '100%', zIndex: 1 }}>
         <p style={{ fontSize: '0.75rem', color: theme.subtle, letterSpacing: '0.05em' }}>
           made by <span style={{ color: theme.text, fontWeight: 700 }}>yash</span>
         </p>
      </div>
    </div>
  );
}