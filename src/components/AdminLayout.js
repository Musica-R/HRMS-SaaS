import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiLogOut, FiCalendar, FiUsers, FiMenu, FiX, FiFileText, FiShield } from 'react-icons/fi';
import '../styles/AdminLayout.css';
import { BsSuitcase2 } from 'react-icons/bs';
import { MdOutlineNotificationsActive } from 'react-icons/md';
import { GoOrganization } from 'react-icons/go';
import { IoTicketOutline } from 'react-icons/io5';
import { MdOutlineFolderCopy } from "react-icons/md";
import { MdOutlineAddTask } from "react-icons/md";
import logo from "../assets/ass.jpeg";
import { BsCurrencyDollar } from "react-icons/bs";
import { getCompanyBranch, setCompanyBranch } from '../utils/companyContext';

const AdminLayout = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { company_id, branch_id } = getCompanyBranch();
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (!company_id) return;
        const BASE_URL = process.env.REACT_APP_API_BASE_URL;
        fetch(`${BASE_URL}/get-branch-for-company?company_id=${company_id}`)
            .then(res => res.json())
            .then(json => {
                if (json.success) setBranches(json.data);
            })
            .catch(err => console.error('Failed to load branches', err));
    }, [company_id]);

    const handleBranchChange = (e) => {
        setCompanyBranch({ company_id, branch_id: e.target.value });
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="admin-layout">

            {/* Mobile top bar */}
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                    <FiMenu />
                </button>
                <div className="brand-section">
                    <img src={logo} alt="Logo" className="brand-logo" />
                    <h2 className="mobile-brand">Admin Panel</h2>
                </div>
            </div>

            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>

                <div className="sidebar-header">
                    <div className="brand-section">
                        <img src={logo} alt="Logo" className="brand-logo" />
                        <h2>Admin Panel</h2>
                    </div>
                    <button className="sidebar-close-btn" onClick={closeSidebar}>
                        <FiX />
                    </button>
                </div>

                {/* Branch Switcher */}

                <div className="branch-switcher">
                    <label>Branch</label>
                    <select
                        className="branch-select"
                        value={branch_id || ''}
                        onChange={handleBranchChange}
                    >
                        <option value="" disabled>Select Branch</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <FiHome className="nav-icon" /><span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/admin/emp-list" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <FiUsers className="nav-icon" /> <span>Employee List</span>
                    </NavLink>

                    <NavLink to="/admin/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <FiCalendar className="nav-icon" /> <span>Attendance List</span>
                    </NavLink>

                    <NavLink to="/admin/leave-list" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <FiFileText className="nav-icon" /> <span>Leave List</span>
                    </NavLink>

                    <NavLink to="/admin/permission-list" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <FiShield className="nav-icon" /> <span>Permission List</span>
                    </NavLink>

                    <NavLink to="/admin/payroll-list" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <BsCurrencyDollar className="nav-icon" /> <span>Payroll</span>
                    </NavLink>

                    <NavLink to="/admin/add-holiday" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <BsSuitcase2 className="nav-icon" /> <span>Holiday</span>
                    </NavLink>

                    <NavLink to="/admin/add-notification" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <MdOutlineNotificationsActive className="nav-icon" /> <span>Notification</span>
                    </NavLink>

                    <NavLink to="/admin/add-company" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <GoOrganization className="nav-icon" /><span>Company Details</span>
                    </NavLink>

                    <NavLink to="/admin/raise-ticket" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <IoTicketOutline className="nav-icon" /> <span>Raise Ticket</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <FiLogOut className="nav-icon" /><span>Logout</span>
                    </button>
                </div>

            </aside>

            <main className="main-content">
                <Outlet />
            </main>

        </div>
    );
};

export default AdminLayout;