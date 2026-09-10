import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserData = () => {
            try {
                const possibleKeys = ['user', 'adminData', 'admin', 'userData', 'authUser'];
                let foundData = null;

                for (let key of possibleKeys) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            if (parsed && typeof parsed === 'object') {
                                foundData = parsed.user ? parsed.user : parsed;
                                break;
                            }
                        } catch (e) { }
                    }
                }
                setUserData(foundData);
            } catch (error) {
                console.error("Error loading user data", error);
            }
        };

        loadUserData();
    }, []);

    const getInitials = (name) => {
        if (!name) return 'AD';
        return name.substring(0, 2).toUpperCase();
    };

    const legalItems = [
        { label: 'Terms and Conditions', desc: 'Read the terms of using this app', path: '/terms-and-conditions' },
        { label: 'Privacy Policy', desc: 'How we collect and use your data', path: '/privacy-policy' },
        { label: 'Account Deletion', desc: 'Request permanent account removal', path: '/account-deletion' },
    ];

    return (
        <div className="settings-page">
            <h1 className="settings-title">Settings</h1>

            <div className="settings-cards-row">

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-avatar">
                            {getInitials(userData?.name)}
                        </div>
                        <div>
                            <h3 className="settings-user-name">{userData?.name || 'Unknown User'}</h3>
                            <p className="settings-user-role">{userData?.position || userData?.role || 'Staff Member'}</p>
                        </div>
                    </div>

                    <div className="settings-detail-list">
                        <div className="settings-detail-item">
                            <span className="detail-label">Name</span>
                            <span className="detail-value">{userData?.name || 'N/A'}</span>
                        </div>
                        <div className="settings-detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{userData?.email || 'N/A'}</span>
                        </div>
                        <div className="settings-detail-item">
                            <span className="detail-label">Role</span>
                            <span className="detail-value">{userData?.role || userData?.mobile || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="settings-card">
                    <h3 className="settings-card-title">Legal & Account</h3>
                    <div className="settings-menu-list">
                        {legalItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="settings-menu-item"
                                onClick={() => navigate(item.path)}
                            >
                                <div>
                                    <h4>{item.label}</h4>
                                    <p>{item.desc}</p>
                                </div>
                                <span className="chevron">›</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;