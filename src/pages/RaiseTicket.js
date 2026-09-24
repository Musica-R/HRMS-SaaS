import React, { useState, useEffect } from 'react';
import '../styles/RaiseTicket.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Ticket.json';
import { IoAdd } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RaiseTicket = () => {

  const { company_id, branch_id, shift } = getCompanyBranch();

  const [formData, setFormData] = useState({
    user_id: '',
    date: '',
    type: '',
    time: '',
    reason: '',
  });
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({
    month: currentMonth,
    year: currentYear,
  });

  const [raiseTicket, setRaiseTicket] = useState([]);
  const [activeForm, setActiveForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notificationId, setNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  const STATUS_CONFIG = {
    approved: {
      label: 'Approved',
      icon: <FiCheckCircle />,
      cls: 'status--approved',
    },
    pending: { label: 'Pending', icon: <FiClock />, cls: 'status--pending' },
    rejected: {
      label: 'Rejected',
      icon: <FiXCircle />,
      cls: 'status--rejected',
    },
  };

  // const defaultOptions = {
  //   loop: true,
  //   autoplay: true,
  //   animationData: animationData,
  //   rendererSettings: {
  //     preserveAspectRatio: 'xMidYMid slice',
  //   },
  // };

  // FORMAT TIME
  const formatTime = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';
    const [hour, minute] = timeString.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // GET USER INITIALS
  const getInitials = (name) => {
    if (!name) return 'UN';
    return name.substring(0, 2).toUpperCase();
  };

  /* ================= FETCH EMPLOYEES ================= */
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';
      const res = await fetch(`${BASE_URL}/employee-List?company_id=${company_id}&branch_id=${branch_id}${shiftParam}`);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
    setLoadingEmployees(false);
  };

  /* ================= FETCH RAISE TICKET ================= */
  useEffect(() => {
    const fetchRaiseTicket = async () => {
      try {
        const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';
        const response = await fetch(
          `${BASE_URL}/tickets?month=${dateFilter.month}&year=${dateFilter.year}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`
        );
        const result = await response.json();
        if (result.success) {
          setRaiseTicket(result.data);
        }
      } catch (error) {
        console.error('Error fetching Raise Ticket:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRaiseTicket();
    fetchEmployees();

  }, [activeForm, deleteId, dateFilter, updatingId, company_id, branch_id, shift]);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= RAISE TICKET FORM SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);

    try {
      const response = await fetch(`${BASE_URL}/ticket/create`, {
        method: 'POST',
        body: submitData,
      });
      const result = await response.json();
      if (response.ok) {
        console.log(result);
        alert(result.message || 'Ticket Created successfully!');
        setFormData({ user_id: '', date: '', type: '', time: '', reason: '' });
      } else {
        alert('Failed to create Ticket: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveForm(false);
    }
  };

  /* ================= UPDATE TICKET STATUS ================= */
  const handleStatusUpdate = async (id, status) => {
    const submitData = new FormData();
    submitData.append('id', id);
    submitData.append('status', status);
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);
    if (updatingId) return;
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/ticket/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: submitData,
      });
      const result = await response.json();
      if (response.ok) {
        console.log(result);
        alert(result.message || 'Ticket Status Updated successfully!');
      } else {
        alert('Failed to Update Ticket Status: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error Updating Ticket Status:', error);
      alert('Error Updating Ticket Status');
    } finally {
      setDeleteId(null);
      setUpdatingId(null);
    }
  };

  /* ================= TICKET DELETE ================= */
  const handleDelete = async (e) => {
    e.preventDefault();
    console.log(deleteId);
    const submitData = new FormData();
    submitData.append('id', deleteId);
    try {
      const response = await fetch(`${BASE_URL}/delete-Holida/${deleteId}?company_id=${company_id}&branch_id=${branch_id}`);
      const result = await response.json();
      if (response.ok) {
        console.log(result);
        alert(result.message || 'Ticket Deleted successfully!');
      } else {
        alert('Failed to Delete Ticket: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting Ticket:', error);
      alert('Error deleting Ticket');
    } finally {
      setDeleteId(null);
    }
  };

  /* ================= NOTIFICATION ================= */
  const handleNotification = async (e) => {
    e.preventDefault();
    console.log(notificationId);
    const submitData = new FormData();
    submitData.append('id', notificationId);
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);
    try {
      const response = await fetch(`${BASE_URL}/notification/send`, {
        method: 'POST',
        body: submitData,
      });
      const result = await response.json();
      if (response.ok) {
        console.log(result);
        alert(result.message || 'Notification Send successfully!');
      } else {
        alert('Failed to Send Notification: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in sending notification:', error);
      alert('Error sending notificaiton');
    } finally {
      setNotificationId(null);
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="rt-loading-container">
        <div className="rt-loader-pulse"></div>
        <p className="rt-loading-text">Loading Ticket records...</p>
      </div>
    );
  }

  return (
    <div className="rt-page fade-in-up">

      {/* ── HEADER ── */}
      <div className="rt-page-header">
        <div className="rt-header-left">
          <div className="rt-lottie-wrap">
            {/* <Lottie options={defaultOptions} height={64} width={64} /> */}
            <Lottie animationData={animationData} style={{ width: "64px", height: "64px" }} />
          </div>
          <div>
            <h1 className="rt-page-title">Ticket Records</h1>
            <p className="rt-page-sub">
              Raise tickets and monitor their progress to keep everything running smoothly.
            </p>
          </div>
        </div>
        <div className="rt-header-right">
          <div className="rt-stat-card">
            <span className="rt-stat-label">Monthly Records</span>
            <span className="rt-stat-value">{raiseTicket.length}</span>
          </div>
          <button
            className="rt-raise-btn"
            onClick={() => setActiveForm((prev) => !prev)}
          >
            <IoAdd className="rt-raise-icon" />
            Raise Ticket
          </button>
        </div>
      </div>

      {/* ── FILTER ROW ── */}
      <div className="rt-filter-row">
        <div className="rt-filter-group">
          <label className="rt-filter-label">Month</label>
          <select
            className="rt-filter-select"
            name="month"
            value={dateFilter.month}
            onChange={handleDate}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rt-filter-group">
          <label className="rt-filter-label">Year</label>

          <select
            className="rt-filter-select"
            name="year"
            value={dateFilter.year}
            onChange={handleDate}
          >
            {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* ── RAISE TICKET MODAL ── */}
      {activeForm &&
        createPortal(
          <div className="rt-modal-overlay" onClick={() => setActiveForm(false)}>
            <div className="rt-modal-box" onClick={(e) => e.stopPropagation()}>
              <button className="rt-modal-close" onClick={() => setActiveForm(false)}>×</button>
              <div className="rt-modal-header">
                <div className="rt-modal-icon-wrap">🎫</div>
                <h2 className="rt-modal-title">Raise a Ticket</h2>
                <p className="rt-modal-sub">Fill in the details to submit a correction request</p>
              </div>

              <form onSubmit={handleSubmit} className="rt-form-grid">
                <div className="rt-form-group">
                  <label className="rt-label">Employee</label>
                  <select
                    className="rt-input"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      {loadingEmployees ? 'Loading...' : 'Select Employee'}
                    </option>
                    {employees.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="rt-form-group">
                  <label className="rt-label">Date</label>
                  <input
                    className="rt-input"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="rt-form-group">
                  <label className="rt-label">Type</label>
                  <select
                    className="rt-input"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="clock_in">Check In</option>
                    <option value="clock_out">Check Out</option>
                  </select>
                </div>

                <div className="rt-form-group">
                  <label className="rt-label">Time</label>
                  <input
                    className="rt-input"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="rt-form-group rt-full-width">
                  <label className="rt-label">Reason</label>
                  <textarea
                    className="rt-input rt-textarea"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the reason for this ticket..."
                    required
                  />
                </div>

                <div className="rt-form-group rt-full-width">
                  <button type="submit" className="rt-submit-btn">
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── TABLE SECTION ── */}
      <div className="rt-section">
        <h2 className="rt-section-title">Raised Ticket History</h2>
        <div className="rt-table-card">
          <div className="rt-table-responsive">
            <table className="rt-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {raiseTicket.length > 0 ? (
                  raiseTicket.map((record) => {
                    const sc = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
                    const isUpdating = updatingId === record.id;

                    return (
                      <tr key={record.id} className="rt-table-row">
                        {/* EMPLOYEE */}
                        <td>
                          <div className="rt-emp-cell">
                            <div className="rt-avatar">{getInitials(record.user.employee.name)}</div>
                            <span className="rt-emp-name">
                              {record.user.employee.name || 'Unknown User'}
                            </span>
                          </div>
                        </td>

                        {/* DATE */}
                        <td className="rt-date-cell">{formatDate(record.date)}</td>

                        {/* CHECK IN */}
                        <td>
                          <span className={`rt-time-badge rt-time-in ${record.type !== 'clock_in' ? 'rt-time-nil' : ''}`}>
                            {record.type === 'clock_in' ? formatTime(record.time) : '--'}
                          </span>
                        </td>

                        {/* CHECK OUT */}
                        <td>
                          <span className={`rt-time-badge rt-time-out ${record.type !== 'clock_out' ? 'rt-time-nil' : ''}`}>
                            {record.type === 'clock_out' ? formatTime(record.time) : '--'}
                          </span>
                        </td>

                        {/* REASON */}
                        <td className="rt-reason-cell">{record.reason}</td>

                        {/* STATUS */}
                        <td>
                          <div className="rt-status-cell">
                            <span
                              className={`rt-status-pill ${record.status?.toLowerCase() === 'approved'
                                ? 'rt-status-approved'
                                : record.status?.toLowerCase() === 'rejected'
                                  ? 'rt-status-rejected'
                                  : 'rt-status-pending'
                                }`}
                            >
                              {sc.icon}&nbsp;{sc.label}
                            </span>
                            {record.late_checkin === 1 && (
                              <span
                                className="rt-late-badge"
                                title={`Late by ${record.late_checkin_time}`}
                              >
                                Late
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ textAlign: 'center' }}>
                          {record.status === 'pending' ? (
                            <select
                              className="rt-action-select"
                              value={record.status}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className="rt-status-fixed">
                              {sc.icon}&nbsp;{sc.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="rt-empty-state">
                      <div className="rt-empty-icon">📭</div>
                      <p>No ticket records found for this period.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteId &&
        createPortal(
          <div className="rt-modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="rt-confirm-box" onClick={(e) => e.stopPropagation()}>
              <button className="rt-modal-close" onClick={() => setDeleteId(null)}>×</button>
              <div className="rt-confirm-icon rt-confirm-danger">🗑️</div>
              <h2 className="rt-confirm-title">Delete Ticket</h2>
              <p className="rt-confirm-text">Are you sure you want to delete this ticket?</p>
              <div className="rt-confirm-actions">
                <button className="rt-btn rt-btn-secondary" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="rt-btn rt-btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── NOTIFICATION CONFIRM MODAL ── */}
      {notificationId &&
        createPortal(
          <div className="rt-modal-overlay" onClick={() => setNotificationId(null)}>
            <div className="rt-confirm-box" onClick={(e) => e.stopPropagation()}>
              <button className="rt-modal-close" onClick={() => setNotificationId(null)}>×</button>
              <div className="rt-confirm-icon rt-confirm-info">🔔</div>
              <h2 className="rt-confirm-title">Send Notification</h2>
              <p className="rt-confirm-text">Are you sure you want to send this notification?</p>
              <div className="rt-confirm-actions">
                <button className="rt-btn rt-btn-secondary" onClick={() => setNotificationId(null)}>
                  Cancel
                </button>
                <button className="rt-btn rt-btn-primary" onClick={handleNotification}>
                  Send
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RaiseTicket;