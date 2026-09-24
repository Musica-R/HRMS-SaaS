import React, { useState, useEffect } from 'react';
import '../styles/HolidayForm.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Confetti.json';
import { IoAdd } from 'react-icons/io5';
import { MdDeleteOutline } from 'react-icons/md';
import { FaRegBell, FaThList } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ── Holiday type config ── */
const HOLIDAY_TYPE = {
  'W-H': { label: 'W-Holiday', fullLabel: 'Weekend Holiday', color: '#FF9500', bg: '#FFF3E0', border: '#FFB74D', cellClass: 'hol-cal-cell--wh' },
  'C-H': { label: 'C-Holiday', fullLabel: 'Common Holiday', color: '#8B5CF6', bg: '#F3EFFF', border: '#C4B5FD', cellClass: 'hol-cal-cell--ch' },
  'L-H': { label: 'L-Holiday', fullLabel: 'Local Holiday', color: '#0F6E56', bg: '#E6F5F0', border: '#5DB99A', cellClass: 'hol-cal-cell--lh' },
};


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HolidayForm = () => {

  // ✅ shift now comes from the shared util (companyContext), same as DashboardHome —
  // no local dropdown here; switching the shift globally (e.g. from the topbar
  // selector like Dashboard uses) automatically re-fetches holidays below.
  const { company_id, branch_id, shift } = getCompanyBranch();
  const [formData, setFormData] = useState({ title: '', holiday_date: '', description: '', type: '' });

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const [dateFilter, setDateFilter] = useState({ month: currentMonth, year: currentYear });
  const [holidays, setHolidays] = useState([]);
  const [activeForm, setActiveForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notificationId, setNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listModal, setListModal] = useState(false);
  const [tooltipHoliday, setTooltipHoliday] = useState(null);

  const monthOptions = [
    { label: 'January', value: '1' }, { label: 'February', value: '2' },
    { label: 'March', value: '3' }, { label: 'April', value: '4' },
    { label: 'May', value: '5' }, { label: 'June', value: '6' },
    { label: 'July', value: '7' }, { label: 'August', value: '8' },
    { label: 'September', value: '9' }, { label: 'October', value: '10' },
    { label: 'November', value: '11' }, { label: 'December', value: '12' },
  ];

  /* ── FETCH ── */
  useEffect(() => {
    setLoading(true);
    const fetchHolidays = async () => {
      try {

        // ✅ shift param built from the util's shift value (global), not a local dropdown
        const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';

        const response = await fetch(`${BASE_URL}/holiday/list?month=${dateFilter.month}&year=${dateFilter.year}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`);
        const result = await response.json();

        if (result.success) setHolidays(result.data);
        else setHolidays([]);
      } catch (error) {
        console.error('Error fetching Holidays:', error);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, [activeForm, deleteId, dateFilter, company_id, branch_id, shift]); // ✅ shift added — refetches automatically when the global shift changes

  /* ── Build holiday map keyed by day number ── */
  const holidayMap = {};
  holidays.forEach(h => {
    const day = parseInt(h.holiday_date.split('-')[2], 10);
    if (!holidayMap[day]) holidayMap[day] = [];
    holidayMap[day].push(h);
  });

  /* ── Calendar grid ── */
  const month = parseInt(dateFilter.month, 10) - 1;
  const year = parseInt(dateFilter.year, 10);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, type: 'prev' });
  for (let d = 1; d <= daysInMonth; d++)   cells.push({ day: d, type: 'current' });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++)     cells.push({ day: d, type: 'next' });

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) submitData.append(key, formData[key]);
    });
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);
    if (shift) submitData.append('shift', shift);
    try {
      const response = await fetch(`${BASE_URL}/holiday/create`, { method: 'POST', body: submitData });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Holiday Created successfully!');
        setFormData({ title: '', holiday_date: '', description: '', type: '' });
      } else {
        alert('Failed to create Holiday: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error submitting form');
    } finally {
      setActiveForm(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    try {

      const shiftParam = shift ? `&shift=${encodeURIComponent(shift)}` : '';
      const response = await fetch(`${BASE_URL}/delete-Holiday/${deleteId}?company_id=${company_id}&branch_id=${branch_id}${shiftParam}`);
      const result = await response.json();

      if (response.ok) alert(result.message || 'Holiday Deleted successfully!');
      else alert('Failed to Delete Holiday: ' + (result.message || 'Unknown error'));
    } catch (error) {
      alert('Error deleting holiday');
    } finally {
      setDeleteId(null);
    }
  };

  const handleNotification = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('id', notificationId);
    submitData.append('company_id', company_id);
    submitData.append('branch_id', branch_id);
    if (shift) submitData.append('shift', shift);
    try {
      const response = await fetch(`${BASE_URL}/send-holiday-notification`, { method: 'POST', body: submitData });
      const result = await response.json();
      if (response.ok) alert(result.message || 'Holiday Notification Send successfully!');
      else alert('Failed to Send Holiday Notification: ' + (result.message || 'Unknown error'));
    } catch (error) {
      alert('Error sending holiday notification');
    } finally {
      setNotificationId(null);
    }
  };

  const isToday = (day) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  /* ── Determine cell class & badge for a day ── */
  const getCellMeta = (day, isCurrent) => {
    if (!isCurrent) return { cellClass: 'hol-cal-cell--dim', badge: null, holidays: [] };

    const dayHolidays = holidayMap[day] || [];

    if (dayHolidays.length > 0) {
      const h = dayHolidays[0];
      const cfg = HOLIDAY_TYPE[h.type] || HOLIDAY_TYPE['L-H'];
      return {
        cellClass: cfg.cellClass,
        badge: cfg.label,
        holidays: dayHolidays,
      };
    }

    /* You can wire attendance status here from your attendance API */
    return { cellClass: '', badge: null, holidays: [] };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');

    return `${day}-${month}-${year}`;
  };

  if (loading) {
    return (
      <div className="hol-loading">
        <div className="hol-spinner"><span /><span /><span /></div>
        <p>Loading holiday records…</p>
      </div>
    );
  }

  return (
    <div className="hol-page fade-in-up">

      {/* ── HERO ── */}
      <div className="hol-hero">
        <div className="hol-hero-glow" />
        <div className="hol-hero-inner">
          <div className="hol-hero-lottie">
            <Lottie animationData={animationData} style={{ width: '64px', height: '64px' }} />
          </div>
          <div className="hol-hero-text">
            <h1>Holiday Records</h1>
            <p>Centralize and manage all holiday schedules and special occasions across your organization.</p>
          </div>
          <div className="hol-hero-stat">
            <span className="hol-stat-num">{holidays.length}</span>
            <span className="hol-stat-label">This Month</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="hol-toolbar">
        <div className="hol-filters">
          <div className="hol-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select name="month" value={dateFilter.month} onChange={handleDate}>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="hol-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <select name="year" value={dateFilter.year} onChange={handleDate}>
              {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* ✅ No local shift dropdown here — shift comes globally from
              getCompanyBranch() (companyContext util), same source
              DashboardHome / EmpList / AttendanceList / LeaveList /
              PermissionList / Payroll / RaiseTicket use. Switching shift
              elsewhere in the app automatically re-fetches this page's
              holiday list via the useEffect dependency on `shift`. */}
        </div>
        <div className="hol-toolbar-actions">
          <button className="hol-list-btn" onClick={() => setListModal(true)}>
            <FaThList style={{ fontSize: '14px' }} />
            <span>View Holiday List</span>
          </button>
          <button className="hol-add-btn" onClick={() => setActiveForm(prev => !prev)}>
            <IoAdd style={{ fontSize: '18px' }} />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* ── SECTION HEADING ── */}
      <div className="hol-section-head">
        <span className="hol-section-title">{MONTH_NAMES[month]} {year} — Calendar</span>
        <span className="hol-section-line" />
      </div>

      {/* ── CALENDAR ── */}
      <div className="hol-calendar-wrap">
        <div className="hol-cal-title">{MONTH_NAMES[month]} {year}</div>

        {/* Day headers */}
        <div className="hol-cal-header">
          {DAY_LABELS.map(d => (
            <div key={d} className="hol-cal-day-label">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="hol-cal-grid">
          {cells.map((cell, idx) => {
            const isCurrent = cell.type === 'current';
            const today = isCurrent && isToday(cell.day);
            const { cellClass, badge, holidays: dayHols } = getCellMeta(cell.day, isCurrent);

            return (
              <div
                key={idx}
                className={`hol-cal-cell ${cellClass} ${today ? 'hol-cal-cell--today' : ''}`}
                onClick={() => {
                  if (dayHols.length === 1) setTooltipHoliday(dayHols[0]);
                  else if (dayHols.length > 1) setTooltipHoliday(dayHols[0]);
                }}
                title={dayHols.map(h => `${h.title} - ${formatDate(h.holiday_date)}`).join(', ')}
              >
                <span className={`hol-cal-num ${today ? 'hol-cal-num--today' : ''}`}>
                  {cell.day}
                </span>
                {badge && <span className="hol-cal-badge">{badge}</span>}
                {today && !badge && <span className="hol-cal-today-label">Today</span>}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="hol-cal-legend">
          {/* <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#34C759' }} />
            <span className="hol-legend-label">Present</span>
          </div>
          <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#E5E5EA', border: '1px solid #ccc' }} />
            <span className="hol-legend-label">Absent</span>
          </div>
          <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#3B82F6' }} />
            <span className="hol-legend-label">Leave</span>
          </div> */}
          <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#FF9500' }} />
            <span className="hol-legend-label">Weekend Holiday</span>
          </div>
          <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#8B5CF6' }} />
            <span className="hol-legend-label">Common Holiday</span>
          </div>
          <div className="hol-legend-item">
            <span className="hol-legend-dot" style={{ background: '#0F6E56' }} />
            <span className="hol-legend-label">Local Holiday</span>
          </div>
        </div>
      </div>

      {/* ── HOLIDAY DETAIL TOOLTIP MODAL ── */}
      {tooltipHoliday && createPortal(
        <div className="hmodal-overlay" onClick={() => setTooltipHoliday(null)}>
          <div className="hmodal hmodal-detail" onClick={e => e.stopPropagation()}>
            <button className="hmodal-close" onClick={() => setTooltipHoliday(null)}>×</button>
            {(() => {
              const cfg = HOLIDAY_TYPE[tooltipHoliday.type] || HOLIDAY_TYPE['L-H'];
              return (
                <>
                  <div className="hdetail-top" style={{ background: cfg.bg, borderBottom: `2px solid ${cfg.border}` }}>
                    <span className="hdetail-type-badge" style={{ background: cfg.color }}>{cfg.fullLabel}</span>
                    <h2 className="hdetail-title">{tooltipHoliday.title}</h2>

                    <span className="hdetail-date">
                      {formatDate(tooltipHoliday.holiday_date)}
                    </span>

                  </div>
                  <div className="hdetail-body">
                    <p>{tooltipHoliday.description}</p>
                    <div className="hmodal-actions" style={{ marginTop: '20px', gridColumn: 'unset', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button className="hbtn hbtn-ghost" onClick={() => setTooltipHoliday(null)}>Close</button>
                      <button className="hbtn hbtn-send" onClick={() => { setNotificationId(tooltipHoliday.id); setTooltipHoliday(null); }}>
                        <FaRegBell style={{ marginRight: 6 }} /> Notify
                      </button>
                      <button className="hbtn hbtn-danger" onClick={() => { setDeleteId(tooltipHoliday.id); setTooltipHoliday(null); }}>
                        <MdDeleteOutline style={{ marginRight: 4 }} /> Delete
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ── HOLIDAY LIST MODAL ── */}
      {listModal && createPortal(
        <div className="hmodal-overlay" onClick={() => setListModal(false)}>
          <div className="hmodal hmodal-list" onClick={e => e.stopPropagation()}>
            <div className="hmodal-header">
              <div className="hmodal-icon"><FaThList size={16} /></div>
              <div>
                <h2>Holiday List</h2>
                <p>{MONTH_NAMES[month]} {year} — {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="hmodal-close" onClick={() => setListModal(false)}>×</button>
            </div>
            <div className="hlist-scroll">
              {holidays.length === 0 ? (
                <div className="hol-empty" style={{ padding: '48px 24px' }}>
                  <div className="hol-empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p>No holidays found for this period.</p>
                </div>
              ) : (
                <div className="hlist-cards">
                  {holidays.map((data, idx) => {
                    const cfg = HOLIDAY_TYPE[data.type] || HOLIDAY_TYPE['L-H'];
                    return (
                      <div
                        className="hol-card"
                        key={data.id}
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
                        <div className="hol-card-accent" style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.border})` }} />
                        <div className="hol-card-top">
                          <div className="hol-card-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                            {formatDate(data.holiday_date)}
                          </div>
                          <div className="hol-card-actions">
                            <button className="hca-btn send" onClick={() => setNotificationId(data.id)} title="Send notification">
                              <FaRegBell />
                            </button>
                            <button className="hca-btn delete" onClick={() => setDeleteId(data.id)} title="Delete">
                              <MdDeleteOutline />
                            </button>
                          </div>
                        </div>
                        <div className="hol-card-type" style={{ color: cfg.color }}>{cfg.fullLabel}</div>
                        <h3 className="hol-card-title">{data.title}</h3>
                        <p className="hol-card-desc">{data.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE MODAL ── */}
      {activeForm && createPortal(
        <div className="hmodal-overlay" onClick={() => setActiveForm(false)}>
          <div className="hmodal" onClick={e => e.stopPropagation()}>
            <div className="hmodal-header">
              <div className="hmodal-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h2>Holiday Planner</h2>
                <p>Fill in the details below to add a new holiday.</p>
              </div>
              <button className="hmodal-close" onClick={() => setActiveForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="hmodal-form">
              <div className="hfield">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Diwali" required />
              </div>
              <div className="hfield">
                <label>Holiday Date</label>
                <input type="date" name="holiday_date" value={formData.holiday_date} onChange={handleChange} required />
              </div>
              <div className="hfield">
                <label>Holiday Type</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  <option value="L-H">Local Holiday</option>
                  <option value="C-H">Common Holiday</option>
                  <option value="W-H">Weekend Holiday</option>
                </select>
              </div>
              <div className="hfield full">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the holiday…" required />
              </div>
              <div className="hmodal-actions">
                <button type="button" className="hbtn hbtn-ghost" onClick={() => setActiveForm(false)}>Cancel</button>
                <button type="submit" className="hbtn hbtn-primary">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteId && createPortal(
        <div className="hmodal-overlay" onClick={() => setDeleteId(null)}>
          <div className="hmodal hmodal-confirm" onClick={e => e.stopPropagation()}>
            <button className="hmodal-close" onClick={() => setDeleteId(null)}>×</button>
            <div className="hconfirm-icon danger"><MdDeleteOutline /></div>
            <h2>Delete Holiday?</h2>
            <p>This action cannot be undone. The holiday will be permanently removed.</p>
            <div className="hmodal-actions centered">
              <button className="hbtn hbtn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="hbtn hbtn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── NOTIFICATION CONFIRM ── */}
      {notificationId && createPortal(
        <div className="hmodal-overlay" onClick={() => setNotificationId(null)}>
          <div className="hmodal hmodal-confirm" onClick={e => e.stopPropagation()}>
            <button className="hmodal-close" onClick={() => setNotificationId(null)}>×</button>
            <div className="hconfirm-icon send"><FaRegBell /></div>
            <h2>Send Holiday Notification?</h2>
            <p>This will immediately push the holiday notification to all recipients in your organization.</p>
            <div className="hmodal-actions centered">
              <button className="hbtn hbtn-ghost" onClick={() => setNotificationId(null)}>Cancel</button>
              <button className="hbtn hbtn-send" onClick={handleNotification}>Send Now</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default HolidayForm;