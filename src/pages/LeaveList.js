import React, { useEffect, useState } from 'react';
import '../styles/LeaveList.css';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const UPDATE_STATUS_API = `${BASE_URL}/update-Leave-status`;

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'status--approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'status--pending' },
  rejected: { label: 'Rejected', icon: <FiXCircle />, cls: 'status--rejected' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function leaveTypeClass(type) {
  if (!type) return 'default';
  const t = type.toUpperCase();
  if (t === 'LOP') return 'lop';
  if (t === 'CASUAL') return 'casual';
  if (t === 'SICK') return 'sick';
  if (t === 'EARNED') return 'earned';
  return 'default';
}

/* ── Reason cell: show first 15 words, "Read more" for the rest ── */
function ReasonCell({ text, onReadMore }) {
  if (!text) return <span>—</span>;
  const words = text.trim().split(/\s+/);
  if (words.length <= 10) {
    return <div className="ll-reason-text">{text}</div>;
  }
  const preview = words.slice(0, 10).join(' ');
  return (
    <div className="ll-reason-text">
      {preview}…{' '}
      <button className="ll-read-more-btn" onClick={() => onReadMore(text)}>
        Read more
      </button>
    </div>
  );
}

/* ── Modal ── */
function ReasonModal({ text, onClose }) {
  if (!text) return null;
  return (
    <div className="ll-modal-overlay" onClick={onClose}>
      <div className="ll-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="ll-modal-header">
          <span className="ll-modal-title">Leave Reason</span>
          <button className="ll-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ll-modal-body">{text}</div>
      </div>
    </div>
  );
}

export default function LeaveList() {

  /* ───────── Company/Branch context ───────── */
  // ✅ shift now comes from the shared util (companyContext), same as
  // DashboardHome / EmpList / AttendanceList — no local dropdown needed.
  const { company_id, branch_id, shift } = getCompanyBranch();

  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState({ month: '', total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ shift param built from the util's shift value (global), not a local dropdown
        const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';

        const res = await fetch(
          `${BASE_URL}/leave-list?user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`
        );
        const json = await res.json();
        if (json.success) {
          setLeaves(json.data);
          setMeta({ month: json.month, total: json.total_leaves });
        } else {
          setError('Failed to load leave records.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [dateFilter, company_id, branch_id, shift]); // ✅ shift added — refetches automatically when the global shift changes

  const updateStatus = async (leaveId, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(leaveId);
      const token = localStorage.getItem('token');
      const res = await fetch(UPDATE_STATUS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leave_id: leaveId, status: newStatus, company_id, branch_id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaves((prev) =>
          prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const search = searchTerm.trim().replace(/\s+/g, ' ').toLowerCase();
    const name = (l.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return matchStatus && name.includes(search);
  });

  const counts = {
    all: leaves.length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  function formatDuration(duration) {
    const d = parseFloat(duration);
    if (d === 0.5) return 'Half Day';
    if (d % 1 === 0) return `${d} Day${d > 1 ? 's' : ''}`;
    if (d % 1 === 0.5) {
      const fullDays = Math.floor(d);
      return `${fullDays} Day${fullDays > 1 ? 's' : ''} + Half Day`;
    }
    return duration;
  }

  function formatHalfDay(halfday) {
    if (!halfday) return '—';
    return halfday.charAt(0).toUpperCase() + halfday.slice(1);
  }

  return (
    <div className="leavelist-page">
      {/* ── REASON MODAL ── */}
      <ReasonModal text={modalText} onClose={() => setModalText(null)} />

      {/* ── HEADER ── */}
      <div className="leavelist-header">
        <div className="leavelist-title">
          <FiCalendar className="ll-title-icon" />
          <div>
            <h1>Leave Management</h1>
            <p>
              {meta.month || 'Current Month'} · {meta.total} leave
              {meta.total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        <div className="leavelist-controls">
          <div className="ll-search-wrap">
            <FiSearch className="ll-search-icon" />
            <input
              type="text"
              className="ll-search"
              placeholder="Search by name, emp id…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="ll-refresh-btn"
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
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
            {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* ✅ No local shift dropdown here — shift comes globally from
            getCompanyBranch() (companyContext util), same source
            DashboardHome / EmpList / AttendanceList use. Switching shift
            elsewhere in the app automatically re-fetches this list via
            the useEffect dependency on `shift`. */}
      </div>

      {/* ── TABS ── */}
      <div className="ll-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`ll-tab ll-tab--${s} ${filterStatus === s ? 'll-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ll-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {loading && leaves.length === 0 && (
        <div className="ll-center">
          <div className="ll-spinner" />
          <p>Loading leave records…</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="ll-error">
          <FiAlertCircle />
          {error}
          <button
            className="ll-retry"
            onClick={() =>
              setDateFilter({ user_id: '', month: currentMonth, year: currentYear })
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ── SUMMARY CARDS ── */}
      {!loading && !error && leaves.length > 0 && (
        <div className="ll-summary-row">
          <div className="ll-summary-card ll-summary--total">
            <span className="ll-sum-num">{counts.all}</span>
            <span className="ll-sum-label">Total Applied</span>
          </div>
          <div className="ll-summary-card ll-summary--approved">
            <span className="ll-sum-num">{counts.approved}</span>
            <span className="ll-sum-label">Approved</span>
          </div>
          <div className="ll-summary-card ll-summary--pending">
            <span className="ll-sum-num">{counts.pending}</span>
            <span className="ll-sum-label">Pending</span>
          </div>
          <div className="ll-summary-card ll-summary--rejected">
            <span className="ll-sum-num">{counts.rejected}</span>
            <span className="ll-sum-label">Rejected</span>
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="ll-center">
              <p>No leave records found matching your criteria.</p>
            </div>
          ) : (
            <div className="ll-table-wrap">
              <table className="ll-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Leave ID</th>
                    <th>Employee Details</th>
                    <th>Leave Date</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Duration</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th className="ll-txt-center">Actions</th>
                    <th>Approved By</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((leave, idx) => {
                    const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                    const isUpdating = updatingId === leave.id;

                    return (
                      <tr key={leave.id} className="ll-row">
                        {/* # */}
                        <td className="ll-idx">{idx + 1}</td>

                        {/* Leave ID */}
                        <td className="ll-id-cell">
                          <span className="ll-id-badge">#{leave.id}</span>
                        </td>

                        {/* Employee */}
                        <td>
                          <div className="ll-emp-info">
                            <span className="ll-name">{leave.name}</span>
                            <span className="ll-empid">{leave.empid}</span>
                          </div>
                        </td>

                        {/* Leave Date */}
                        <td className="ll-date">{formatDate(leave.leave_date)}</td>

                        {/* Leave Type */}
                        <td className="ll-type">
                          <span className={`ll-type-chip ${leaveTypeClass(leave.leave_type)}`}>
                            {leave.leave_type || '—'}
                          </span>
                        </td>

                        {/* Reason — 15-word preview + Read more */}
                        <td className="ll-reason-cell">
                          <ReasonCell
                            text={leave.reason}
                            onReadMore={(t) => setModalText(t)}
                          />
                        </td>

                        {/* Applied On */}
                        <td className="ll-date ll-dim">{formatDate(leave.created_at)}</td>

                        {/* Duration */}
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {formatDuration(leave.duration)}
                        </td>

                        {/* Session */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatHalfDay(leave.half_day)}
                        </td>

                        {/* Status badge */}
                        <td>
                          <span className={`ll-status ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="ll-txt-center">
                          {leave.status === 'pending' ? (
                            <select
                              className="ll-status-dropdown"
                              value={leave.status || 'pending'}
                              disabled={isUpdating}
                              onChange={(e) => updateStatus(leave.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className="ll-status-fixed">
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
                              background: leave.approved_position === 'HR' ? '#dbeafe' : '#dcfce7',
                              color: leave.approved_position === 'HR' ? '#1d4ed8' : '#166534',
                              fontWeight: 700,
                              fontSize: '12px',
                              marginBottom: '4px',
                            }}
                          >
                            {leave.approved_position || '—'}
                          </span>
                          <br />
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>
                            {/* {leave.approved_by || '—'} */}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}