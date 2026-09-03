import React, { useState, useEffect } from 'react';
import '../styles/RegistrationForm.css';
import AdminHeader from './AdminHeader';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RegistrationForm = () => {

  const { company_id: adminCompanyId, branch_id: adminBranchId } = getCompanyBranch();

  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    empid: '',
    email: '',
    mobile: '',
    password: '',
    c_password: '',
    branch_id: '',
    address: '',
    position: '',
    role_id: '',
    start_time: '',
    end_time: '',
    dob: '',
    profileimg: null,

    designation: '',
    team_id: '',
    employee_status: '',
    qualification: '',
    joining_date: '',
    experience: '',
    salary: '',
  });




  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);


  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [passwordError, setPasswordError] = useState('');

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  /* ================= FETCH ROLES ================= */

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);

      try {
        const response = await fetch(`${BASE_URL}/roles?company_id=${adminCompanyId}&branch_id=${adminBranchId}`);
        const result = await response.json();

        if (result.success) {
          setRoles(result.data);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      }

      setLoadingRoles(false);
    };

    fetchRoles();
  }, [adminCompanyId, adminBranchId]);

  /* ================= FETCH BRANCHES ================= */

  useEffect(() => {
    if (adminCompanyId) {
      const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
          const response = await fetch(
            `${BASE_URL}/get-branch-for-company?company_id=${adminCompanyId}`
          );
          const result = await response.json();
          if (result.success) {
            setBranches(result.data);
          } else {
            setBranches([]);
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          setBranches([]);
        }
        setLoadingBranches(false);
      };
      fetchBranches();
    } else {
      setBranches([]);
    }
  }, [adminCompanyId]);



  useEffect(() => {
    const fetchTeams = async () => {
      setLoadingTeams(true);

      try {
        const response = await fetch(
          `${BASE_URL}/teams/team-list?company_id=${adminCompanyId}&branch_id=${adminBranchId}`
        );
        const result = await response.json();

        if (result.success) {
          setTeams(result.data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }

      setLoadingTeams(false);
    };

    fetchTeams();

  }, [adminCompanyId, adminBranchId]);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ================= FORM SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.c_password) {
      setPasswordError('Passwords do not match');
      return;
    } else {
      setPasswordError('');
    }

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    submitData.append('company_id', adminCompanyId);
    submitData.append('created_by_company_id', adminCompanyId);
    submitData.append('created_by_branch_id', adminBranchId);

    try {
      const response = await fetch(`${BASE_URL}/add-user`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: submitData,
});

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        alert(result.message || 'User registered successfully!');

        setFormData({
          name: '',
          empid: '',
          email: '',
          mobile: '',
          password: '',
          c_password: '',
          branch_id: '',
          address: '',
          position: '',
          role_id: '',
          start_time: '',
          end_time: '',
          dob: '',
          profileimg: null,

          designation: '',
          team_id: '',
          employee_status: '',
          qualification: '',
          joining_date: '',
          experience: '',
          salary: '',
        });
      } else {
        if (result.errors) {
          let errorMessages = Object.values(result.errors)
            .flat()
            .join('\n');

          alert(errorMessages);
        } else {
          alert(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="form-container">
        <div className="form-card">
          <h2 className="form-title">Employee Registration</h2>

          <form onSubmit={handleSubmit} className="registration-form">
            {/* NAME */}

            <div className="form-groups">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMPID */}

            <div className="form-groups">
              <label>Employee ID</label>
              <input
                type="text"
                name="empid"
                value={formData.empid}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMAIL */}

            <div className="form-groups">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* MOBILE */}

            <div className="form-groups">
              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                pattern="\d{10}"
                required
              />
            </div>

            <div className="form-groups">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            {/* PASSWORD */}

            <div className="form-groups">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-groups">
              <label>Confirm Password</label>
              <input
                type="password"
                name="c_password"
                value={formData.c_password}
                onChange={handleChange}
                required
              />

              {passwordError && (
                <span className="error-text">{passwordError}</span>
              )}
            </div>

            {/* POSITION */}

            <div className="form-groups">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            {/* ROLE */}

            <div className="form-groups">
              <label>Role</label>

              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  {loadingRoles ? 'Loading...' : 'Select Role'}
                </option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* COMPANY */}

            {/* <div className="form-groups">
              <label>Company</label>

              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  {loadingCompanies ? 'Loading...' : 'Select Company'}
                </option>

                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div> */}

            {/* BRANCH */}

            <div className="form-groups">
              <label>Branch</label>

              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                // disabled={!formData.company_id}
                required
              >
                <option value="">
                  {loadingBranches ? 'Loading...' : 'Select Branch'}
                </option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-groups">
              <label>Designation</label>

              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
              >
                <option value="">Select Designation</option>
                <option value="TL">Team Lead</option>
                <option value="TM">Team Member</option>
              </select>
            </div>

            <div className="form-groups">
              <label>Team</label>

              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  {loadingTeams ? 'Loading...' : 'Select Team'}
                </option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-groups">
              <label>Employee Status</label>

              <select
                name="employee_status"
                value={formData.employee_status}
                onChange={handleChange}
                required
              >
                <option value="">Select Status</option>
                <option value="working">Working</option>
                <option value="notice_period">Notice Period</option>
                <option value="relieved">Relieved</option>
              </select>
            </div>

            <div className="form-groups">
              <label>Salary</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Enter Salary"
              />
            </div>

            <div className="form-groups">
              <label>Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
              />
            </div>

            <div className="form-groups">
              <label>Joining Date</label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-groups">
              <label>Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>

            {/* START TIME */}

            <div className="form-groups">
              <label>Start Time</label>
              <input
                type="time"
                step="1"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>

            {/* END TIME */}

            <div className="form-groups">
              <label>End Time</label>
              <input
                type="time"
                step="1"
                name="end_time"
                value={formData.end_time}
                min={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>

            {/* ADDRESS */}

            <div className="form-groups full-width">
              <label>Address</label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                required
              ></textarea>
            </div>

            {/* PROFILE IMAGE */}

            <div className="form-groups full-width">
              <label>Profile Image</label>

              <input
                type="file"
                name="profileimg"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            {/* SUBMIT */}

            <div className="form-actions full-width">
              <button type="submit" className="submit-btn">
                {' '}
                Register Employee{' '}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrationForm;
