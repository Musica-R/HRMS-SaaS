import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import DashboardHome from './pages/DashboardHome';
import RegistrationForm from './pages/RegistrationForm';
import AttendanceList from './pages/AttendanceList';
import EmpList from './pages/EmpList';
import LeaveList from './pages/LeaveList';
import PermissionList from './pages/PermissionList';
import './styles/App.css';
import HolidayForm from './pages/HolidayForm';
import Notification from './pages/Notification';
import CompanyDetails from './pages/CompanyDetails';
import RaiseTicket from './pages/RaiseTicket';
import ProtectedRoute from './pages/ProtectedRoute';
import TeamManagement from './pages/TeamManagement';
import Montlyreport from './pages/Montlyreport';
import CreateProject from './pages/Createproject';
import TaskStatusPanel from './pages/TaskStatusPanel';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountDeletion from './pages/AccountDeletion';
import SuperAdminLayout from './components/SuperAdminLayout';
import CompanyList from './pages/CompanyList';
import AddCompany from './pages/AddCompany';


function App() {

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));


  return (
    <Router>

      <div className="App">

        <Routes>

          <Route path="/"
            element={token && token !== "undefined" && token !== "null" ?
              (
                user?.role === "company" ? (<Navigate to="/admin" replace />) :
                  user?.role === "superadmin" ? (<Navigate to="/superadmin" replace />) :
                    (<Login />)
              ) : (<Login />)} />

          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['company']}> <AdminLayout /> </ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="add-employee" element={<RegistrationForm />} />
            <Route path="add-team" element={<TeamManagement />} />
            <Route path="emp-list" element={<EmpList />} />
            <Route path="pro-list" element={<CreateProject />} />
            <Route path="task-list" element={<TaskStatusPanel />} />
            <Route path="leave-list" element={<LeaveList />} />
            <Route path="permission-list" element={<PermissionList />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="payroll-list" element={<Payroll />} />
            <Route path="add-holiday" element={<HolidayForm />} />
            <Route path="add-notification" element={<Notification />} />
            <Route path="add-company" element={<CompanyDetails />} />
            <Route path="raise-ticket" element={<RaiseTicket />} />
            <Route path="monthly-report" element={<Montlyreport />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}> <SuperAdminLayout /> </ProtectedRoute>}>
            <Route index element={<CompanyList />} />
            <Route path="add-company" element={<AddCompany />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>

    </Router>
  );
}

export default App;
