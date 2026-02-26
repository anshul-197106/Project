import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaExclamationCircle } from 'react-icons/fa';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!password.trim()) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                // Backend returned an error response
                const data = err.response.data;
                if (err.response.status === 401) {
                    setError('Invalid email or password. Please check your credentials and try again.');
                } else if (data?.error) {
                    setError(data.error);
                } else if (data?.detail) {
                    setError(data.detail);
                } else {
                    setError('Login failed. Please check your credentials.');
                }
            } else if (err.request) {
                // No response from server
                setError('Cannot connect to server. Make sure the backend is running on http://localhost:8000');
            } else {
                setError('Something went wrong. Please try again.');
            }
            toast.error('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Welcome Back</h1>
                <p className="subtitle">Sign in to your SkillBridge account</p>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '8px',
                        color: '#ff6b6b',
                        fontSize: '0.9rem',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                    }}>
                        <FaExclamationCircle style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up free</Link>
                </p>
            </div>
        </div>
    );
}
