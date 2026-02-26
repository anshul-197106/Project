/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import { HiOutlineSearch } from 'react-icons/hi';

export default function GigListPage() {
    const [gigs, setGigs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const activeCategory = searchParams.get('category') || '';

    useEffect(() => {
        api.get('/gigs/categories/').then(res => setCategories(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (searchParams.get('search')) params.search = searchParams.get('search');

        api.get('/gigs/', { params })
            .then(res => setGigs(res.data.results || res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchQuery) params.set('search', searchQuery);
        else params.delete('search');
        setLoading(true);
        setSearchParams(params);
    };

    const handleCategoryFilter = (catId) => {
        const params = new URLSearchParams(searchParams);
        if (catId === activeCategory) params.delete('category');
        else params.set('category', catId);
        setLoading(true);
        setSearchParams(params);
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1>Browse Gigs</h1>
                <p>Find the perfect freelancer for your project</p>
            </div>

            <form onSubmit={handleSearch} className="search-bar">
                <input
                    type="text"
                    placeholder="Search for any service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                    <HiOutlineSearch /> Search
                </button>
            </form>

            <div className="filters-bar">
                <button
                    className={`filter-chip ${!activeCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter('')}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`filter-chip ${activeCategory == cat.id ? 'active' : ''}`}
                        onClick={() => handleCategoryFilter(String(cat.id))}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : gigs.length > 0 ? (
                <div className="gigs-grid">
                    {gigs.map(gig => (
                        <GigCard key={gig.id} gig={gig} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h3>No gigs found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
