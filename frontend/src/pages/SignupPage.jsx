import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaExclamationCircle } from 'react-icons/fa';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', password2: '', is_freelancer: false,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
        setGeneralError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setGeneralError('');

        // Client-side validation
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required.';
        else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters.';
        if (!formData.email.trim()) newErrors.email = 'Email is required.';
        if (!formData.password) newErrors.password = 'Password is required.';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
        if (!formData.password2) newErrors.password2 = 'Please confirm your password.';
        else if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await register(
                formData.username, formData.email,
                formData.password, formData.password2,
                formData.is_freelancer
            );
            toast.success('Account created successfully! Welcome to SkillBridge!');
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                const fieldErrors = {};
                // Map backend field errors to our form fields
                if (data.username) fieldErrors.username = Array.isArray(data.username) ? data.username[0] : data.username;
                if (data.email) fieldErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
                if (data.password) fieldErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
                if (data.password2) fieldErrors.password2 = Array.isArray(data.password2) ? data.password2[0] : data.password2;
                if (data.non_field_errors) setGeneralError(Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors);
                if (data.detail) setGeneralError(data.detail);

                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors);
                } else if (!data.non_field_errors && !data.detail) {
                    setGeneralError('Registration failed. Please check your details.');
                }
                toast.error('Please fix the errors below');
            } else if (err.request) {
                setGeneralError('Cannot connect to server. Make sure the backend is running on http://localhost:8000');
                toast.error('Server connection failed');
            } else {
                setGeneralError('Something went wrong. Please try again.');
                toast.error('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const FieldError = ({ field }) => {
        if (!errors[field]) return null;
        return (
            <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaExclamationCircle size={12} /> {errors[field]}
            </span>
        );
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Join SkillBridge</h1>
                <p className="subtitle">Create your free account</p>

                {generalError && (
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
                        <span>{generalError}</span>
                    </div>
                )}

                <div className="role-toggle">
                    <button
                        type="button"
                        className={!formData.is_freelancer ? 'active' : ''}
                        onClick={() => setFormData({ ...formData, is_freelancer: false })}
                    >
                        🛒 I want to buy
                    </button>
                    <button
                        type="button"
                        className={formData.is_freelancer ? 'active' : ''}
                        onClick={() => setFormData({ ...formData, is_freelancer: true })}
                    >
                        💼 I want to sell
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text" name="username"
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={handleChange}
                            style={errors.username ? { borderColor: '#ff6b6b' } : {}}
                            required
                        />
                        <FieldError field="username" />
                    </div>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email" name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            style={errors.email ? { borderColor: '#ff6b6b' } : {}}
                            required
                        />
                        <FieldError field="email" />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password" name="password"
                            placeholder="Min. 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            style={errors.password ? { borderColor: '#ff6b6b' } : {}}
                            required minLength={6}
                        />
                        <FieldError field="password" />
                    </div>
                    <div className="input-group">
                        <label>Confirm Password</label>
                        <input
                            type="password" name="password2"
                            placeholder="Repeat password"
                            value={formData.password2}
                            onChange={handleChange}
                            style={errors.password2 ? { borderColor: '#ff6b6b' } : {}}
                            required minLength={6}
                        />
                        <FieldError field="password2" />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
