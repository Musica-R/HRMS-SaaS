import React, { useState, useEffect } from 'react';
import '../styles/DashboardHome.css';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiMoreVertical,
    FiSettings,
    // FiChevronDown,
    FiCalendar,
    FiUserPlus,
    FiFolderPlus,
    FiFileText,
    // FiBriefcase,
    // FiActivity,
    // FiGift,
    // FiTrendingUp
} from 'react-icons/fi';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const DashboardHome = () => {

    const navigate = useNavigate();

    const { company_id, branch_id } = getCompanyBranch();
    // console.log('[DashboardHome] render with', company_id, branch_id); // ADD THIS

    const [dashboardData, setDashboardData] = useState({
        total_employees: 0,
        present_count: 0,
        absent_count: 0,
        late_checkin_count: 0
    });
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAdminData = () => {
            try {
                const possibleKeys = ['user', 'adminData', 'admin', 'userData', 'authUser'];
                let foundData = null;

                for (let key of possibleKeys) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            if (parsed && typeof parsed === 'object') {
                                if (parsed.user) {
                                    foundData = parsed.user;
                                } else {
                                    foundData = parsed;
                                }
                                break;
                            }
                        } catch (e) { }
                    }
                }

                setAdminData(foundData);
                return foundData;
            } catch (error) {
                console.error("Error loading admin data", error);
                return null;
            }
        };

        loadAdminData();
    }, []);

    // ── Fetch dashboard stats whenever company_id or branch_id changes ──
    useEffect(() => {
        const fetchDashboardData = async (companyId, branchId) => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (companyId) params.append('company_id', companyId);
                if (branchId) params.append('branch_id', branchId);

                const response = await fetch(`${BASE_URL}/dashboard-list?${params.toString()}`);
                const result = await response.json();
                if (result.success) {
                    setDashboardData(result.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData(company_id, branch_id);
    }, [company_id, branch_id]); // ← re-fetches automatically on branch switch, same as HolidayForm

    const { total_employees, present_count, absent_count, late_checkin_count } = dashboardData;

    const hasData = total_employees > 0 || present_count > 0 || absent_count > 0 || late_checkin_count > 0;

    const getInitials = (name) => {
        if (!name) return 'AD';
        return name.substring(0, 2).toUpperCase();
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `https://hrmssaas.mpdatahub.com/images/${imagePath}`;
    };

    // ---- Today's Summary donut ----
    const presentPct = total_employees ? Math.round((present_count / total_employees) * 100) : 0;
    const absentPct = total_employees ? Math.round((absent_count / total_employees) * 100) : 0;
    const latePct = total_employees ? Math.round((late_checkin_count / total_employees) * 100) : 0;

    const donutStyle = total_employees
        ? {
            background: `conic-gradient(
                var(--success) 0% ${presentPct}%,
                var(--danger) ${presentPct}% ${presentPct + absentPct}%,
                var(--warning) ${presentPct + absentPct}% ${presentPct + absentPct + latePct}%,
                var(--primary-soft) ${presentPct + absentPct + latePct}% 100%
            )`
        }
        : { background: 'var(--primary-soft)' };

    const summaryRows = [
        { label: 'Present', value: present_count, pct: presentPct, color: 'var(--success)' },
        { label: 'Absent', value: absent_count, pct: absentPct, color: 'var(--danger)' },
        { label: 'Late', value: late_checkin_count, pct: latePct, color: 'var(--warning)' },
        { label: 'Total', value: total_employees, pct: 100, color: 'var(--primary)' }
    ];

    const quickActions = [
        { label: 'Mark Attendance', icon: <FiCheckCircle />, tone: 'blue', onClick: () => navigate('/admin/attendance') },
        { label: 'Add Employee', icon: <FiUserPlus />, tone: 'green', onClick: () => navigate('/admin/add-employee') },
        { label: 'Permission', icon: <FiFolderPlus />, tone: 'purple', onClick: () => navigate('/admin/pro-list') },
        { label: 'Leave Request', icon: <FiFileText />, tone: 'orange', onClick: () => navigate('/admin/leave-list') }
    ];

    if (loading) {
        return (
            <div className="dashboard-home loading-container">
                <div className="loader-pulse"></div>
                <p>Loading your workspace...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-home">

            {/* Welcome banner */}
            <div className="welcome-banner glass-panel fade-in-up">
                <div className="welcome-content">
                    <div className="welcome-text">
                        <span className="date-badge">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                        <h1 className="page-title">Welcome back, <span className="highlight-text">{adminData?.name || 'Admin'}</span></h1>
                        <p className="page-subtitle">Here is your daily overview and workforce status.</p>
                    </div>

                    <div className="profile-card">
                        <div className="profile-avatar">
                            {adminData?.profile_img && (
                                <img
                                    src={getImageUrl(adminData.profile_img)}
                                    alt="Profile"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            )}
                            <div className="avatar-fallback" style={{ display: adminData?.profile_img ? 'none' : 'flex' }}>
                                {getInitials(adminData?.name)}
                            </div>
                        </div>
                        <div className="profile-info">
                            <h3 className="profile-name">{adminData?.name || 'Unknown User'}</h3>
                            <div className="profile-role">{adminData?.position || adminData?.role || 'company'}</div>
                            <span className="meta-item">{adminData?.empid || 'No ID assigned'}</span>
                        </div>
                        <button className="settings-icon-corner" onClick={() => navigate("/admin/settings")} title="Settings">
                            <FiSettings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="stats-container">
                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-icon icon-blue"><FiUsers /></div>
                    <div className="stat-content">
                        <div className="stat-card-top">
                            <h3>Total Workforce</h3>
                            <FiMoreVertical className="stat-menu" />
                        </div>
                        <div className="stat-value">{total_employees}</div>
                        <div className="stat-trend positive"><span>+</span> Active Data</div>
                    </div>
                </div>

                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.2s' }} onClick={() => navigate("/admin/attendance")}>
                    <div className="stat-icon icon-green"><FiCheckCircle /></div>
                    <div className="stat-content">
                        <div className="stat-card-top">
                            <h3>Present Today</h3>
                            <FiMoreVertical className="stat-menu" />
                        </div>
                        <div className="stat-value">{present_count}</div>
                        <div className="stat-trend positive">
                            <span>{total_employees > 0 ? (present_count / total_employees * 100).toFixed(0) : 0}%</span> Attendance
                        </div>
                    </div>
                </div>

                <div
                    className="stat-card glass-panel fade-in-up"
                    style={{ animationDelay: '0.3s' }}
                    onClick={() => navigate("/admin/attendance", { state: { userType: "emp_absent" } })}
                >
                    <div className="stat-icon icon-red"><FiXCircle /></div>
                    <div className="stat-content">
                        <div className="stat-card-top">
                            <h3>Absent</h3>
                            <FiMoreVertical className="stat-menu" />
                        </div>
                        <div className="stat-value">{absent_count}</div>
                        <div className="stat-trend negative">Attention Required</div>
                    </div>
                </div>

                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.4s' }} onClick={() => navigate("/admin/attendance")}>
                    <div className="stat-icon icon-orange"><FiClock /></div>
                    <div className="stat-content">
                        <div className="stat-card-top">
                            <h3>Late Arrivals</h3>
                            <FiMoreVertical className="stat-menu" />
                        </div>
                        <div className="stat-value">{late_checkin_count}</div>
                        <div className="stat-trend warning">Delayed Entry</div>
                    </div>
                </div>
            </div>

            {/* Main row: chart + summary/quick actions */}
            <div className="main-row">

                <div className="chart-wrapper glass-panel fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <div className="chart-header">
                        <h2>Workforce Distribution</h2>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="legend-dot emp-dot"></span>Total</span>
                            <span className="legend-item"><span className="legend-dot pres-dot"></span>Present</span>
                            <span className="legend-item"><span className="legend-dot abs-dot"></span>Absent</span>
                            <span className="legend-item"><span className="legend-dot late-dot"></span>Late</span>
                        </div>
                        {/* <button className="week-select" type="button">
                            This Week <FiChevronDown size={14} />
                        </button> */}
                    </div>

                    {hasData ? (
                        <div className="bar-chart-container">
                            <div className="bar-chart">
                                {[
                                    { label: 'Total', value: total_employees, cls: 'employee-bar' },
                                    { label: 'Present', value: present_count, cls: 'present-bar' },
                                    { label: 'Absent', value: absent_count, cls: 'absent-bar' },
                                    { label: 'Late', value: late_checkin_count, cls: 'late-bar' }
                                ].map((item) => {
                                    const maxNumber = Math.max(total_employees, present_count, absent_count, late_checkin_count, 1);
                                    const scaleBase = Math.max(maxNumber * 1.2, 10);
                                    const pct = Math.max((item.value / scaleBase) * 100, 5);
                                    return (
                                        <div className="bar-group" key={item.label}>
                                            <div className={`bar ${item.cls}`} style={{ height: `${pct}%` }}>
                                                <div className="bar-tooltip">{item.value} {item.label}</div>
                                            </div>
                                            <span className="bar-label">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="chart-frame">
                                <div className="chart-y-axis">
                                    {[100, 80, 60, 40, 20, 0].map((tick) => (
                                        <span key={tick}>{tick}</span>
                                    ))}
                                </div>
                                <div className="chart-plot-area">
                                    <div className="chart-gridlines">
                                        {[0, 1, 2, 3, 4, 5].map((i) => <span key={i}></span>)}
                                    </div>
                                    <div className="chart-empty-overlay">
                                        <div className="empty-icon"><FiCalendar size={26} /></div>
                                        <p className="empty-title">No data available</p>
                                        <p className="empty-subtitle">Workforce data will appear here</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-x-axis">
                                <span className="chart-x-axis-spacer"></span>
                                <div className="chart-x-labels">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                        <span key={day}>{day}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="side-column">
                    <div className="summary-card glass-panel fade-in-up cardnew" style={{ animationDelay: '0.55s' }}>
                        <h2>Today's Summary</h2>
                        <div className="summary-body">
                            <div className="donut" style={donutStyle}>
                                <div className="donut-hole"></div>
                            </div>
                            <div className="summary-list">
                                {summaryRows.map((row) => (
                                    <div className="summary-row" key={row.label}>
                                        <span className="summary-label">
                                            <span className="summary-dot" style={{ background: row.color }}></span>
                                            {row.label}
                                        </span>
                                        <span className="summary-values">{row.value} ({row.pct}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="quick-actions-card glass-panel fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <h2>Quick Actions</h2>
                        <div className="quick-actions-grid">
                            {quickActions.map((action) => (
                                <button key={action.label} className={`quick-action-btn tone-${action.tone}`} onClick={action.onClick}>
                                    <span className="quick-action-icon">{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row */}

            {/* <div className="bottom-row">
                <div className="info-card glass-panel fade-in-up" style={{ animationDelay: '0.7s' }}>
                    <h2><FiActivity className="info-card-icon" /> Recent Activities</h2>
                    <div className="info-empty">
                        <FiBriefcase size={22} />
                        <p className="empty-title">No recent activities</p>
                        <p className="empty-subtitle">Activities will appear here</p>
                    </div>
                </div>

                <div className="info-card glass-panel fade-in-up" style={{ animationDelay: '0.75s' }}>
                    <h2><FiCalendar className="info-card-icon" /> Attendance Overview</h2>
                    <div className="info-empty">
                        <FiCalendar size={22} />
                        <p className="empty-title">No attendance records</p>
                        <p className="empty-subtitle">Attendance overview will appear here</p>
                    </div>
                </div>

                <div className="info-card glass-panel fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <div className="info-card-header">
                        <h2><FiGift className="info-card-icon" /> Upcoming Holidays</h2>
                        <button className="view-all-link" type="button" onClick={() => navigate('/admin/add-holiday')}>View All</button>
                    </div>
                    <div className="info-empty">
                        <FiCalendar size={22} />
                        <p className="empty-title">No upcoming holidays</p>
                        <p className="empty-subtitle">Enjoy your day!</p>
                    </div>
                </div>
            </div> */}

        </div>
    );
};

export default DashboardHome;