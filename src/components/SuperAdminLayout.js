import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { GoOrganization } from 'react-icons/go';
import { MdOutlineAddTask } from 'react-icons/md';
import '../styles/AdminLayout.css';
import logo from "../assets/ass.jpeg";

const SuperAdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="admin-layout">
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                    <FiMenu />
                </button>
                <div className="brand-section">
                    <img src={logo} alt="Logo" className="brand-logo" />
                    <h2 className="mobile-brand">Super Admin</h2>
                </div>
            </div>

            {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-section">
                        <img src={logo} alt="Logo" className="brand-logo" />
                        <h2>Super Admin</h2>
                    </div>
                    <button className="sidebar-close-btn" onClick={closeSidebar}>
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/superadmin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <GoOrganization className="nav-icon" /><span>Company List</span>
                    </NavLink>

                    <NavLink to="/superadmin/add-company" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
                        <MdOutlineAddTask className="nav-icon" /><span>Add Company</span>
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

export default SuperAdminLayout;