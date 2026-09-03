import React, { useState, useEffect } from 'react';
import '../styles/PermissionList.css';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Allow Permission.json';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'pl-status-approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'pl-status-pending' },
  rejected: {
    label: 'Rejected',
    icon: <FiXCircle />,
    cls: 'pl-status-rejected',
  },
};

/* ── Reason cell: show first 15 words, "Read more" for the rest ── */
function ReasonCell({ text, onReadMore }) {
  if (!text) return <span>—</span>;
  const words = text.trim().split(/\s+/);
  if (words.length <= 10) {
    return <div className="pl-reason-text">{text}</div>;
  }
  const preview = words.slice(0, 10).join(' ');
  return (
    <div className="pl-reason-text">
      {preview}…{' '}
      <button className="pl-read-more-btn" onClick={() => onReadMore(text)}>
        Read more
      </button>
    </div>
  );
}

/* ── Modal ── */
function ReasonModal({ text, onClose }) {
  if (!text) return null;
  return (
    <div className="pl-modal-overlay" onClick={onClose}>
      <div className="pl-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="pl-modal-header">
          <span className="pl-modal-title">Permission Reason</span>
          <button className="pl-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="pl-modal-body">{text}</div>
      </div>
    </div>
  );
}

export default function PermissionList() {

  const { company_id, branch_id } = getCompanyBranch();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [modalText, setModalText] = useState(null);

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({
    user_id: '',
    month: currentMonth,
    year: currentYear,
  });

  const monthOptions = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/approve-permission/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, company_id, branch_id }),
      });
      const data = await res.json();
      if (data.success) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
       const res = await fetch(
          `${BASE_URL}/premissionlist?user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}&company_id=${company_id}&branch_id=${branch_id}`
        );
        const json = await res.json();
        if (json.success) {
          setPermissions(json.data || []);
        } else {
          setError('Failed to fetch permission list');
        }
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [dateFilter, company_id, branch_id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const filtered = permissions.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const search = searchTerm.trim().replace(/\s+/g, ' ').toLowerCase();
    const name = (p.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return matchesStatus && name.includes(search);
  });

  const counts = {
    all: permissions.length,
    approved: permissions.filter((p) => p.status === 'approved').length,
    pending: permissions.filter((p) => p.status === 'pending').length,
    rejected: permissions.filter((p) => p.status === 'rejected').length,
  };

  const formatMinutes = (minutes) => {
    const totalMinutes = Math.round(parseFloat(minutes));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
  };

  return (
    <div className="permission-page fade-in">

      {/* ── REASON MODAL ── */}
      <ReasonModal text={modalText} onClose={() => setModalText(null)} />

      {/* ── HEADER ── */}
      <div className="permission-header">
        <div className="permission-title-group">
          <Lottie animationData={animationData} style={{ width: "70px", height: "90px" }} />
          <div>
            <h1>Permission List</h1>
            <p>Total {counts.all} permission requests found</p>
          </div>
        </div>

        <div className="permission-controls">
          <div className="pl-search-wrap">
            <FiSearch className="pl-search-icon" />
            <input
              type="text"
              className="pl-search-input"
              placeholder="Search by name, reason…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`pl-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
            disabled={loading}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* ── DATE FILTERS ── */}
      <div style={{ display: 'flex', width: '100%', gap: '30px', padding: '10px' }}>
        <div className="form-group">
          <label>Month Filter</label>
          <select name="month" value={dateFilter.month} onChange={handleDate}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year Filter</label>
          <select name="year" value={dateFilter.year} onChange={handleDate}>
            {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="pl-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`pl-tab ${filterStatus === s ? 'pl-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="pl-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="pl-summary-grid">
        <div className="pl-summary-card pl-summary-total">
          <span className="pl-card-num">{counts.all}</span>
          <span className="pl-card-label">Total Applied</span>
        </div>
        <div className="pl-summary-card pl-summary-approved">
          <span className="pl-card-num">{counts.approved}</span>
          <span className="pl-card-label">Approved</span>
        </div>
        <div className="pl-summary-card pl-summary-pending">
          <span className="pl-card-num">{counts.pending}</span>
          <span className="pl-card-label">Pending</span>
        </div>
        <div className="pl-summary-card pl-summary-rejected">
          <span className="pl-card-num">{counts.rejected}</span>
          <span className="pl-card-label">Rejected</span>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading && permissions.length === 0 ? (
        <div className="pl-center">
          <div className="pl-spinner" />
          <p>Fetching permissions…</p>
        </div>
      ) : error ? (
        /* ── ERROR ── */
        <div className="pl-error">
          <span><FiAlertCircle /> {error}</span>
          <button
            className="pl-retry-btn"
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
          >
            Retry
          </button>
        </div>
      ) : (
        /* ── TABLE ── */
        <div className="pl-table-container">
          <table className="pl-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Permission ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
                <th>Approved By</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p, idx) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={p.id}>
                      {/* S.No */}
                      <td>{idx + 1}</td>

                      {/* Permission ID */}
                      <td>
                        <span className="pl-id-badge">#{p.id}</span>
                      </td>

                      {/* Name */}
                      <td>
                        <span className="pl-name-cell">{p.name}</span>
                      </td>

                      {/* Date */}
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                        {formatDate(p.attendance_date)}
                      </td>

                      {/* Time Slot */}
                      <td>
                        <span className="pl-time-badge">
                          {formatTime(p.start_time)} – {formatTime(p.end_time)}
                        </span>
                      </td>

                      {/* Duration */}
                      <td>
                        <span className="pl-hours">
                          {formatMinutes(p.permission_hours)}
                        </span>
                      </td>

                      {/* Reason — 15-word preview + Read more */}
                      <td className="pl-reason-cell">
                        <ReasonCell
                          text={p.reason}
                          onReadMore={(t) => setModalText(t)}
                        />
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`pl-status ${sc.cls}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>

                      {/* Applied On */}
                      <td style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDate(p.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'pending' ? (
                          <select
                            className="ll-status-dropdown"
                            value={p.status}
                            disabled={updatingId === p.id}
                            onChange={(e) => updateStatus(p.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {sc.icon} {sc.label}
                          </span>
                        )}
                      </td>

                      {/* Approved By */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: p.approved_position === 'HR' ? '#dbeafe' : '#dcfce7',
                            color: p.approved_position === 'HR' ? '#1d4ed8' : '#166534',
                            fontWeight: 700,
                            fontSize: '12px',
                            marginBottom: '4px',
                          }}
                        >
                          {p.approved_position || '—'}
                        </span>
                        <br />
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>
                          {/* {p.approved_by || '—'} */}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No permission records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}