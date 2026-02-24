import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function CreateGigPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', category: '',
        price: '', delivery_days: 3, tags: '', revisions: 1,
    });

    useEffect(() => {
        api.get('/gigs/categories/').then(res => setCategories(res.data)).catch(() => { });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/gigs/', {
                ...formData,
                price: parseFloat(formData.price),
                delivery_days: parseInt(formData.delivery_days),
                revisions: parseInt(formData.revisions),
                category: parseInt(formData.category),
            });
            toast.success('Gig created successfully!');
            navigate(`/gigs/${res.data.id}`);
        } catch (err) {
            const errors = err.response?.data;
            if (errors) {
                Object.entries(errors).forEach(([key, val]) => {
                    toast.error(`${key}: ${Array.isArray(val) ? val.join(', ') : val}`);
                });
            } else {
                toast.error('Failed to create gig');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="create-gig-form">
                <div className="page-header">
                    <h1>Create a New Gig</h1>
                    <p>Start selling your skills to the world</p>
                </div>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Gig Title</label>
                            <input
                                type="text" name="title"
                                placeholder="I will do something amazing..."
                                value={formData.title}
                                onChange={handleChange}
                                required maxLength={200}
                            />
                        </div>

                        <div className="input-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                placeholder="Describe your service in detail..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Price ($)</label>
                                <input
                                    type="number" name="price"
                                    placeholder="50"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required min={5} step={1}
                                />
                            </div>
                            <div className="input-group">
                                <label>Delivery (Days)</label>
                                <input
                                    type="number" name="delivery_days"
                                    value={formData.delivery_days}
                                    onChange={handleChange}
                                    required min={1}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Revisions</label>
                                <input
                                    type="number" name="revisions"
                                    value={formData.revisions}
                                    onChange={handleChange}
                                    required min={0}
                                />
                            </div>
                            <div className="input-group">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text" name="tags"
                                    placeholder="react, website, frontend"
                                    value={formData.tags}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                            style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? 'Creating...' : '✨ Publish Gig'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
