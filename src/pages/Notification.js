import React, { useState, useEffect } from 'react';
import '../styles/Notification.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Notification Bell.json';
import { IoAdd } from 'react-icons/io5';
import { MdDeleteOutline } from 'react-icons/md';
import { FaRegBell } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { getCompanyBranch } from '../utils/companyContext';


const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Notification = () => {

  // shift comes from the shared util (companyContext) — the one selected in the sidebar
  const { company_id, branch_id, shift } = getCompanyBranch();

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    desc: '',
  });

  const [notifications, setNotification] = useState([]);
  const [activeForm, setActiveForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notificationId, setNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentMonth = () => String(new Date().getMonth() + 1).padStart(2, '0');
  const getCurrentYear = () => String(new Date().getFullYear());

  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  // const defaultOptions = {
  //   loop: true,
  //   autoplay: true,
  //   animationData: animationData,
  //   rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  // };

  /* ================= FETCH NOTIFICATION ================= */
  useEffect(() => {
    const fetchNotification = async () => {
      try {
        // shift param built from the sidebar shift (same pattern as EmpList)
        const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';

        const response = await fetch(
          `${BASE_URL}/notifications?month=${month}&year=${year}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`
        );
        const result = await response.json();

        if (result.success) setNotification(result.data);
      } catch (error) {
        console.error('Error fetching Notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [activeForm, deleteId, month, year, company_id, branch_id, shift]);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= NOTIFICATION FORM SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) submitData.append(key, formData[key]);
    });
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);

    // send the shift selected in the sidebar
    if (shift) submitData.append('shift', shift);

    try {
      const response = await fetch(`${BASE_URL}/notification/create`, { method: 'POST', body: submitData });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Notification Created successfully!');
        setFormData({ title: '', type: '', desc: '' });
      } else {
        alert('Failed to create Notification: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveForm(false);
    }
  };

  /* ================= NOTIFICATION DELETE ================= */
  const handleDelete = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('id', deleteId);
    try {

      const response = await fetch(`${BASE_URL}/notification-delete?id=${deleteId}&company_id=${company_id}&branch_id=${branch_id}`);
      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Notification Deleted successfully!');
      } else {
        alert('Failed to Delete Notification: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification');
    } finally {
      setDeleteId(null);
    }
  };

  /* ================= SEND NOTIFICATION ================= */
  const handleNotification = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('id', notificationId);
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);
    try {
      const response = await fetch(`${BASE_URL}/notification/send`, { method: 'POST', body: submitData });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Notification Send successfully!');
      } else {
        alert('Failed to Send Notification: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in sending notification:', error);
      alert('Error sending notification');
    } finally {
      setNotificationId(null);
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="notif-loading">
        <div className="notif-spinner">
          <span></span><span></span><span></span>
        </div>
        <p>Loading notifications…</p>
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="notif-page fade-in-up">

      {/* ── HERO HEADER ── */}
      <div className="notif-hero">
        <div className="notif-hero-glow" />
        <div className="notif-hero-inner">
          <div className="notif-hero-lottie">
            {/* <Lottie options={defaultOptions} height={64} width={64} /> */}
            <Lottie animationData={animationData} style={{ width: "64px", height: "64px" }} />
          </div>
          <div className="notif-hero-text">
            <h1>Notifications</h1>
            <p>Centralize notification creation and ensure timely communication of meetings and key events across your organization.</p>
          </div>
          <div className="notif-hero-stat">
            <span className="stat-num">{notifications.length}</span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="notif-toolbar">
        <div className="notif-filters">
          <div className="filter-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="year-input"
            />
          </div>
        </div>
        <button className="notif-add-btn" onClick={() => setActiveForm((prev) => !prev)}>
          <IoAdd style={{ fontSize: '18px' }} />
          <span>New Notification</span>
        </button>
      </div>

      {/* ── SECTION HEADING ── */}
      <div className="notif-section-head">
        <span className="notif-section-title">Scheduled Notifications</span>
        <span className="notif-section-line" />
      </div>

      {/* ── CARDS GRID ── */}
      <div className="notif-grid">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <FaRegBell />
            </div>
            <p>No notifications found for {monthNames[parseInt(month) - 1]} {year}</p>
          </div>
        ) : (
          notifications.map((data, idx) => (
            <div className="notif-card" key={data.id} style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="notif-card-accent" />
              <div className="notif-card-top">
                <div className="notif-card-badge">{data.type}</div>
                <div className="notif-card-actions">
                  <button className="nca-btn send" onClick={() => setNotificationId(data.id)} title="Send notification">
                    <FaRegBell />
                  </button>
                  <button className="nca-btn delete" onClick={() => setDeleteId(data.id)} title="Delete">
                    <MdDeleteOutline />
                  </button>
                </div>
              </div>
              <h3 className="notif-card-title">{data.title}</h3>
              <p className="notif-card-desc">{data.description}</p>
            </div>
          ))
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {activeForm && createPortal(
        <div className="nmodal-overlay" onClick={() => setActiveForm(false)}>
          <div className="nmodal" onClick={(e) => e.stopPropagation()}>
            <div className="nmodal-header">
              <div className="nmodal-icon"><FaRegBell /></div>
              <div>
                <h2>Create Notification</h2>
                <p>Fill in the details below to schedule a new notification.</p>
              </div>
              <button className="nmodal-close" onClick={() => setActiveForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="nmodal-form">
              <div className="nfield">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Team meeting reminder" required />
              </div>
              <div className="nfield">
                <label>Scheduled Date</label>
                <input type="date" name="type" value={formData.type} onChange={handleChange} required />
              </div>
              <div className="nfield full">
                <label>Description</label>
                <textarea name="desc" value={formData.desc} onChange={handleChange} rows="4" placeholder="Describe the notification content…" required />
              </div>
              <div className="nmodal-actions">
                <button type="button" className="nbtn nbtn-ghost" onClick={() => setActiveForm(false)}>Cancel</button>
                <button type="submit" className="nbtn nbtn-primary">Create Notification</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteId && createPortal(
        <div className="nmodal-overlay" onClick={() => setDeleteId(null)}>
          <div className="nmodal nmodal-confirm" onClick={(e) => e.stopPropagation()}>
            <button className="nmodal-close" onClick={() => setDeleteId(null)}>×</button>
            <div className="nconfirm-icon danger">
              <MdDeleteOutline />
            </div>
            <h2>Delete Notification?</h2>
            <p>This action cannot be undone. The notification will be permanently removed.</p>
            <div className="nmodal-actions centered">
              <button className="nbtn nbtn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="nbtn nbtn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SEND CONFIRM ── */}
      {notificationId && createPortal(
        <div className="nmodal-overlay" onClick={() => setNotificationId(null)}>
          <div className="nmodal nmodal-confirm" onClick={(e) => e.stopPropagation()}>
            <button className="nmodal-close" onClick={() => setNotificationId(null)}>×</button>
            <div className="nconfirm-icon send">
              <FaRegBell />
            </div>
            <h2>Send Notification?</h2>
            <p>This will immediately push the notification to all recipients in your organization.</p>
            <div className="nmodal-actions centered">
              <button className="nbtn nbtn-ghost" onClick={() => setNotificationId(null)}>Cancel</button>
              <button className="nbtn nbtn-send" onClick={handleNotification}>Send Now</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Notification;