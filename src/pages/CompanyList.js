import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SuperAdmin.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Reads the auth token saved in localStorage at login and formats it for the
// Authorization header. Adjust the key below ('token') if your app stores it
// under a different name (e.g. 'authToken', 'access_token').

const getAuthToken = () => localStorage.getItem('token');

const authHeaders = (extra = {}) => {
    const token = getAuthToken();
    return {
        ...extra,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const emptyEditForm = {
    company_id: '',
    company_name: '',
    company_address: '',
    company_lat: '',
    company_lon: '',
    logo: null,
    firebase_file: null,
};

const CompanyList = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [togglingId, setTogglingId] = useState(null); // tracks which row's status toggle is in-flight

    // ---- Edit modal state ----
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState(emptyEditForm);
    const [editErrors, setEditErrors] = useState({});
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editServerError, setEditServerError] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = () => {
        setLoading(true);
        fetch(`${BASE_URL}/list-company`, {
            headers: authHeaders({ Accept: 'application/json' }),
        })
            .then(res => res.json().then(json => ({ status: res.status, json })))
            .then(({ status, json }) => {
                if (json.success) {
                    setCompanies(json.data);
                    setError('');
                } else if (status === 401) {
                    setError('Your session has expired. Please log in again.');
                } else {
                    setError(json.message || 'Failed to load companies');
                }
            })
            .catch(() => setError('Server error. Try again later.'))
            .finally(() => setLoading(false));
    };

    const handleToggleStatus = (company) => {
        const newStatus = company.status === 1 ? 0 : 1;

        setTogglingId(company.id);
        setError('');

        fetch(`${BASE_URL}/change-company-status`, {
            method: 'POST',
            headers: authHeaders({
                'Content-Type': 'application/json',
                Accept: 'application/json',
            }),
            body: JSON.stringify({
                company_id: company.id,
                status: newStatus,
            }),
        })
            .then(res => res.json().then(json => ({ status: res.status, json })))
            .then(({ status, json }) => {
                if (json.success) {
                    setCompanies(prev =>
                        prev.map(c =>
                            c.id === company.id ? { ...c, status: newStatus } : c
                        )
                    );
                } else if (status === 401) {
                    setError('Your session has expired. Please log in again.');
                } else {
                    setError(json.message || 'Failed to update status');
                }
            })
            .catch(() => setError('Server error. Try again later.'))
            .finally(() => setTogglingId(null));
    };

    // ---- Edit modal handlers ----
    const openEditModal = (company) => {
        setEditForm({
            company_id: company.id,
            company_name: company.company_name || '',
            company_address: company.company_address || '',
            company_lat: company.company_lat || '',
            company_lon: company.company_lon || '',
            logo: null,
            firebase_file: null,
        });
        setLogoPreview(company.logo || null);
        setEditErrors({});
        setEditServerError('');
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        if (editSubmitting) return; // don't allow closing mid-submit
        setShowEditModal(false);
        setEditForm(emptyEditForm);
        setLogoPreview(null);
        setEditErrors({});
        setEditServerError('');
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setEditForm(prev => ({ ...prev, logo: file }));
        if (file) setLogoPreview(URL.createObjectURL(file));
    };

    const handleFirebaseFileChange = (e) => {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setEditForm(prev => ({ ...prev, firebase_file: file }));
    };

    const validateEditForm = () => {
        const errs = {};
        if (!editForm.company_name.trim()) errs.company_name = 'Company name is required.';
        if (!editForm.company_address.trim()) errs.company_address = 'Address is required.';
        if (editForm.company_lat === '' || editForm.company_lat === null) errs.company_lat = 'Latitude is required.';
        if (editForm.company_lon === '' || editForm.company_lon === null) errs.company_lon = 'Longitude is required.';
        if (editForm.logo) {
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowed.includes(editForm.logo.type)) errs.logo = 'Logo must be jpg, jpeg, png, or webp.';
            else if (editForm.logo.size > 2048 * 1024) errs.logo = 'Logo must be 2MB or smaller.';
        }
        if (editForm.firebase_file) {
            if (!editForm.firebase_file.name.toLowerCase().endsWith('.json')) {
                errs.firebase_file = 'Firebase credentials file must be a .json file.';
            }
        }
        setEditErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setEditServerError('');

        if (!validateEditForm()) return;

        const formData = new FormData();
        formData.append('company_id', editForm.company_id);
        formData.append('company_name', editForm.company_name.trim());
        formData.append('company_address', editForm.company_address.trim());
        formData.append('company_lat', editForm.company_lat);
        formData.append('company_lon', editForm.company_lon);
        if (editForm.logo) formData.append('logo', editForm.logo);
        if (editForm.firebase_file) formData.append('firebase_file', editForm.firebase_file);

        setEditSubmitting(true);

        fetch(`${BASE_URL}/update-company`, {
            method: 'POST',
            headers: authHeaders({ Accept: 'application/json' }),
            body: formData,
        })
            .then(res => res.json().then(json => ({ status: res.status, json })))
            .then(({ status, json }) => {
                if (json.success) {
                    setCompanies(prev =>
                        prev.map(c =>
                            c.id === editForm.company_id
                                ? {
                                      ...c,
                                      company_name: editForm.company_name.trim(),
                                      company_address: editForm.company_address.trim(),
                                      company_lat: editForm.company_lat,
                                      company_lon: editForm.company_lon,
                                      logo: json.data && json.data.logo ? json.data.logo : c.logo,
                                  }
                                : c
                        )
                    );
                    setShowEditModal(false);
                    setEditForm(emptyEditForm);
                    setLogoPreview(null);
                } else if (status === 401) {
                    setEditServerError('Your session has expired. Please log in again.');
                } else if (status === 422 && json.errors) {
                    // Laravel validation error format: { errors: { field: [messages] } }
                    const fieldErrors = {};
                    Object.keys(json.errors).forEach(key => {
                        fieldErrors[key] = Array.isArray(json.errors[key])
                            ? json.errors[key][0]
                            : json.errors[key];
                    });
                    setEditErrors(fieldErrors);
                } else {
                    setEditServerError(json.message || 'Failed to update company.');
                }
            })
            .catch(() => setEditServerError('Server error. Try again later.'))
            .finally(() => setEditSubmitting(false));
    };

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

            {!loading && (
                <div className="sa-table-wrapper">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Logo</th>
                                <th>Company Name</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length > 0 ? companies.map(c => (
                                <tr key={c.id}>
                                    <td><span className="sa-id-badge">{c.id}</span></td>
                                    <td>
                                        {c.logo ? (
                                            <img
                                                src={c.logo_url}
                                                alt={c.company_name}
                                                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span className="sa-hint">No logo</span>
                                        )}
                                    </td>
                                    <td>{c.company_name}</td>
                                    <td>{c.company_address}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="sa-status-toggle"
                                            data-active={c.status === 1}
                                            onClick={() => handleToggleStatus(c)}
                                            disabled={togglingId === c.id}
                                            title={c.status === 1 ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                                        >
                                            <span className="sa-status-toggle-track">
                                                <span className="sa-status-toggle-thumb" />
                                            </span>
                                            <span className="sa-status-toggle-label">
                                                {togglingId === c.id ? 'Updating...' : (c.status === 1 ? 'Active' : 'Inactive')}
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="sa-btn-edit"
                                            onClick={() => openEditModal(c)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="sa-empty-state">No companies found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && (
                <div className="sa-modal-overlay" onClick={closeEditModal}>
                    <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sa-modal-header">
                            <h3>Edit Company</h3>
                            <button
                                type="button"
                                className="sa-modal-close"
                                onClick={closeEditModal}
                                disabled={editSubmitting}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        <form className="sa-form sa-modal-body" onSubmit={handleEditSubmit}>
                            {editServerError && <p className="sa-error">{editServerError}</p>}

                            <div className="sa-form-group">
                                <label htmlFor="edit_company_name">Company Name</label>
                                <input
                                    id="edit_company_name"
                                    name="company_name"
                                    type="text"
                                    className="sa-input"
                                    value={editForm.company_name}
                                    onChange={handleEditChange}
                                    placeholder="Enter company name"
                                />
                                {editErrors.company_name && <p className="sa-field-error">{editErrors.company_name}</p>}
                            </div>

                            <div className="sa-form-group">
                                <label htmlFor="edit_company_address">Address</label>
                                <input
                                    id="edit_company_address"
                                    name="company_address"
                                    type="text"
                                    className="sa-input"
                                    value={editForm.company_address}
                                    onChange={handleEditChange}
                                    placeholder="Enter company address"
                                />
                                {editErrors.company_address && <p className="sa-field-error">{editErrors.company_address}</p>}
                            </div>

                            <div className="sa-form-row">
                                <div className="sa-form-group">
                                    <label htmlFor="edit_company_lat">Latitude</label>
                                    <input
                                        id="edit_company_lat"
                                        name="company_lat"
                                        type="text"
                                        className="sa-input"
                                        value={editForm.company_lat}
                                        onChange={handleEditChange}
                                        placeholder="e.g. 11.6643"
                                    />
                                    {editErrors.company_lat && <p className="sa-field-error">{editErrors.company_lat}</p>}
                                </div>
                                <div className="sa-form-group">
                                    <label htmlFor="edit_company_lon">Longitude</label>
                                    <input
                                        id="edit_company_lon"
                                        name="company_lon"
                                        type="text"
                                        className="sa-input"
                                        value={editForm.company_lon}
                                        onChange={handleEditChange}
                                        placeholder="e.g. 78.1460"
                                    />
                                    {editErrors.company_lon && <p className="sa-field-error">{editErrors.company_lon}</p>}
                                </div>
                            </div>

                            <div className="sa-form-group">
                                <label htmlFor="edit_logo">Company Logo</label>
                                <div className="sa-file-input-wrapper">
                                    {logoPreview && (
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }}
                                        />
                                    )}
                                    <input
                                        id="edit_logo"
                                        name="logo"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleLogoChange}
                                    />
                                </div>
                                <p className="sa-hint">JPG, JPEG, PNG or WEBP. Max 2MB. Leave empty to keep current logo.</p>
                                {editErrors.logo && <p className="sa-field-error">{editErrors.logo}</p>}
                            </div>

                            <div className="sa-form-group">
                                <label htmlFor="edit_firebase_file">Firebase Credentials (optional)</label>
                                <div className="sa-file-input-wrapper">
                                    <input
                                        id="edit_firebase_file"
                                        name="firebase_file"
                                        type="file"
                                        accept=".json"
                                        onChange={handleFirebaseFileChange}
                                    />
                                </div>
                                <p className="sa-hint">Upload a .json file to update Firebase credentials.</p>
                                {editErrors.firebase_file && <p className="sa-field-error">{editErrors.firebase_file}</p>}
                            </div>

                            <div className="sa-modal-footer">
                                <button
                                    type="button"
                                    className="sa-btn-secondary"
                                    onClick={closeEditModal}
                                    disabled={editSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="sa-btn-primary"
                                    disabled={editSubmitting}
                                >
                                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyList;