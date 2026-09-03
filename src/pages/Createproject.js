import React, { useState, useEffect } from 'react';
import '../styles/Createproject.css';
import { IoAdd } from 'react-icons/io5';
import { MdOutlineFolderOpen, MdOutlineEdit } from 'react-icons/md';
import { FiUsers, FiCalendar, FiUser, FiCheckCircle } from 'react-icons/fi';
import { createPortal } from 'react-dom';
// import { GrEdit } from "react-icons/gr";
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;


const CreateProject = () => {

    const { company_id, branch_id } = getCompanyBranch();

    const [formData, setFormData] = useState({
        project_name: '',
        description: '',
        team_id: '',
    });

    const [editData, setEditData] = useState({
        id: null,
        project_name: '',
        description: '',
        team_id: '',
        status: 'active',
    });

    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [activeForm, setActiveForm] = useState(false);
    const [editForm, setEditForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teamFilter, setTeamFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [updating, setUpdating] = useState(false);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        Accept: 'application/json',
    });

    /* ================= FETCH TEAMS ================= */
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch(`${BASE_URL}/teams/team-list?company_id=${company_id}&branch_id=${branch_id}`, {
                    headers: getAuthHeaders(),
                });
                const result = await response.json();
                if (result.success) {
                    setTeams(result.data);
                    if (result.data.length > 0) setTeamFilter(result.data[0].id);
                }
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };
        fetchTeams();
    }, [company_id, branch_id]);

    /* ================= FETCH PROJECTS ================= */
    useEffect(() => {
        if (!teamFilter) return;
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/project/list?team_id=${teamFilter}&company_id=${company_id}&branch_id=${branch_id}`, {
                    headers: getAuthHeaders(),
                });
                const result = await response.json();
                if (result.success) setProjects(result.data);
                else setProjects([]);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [teamFilter, activeForm, editForm, company_id, branch_id]);

    /* ================= HANDLE INPUT ================= */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    /* ================= OPEN EDIT MODAL ================= */
    const openEdit = (data) => {
        setEditData({
            id: data.id,
            project_name: data.project_name,
            description: data.description || '',
            team_id: data.team_id || '',
            status: data.status || 'active',
        });
        setEditForm(true);
    };

    /* ================= PROJECT FORM SUBMIT (CREATE) ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const submitData = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== '') submitData.append(key, formData[key]);
        });

        submitData.append('company_id', company_id);
        submitData.append('branch_id', branch_id);

        try {

            const response = await fetch(`${BASE_URL}/project/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: submitData,
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Project created successfully!');
                setFormData({ project_name: '', description: '', team_id: '' });
                setActiveForm(false);
            } else {
                alert('Failed to create project: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form');
        } finally {
            setSubmitting(false);
        }
    };

    /* ================= PROJECT FORM SUBMIT (EDIT) ================= */
    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        const submitData = new FormData();
        submitData.append('project_name', editData.project_name);
        submitData.append('description', editData.description);
        submitData.append('team_id', editData.team_id);
        submitData.append('status', editData.status);
        submitData.append('company_id', company_id);
        submitData.append('branch_id', branch_id);

        try {
            const response = await fetch(`${BASE_URL}/project/update/${editData.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: submitData,
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Project updated successfully!');
                setEditForm(false);
            } else {
                alert('Failed to update project: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Error updating project');
        } finally {
            setUpdating(false);
        }
    };

    /* ================= HELPERS ================= */
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'inactive': return 'Inactive';
            case 'completed': return 'Completed';
            case 'on_hold': return 'On Hold';
            default: return status;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    /* ================= LOADING STATE ================= */
    if (loading && projects.length === 0 && teams.length === 0) {
        return (
            <div className="proj-loading">
                <div className="proj-spinner">
                    <span></span><span></span><span></span>
                </div>
                <p>Loading project data…</p>
            </div>
        );
    }

    return (
        <div className="proj-page fade-in-up">

            {/* ── HERO HEADER ── */}
            <div className="proj-hero">
                <div className="proj-hero-glow" />
                <div className="proj-hero-inner">
                    <div className="proj-hero-icon">
                        <MdOutlineFolderOpen size={34} color="#fff" />
                    </div>
                    <div className="proj-hero-text">
                        <h1>Project Management</h1>
                        <p>Create, organize, and track all your team projects in one centralized workspace.</p>
                    </div>
                    <div className="proj-hero-stat">
                        <span className="proj-stat-num">{projects.length}</span>
                        <span className="proj-stat-label">Projects</span>
                    </div>
                </div>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="proj-toolbar">
                <div className="proj-filters">
                    <div className="proj-chip">

                        <FiUsers size={14} />
                        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button className="proj-add-btn" onClick={() => setActiveForm((prev) => !prev)}>
                    <IoAdd style={{ fontSize: '18px' }} />
                    <span>New Project</span>
                </button>
            </div>

            {/* ── SECTION HEADING ── */}
            <div className="proj-section-head">
                <span className="proj-section-title">View Projects</span>
                <span className="proj-section-line" />
            </div>

            {/* ── CARDS GRID ── */}
            {loading ? (
                <div className="proj-loading-inline">
                    <div className="proj-spinner">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            ) : (
                <div className="proj-grid">
                    {projects.length === 0 ? (
                        <div className="proj-empty">
                            <div className="proj-empty-icon">
                                <MdOutlineFolderOpen size={28} />
                            </div>
                            <p>No projects found for this team.</p>
                        </div>
                    ) : (
                        projects.map((data, idx) => (
                            <div className="proj-card" key={data.id} style={{ animationDelay: `${idx * 0.06}s` }}>
                                <div className="proj-card-accent" />
                                <div className="proj-card-top">
                                    <span className={`proj-status-badge status-${data.status}`}>
                                        <FiCheckCircle size={10} />
                                        {getStatusLabel(data.status)}
                                    </span>
                                    <div className="proj-card-actions">
                                        <button
                                            className="pca-btn edit"
                                            onClick={() => openEdit(data)}
                                            title="Edit Project"
                                        >
                                            <MdOutlineEdit />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="proj-card-title">{data.project_name}</h3>
                                <p className="proj-card-desc">{data.description || 'No description provided.'}</p>

                                <div className="proj-card-meta">
                                    <div className="proj-meta-item">
                                        <FiUsers size={12} />
                                        <span>{data.team_name}</span>
                                    </div>
                                    <div className="proj-meta-item">
                                        <FiUser size={12} />
                                        <span>{data.created_by_name}</span>
                                    </div>
                                    <div className="proj-meta-item">
                                        <FiCalendar size={12} />
                                        <span>{formatDate(data.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {activeForm && createPortal(
                <div className="pmodal-overlay" onClick={() => setActiveForm(false)}>
                    <div className="pmodal" onClick={(e) => e.stopPropagation()}>
                        <div className="pmodal-header">
                            <div className="pmodal-icon">
                                <MdOutlineFolderOpen size={18} color="#fff" />
                            </div>
                            <div>
                                <h2>Create Project</h2>
                                <p>Fill in the details below to add a new project.</p>
                            </div>
                            <button className="pmodal-close" onClick={() => setActiveForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="pmodal-form">
                            <div className="pfield full">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    name="project_name"
                                    value={formData.project_name}
                                    onChange={handleChange}
                                    placeholder="e.g. CRM System"
                                    required
                                />
                            </div>
                            <div className="pfield full">
                                <label>Assign Team</label>
                                <select
                                    name="team_id"
                                    value={formData.team_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Team</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pfield full">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Describe the project goals and scope…"
                                />
                            </div>
                            <div className="pmodal-actions">
                                <button type="button" className="pbtn pbtn-ghost" onClick={() => setActiveForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="pbtn pbtn-primary" disabled={submitting}>
                                    {submitting ? 'Creating…' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── EDIT MODAL ── */}
            {editForm && createPortal(
                <div className="pmodal-overlay" onClick={() => setEditForm(false)}>
                    <div className="pmodal" onClick={(e) => e.stopPropagation()}>
                        <div className="pmodal-header pmodal-header-edit">
                            <div className="pmodal-icon pmodal-icon-edit">
                                <MdOutlineEdit size={18} color="#fff" />
                            </div>
                            <div>
                                <h2>Edit Project</h2>
                                <p>Update the project details below.</p>
                            </div>
                            <button className="pmodal-close" onClick={() => setEditForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdate} className="pmodal-form">
                            <div className="pfield full">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    name="project_name"
                                    value={editData.project_name}
                                    onChange={handleEditChange}
                                    placeholder="e.g. CRM System"
                                    required
                                />
                            </div>
                            <div className="pfield full">
                                <label>Assign Team</label>
                                <select
                                    name="team_id"
                                    value={editData.team_id}
                                    onChange={handleEditChange}
                                    required
                                >
                                    <option value="">Select Team</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pfield full">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={editData.status}
                                    onChange={handleEditChange}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="pfield full">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={editData.description}
                                    onChange={handleEditChange}
                                    rows="4"
                                    placeholder="Describe the project goals and scope…"
                                />
                            </div>
                            <div className="pmodal-actions">
                                <button type="button" className="pbtn pbtn-ghost" onClick={() => setEditForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="pbtn pbtn-edit" disabled={updating}>
                                    {updating ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CreateProject;