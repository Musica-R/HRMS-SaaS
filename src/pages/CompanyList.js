import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SuperAdmin.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CompanyList = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${BASE_URL}/list-company`)
            .then(res => res.json())
            .then(json => {
                if (json.success) setCompanies(json.data);
                else setError(json.message || 'Failed to load companies');
            })
            .catch(() => setError('Server error. Try again later.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="sa-page">
            <div className="sa-page-header">
                <h2>Company List</h2>
                <Link to="/superadmin/add-company" className="sa-btn-primary">
                    + Add Company
                </Link>
            </div>

            {loading && <p className="sa-loading">Loading...</p>}
            {error && <p className="sa-error">{error}</p>}

            {!loading && !error && (
                <div className="sa-table-wrapper">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length > 0 ? companies.map(c => (
                                <tr key={c.id}>
                                    <td><span className="sa-id-badge">{c.id}</span></td>
                                    <td>{c.name}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={2} className="sa-empty-state">No companies found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CompanyList;