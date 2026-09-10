import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SuperAdmin.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AddCompany = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        company_name: '',
        company_address: '',
        company_lon: '',
        company_lat: '',
        branch_name: '',
        meter: '',
        admin_email: '',
        admin_password: '',
    });
    const [logo, setLogo] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (logo) formData.append('logo', logo);

            const token = localStorage.getItem("token");

            const response = await fetch(`${BASE_URL}/add-company`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            const data = await response.json();

            if (response.ok && data.success) {
                navigate('/superadmin');
            } else if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate('/');
            } else {
                setError(data.message || 'Failed to add company');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-page">
            <div className="sa-page-header">
                <h2>Add Company</h2>
            </div>

            {error && <p className="sa-error">{error}</p>}

            <div className="sa-form-card">
                <form onSubmit={handleSubmit} className="sa-form">
                    <div className="sa-form-group">
                        <label>Company Name</label>
                        <input className="sa-input" name="company_name" placeholder="e.g. Mpeoples Pvt Ltd" value={form.company_name} onChange={handleChange} required />
                    </div>

                    <div className="sa-form-group">
                        <label>Company Address</label>
                        <input className="sa-input" name="company_address" placeholder="Street, City, State" value={form.company_address} onChange={handleChange} required />
                    </div>

                    <div className="sa-form-row">
                        <div className="sa-form-group">
                            <label>Longitude</label>
                            <input className="sa-input" name="company_lon" placeholder="Optional" value={form.company_lon} onChange={handleChange} />
                        </div>
                        <div className="sa-form-group">
                            <label>Latitude</label>
                            <input className="sa-input" name="company_lat" placeholder="Optional" value={form.company_lat} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="sa-form-row">
                        <div className="sa-form-group">
                            <label>Branch Name</label>
                            <input className="sa-input" name="branch_name" placeholder="e.g. Head Office" value={form.branch_name} onChange={handleChange} required />
                        </div>
                        <div className="sa-form-group">
                            <label>Meter</label>
                            <input className="sa-input" name="meter" type="number" step="any" placeholder="Optional" value={form.meter} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="sa-form-group">
                        <label>Company Logo</label>
                        <div className="sa-file-input-wrapper">
                            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setLogo(e.target.files[0])} />
                        </div>
                        <span className="sa-hint">JPG, PNG or WEBP, max 2MB</span>
                    </div>

                    <div className="sa-form-group">
                        <label>Admin Email</label>
                        <input className="sa-input" name="admin_email" type="email" placeholder="admin@company.com" value={form.admin_email} onChange={handleChange} required />
                    </div>

                    <div className="sa-form-group">
                        <label>Admin Password</label>
                        <input className="sa-input" name="admin_password" type="password" placeholder="Min 6 characters" value={form.admin_password} onChange={handleChange} required minLength={6} />
                    </div>

                    <div className="sa-submit-row">
                        <button type="submit" className="sa-btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Add Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCompany;