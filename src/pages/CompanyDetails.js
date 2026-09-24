import { useState, useEffect } from 'react';
import '../styles/CompanyDetails.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Company.json';
import { IoAdd } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { CiEdit } from 'react-icons/ci';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const EMPTY_SHIFT = { name: '', start_time: '', end_time: '' };

const CompanyDetails = () => {

  const { company_id, branch_id } = getCompanyBranch();

  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
  });

  const [formData1, setFormData1] = useState({
    company_id: company_id,
    branch_name: '',
    branch_lon: '',
    branch_lat: '',
    branch_address: '',
    branch_id: '',
    meter: ''
  });

  // BRANCH SHIFTS (used when adding a new branch)
  const [shifts, setShifts] = useState([{ ...EMPTY_SHIFT }]);

  const [activeCompanyForm, setActiveCompanyForm] = useState(false);
  const [activeBranchForm, setActiveBranchForm] = useState(false);

  // Branch list is a default-open section on the page (no longer a modal)
  const [branchListOpen, setBranchListOpen] = useState(true);

  const [branch, setBranch] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const [loading, setLoading] = useState(true);


  /* ================= SHIFT HANDLERS ================= */

  const handleShiftChange = (index, field, value) => {
    setShifts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addShift = () => {
    setShifts((prev) => [...prev, { ...EMPTY_SHIFT }]);
  };

  const removeShift = (index) => {
    setShifts((prev) => {
      if (prev.length === 1) return prev; // keep at least one shift row
      return prev.filter((_, i) => i !== index);
    });
  };


  /* ================= EDIT BRANCH ================= */

  const handleEdit = (branch) => {
    setFormData1({
      company_id: company_id,
      branch_name: branch.branch_name,
      branch_lat: branch.branch_lat,
      branch_lon: branch.branch_lon,
      branch_address: branch.branch_address,
      branch_id: branch.id,
      meter: branch.meter || ''
    });

    // Prefill the branch's existing shifts (adjust the field names if your API differs)
    const existing = Array.isArray(branch.shifts)
      ? branch.shifts
      : Array.isArray(branch.shift)
        ? branch.shift
        : [];

    setShifts(
      existing.length > 0
        ? existing.map((s) => ({
            id: s.id,
            name: s.name || s.shift_name || '',
            // time inputs need HH:MM, so trim "09:00:00" -> "09:00"
            start_time: (s.start_time || '').slice(0, 5),
            end_time: (s.end_time || '').slice(0, 5),
          }))
        : [{ ...EMPTY_SHIFT }]
    );

    setIsEdit(true);
    setActiveBranchForm(true);
  };



  /* ================= FETCH BRANCH BY COMPANY ID ================= */

  const [refreshBranches, setRefreshBranches] = useState(0);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/list-branch-id/${company_id}`
        );
        const result = await response.json();
        if (result.success) setBranch(result.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [company_id, branch_id, refreshBranches]);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange1 = (e) => {
    const { name, value } = e.target;

    setFormData1((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= COMPANY FORM SUBMIT ================= */

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
      const response = await fetch(
        `${BASE_URL}/add-company`,
        {
          method: 'POST',
          body: submitData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        alert(result.message || 'Company Created successfully!');

        setFormData({
          company_name: '',
          company_address: '',
        });
      } else {
        alert(
          'Failed to create Company: ' + (result.message || 'Unknown error')
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveCompanyForm(false);
    }
  };

  /* ================= BRANCH FORM SUBMIT ================= */

  const branchUpdate = async (e) => {
    e.preventDefault();

    // Shift validation (add + update)
    const hasIncompleteShift = shifts.some(
      (s) => !s.name.trim() || !s.start_time || !s.end_time
    );
    if (hasIncompleteShift) {
      alert('Please fill in all shift fields (name, start time, end time).');
      return;
    }

    // Laravel-compatible array bracket notation:
    // shift[0][name], shift[0][start_time], shift[0][end_time], ...
    const appendShifts = (submitData) => {
      shifts.forEach((shift, index) => {
        if (shift.id) submitData.append(`shift[${index}][id]`, shift.id);
        submitData.append(`shift[${index}][name]`, shift.name);
        submitData.append(`shift[${index}][start_time]`, shift.start_time);
        submitData.append(`shift[${index}][end_time]`, shift.end_time);
      });
    };

    try {
      if (isEdit) {
        /* ---- UPDATE BRANCH: send full formData1 + logged_in context ---- */
        const submitData = new FormData();

        Object.keys(formData1).forEach((key) => {
          if (formData1[key] !== null) {
            submitData.append(key, formData1[key]);
          }
        });

        submitData.append('logged_in_company_id', company_id);
        submitData.append('logged_in_branch_id', branch_id);
        appendShifts(submitData);

        const response = await fetch(
          `${BASE_URL}/update-branch`,
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Updated successfully!');

          setFormData1({
            company_id: company_id,
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
            meter: ''
          });
          setShifts([{ ...EMPTY_SHIFT }]);
          setRefreshBranches((prev) => prev + 1);
        } else {
          alert(
            'Failed to update Branch: ' + (result.message || 'Unknown error')
          );
        }
      } else {
        /* ---- ADD BRANCH: the 5 required fields + shifts ---- */
        const submitData = new FormData();
        submitData.append('company_id', formData1.company_id);
        submitData.append('branch_name', formData1.branch_name);
        submitData.append('branch_lon', formData1.branch_lon);
        submitData.append('branch_lat', formData1.branch_lat);
        submitData.append('branch_address', formData1.branch_address);

        appendShifts(submitData);

        const response = await fetch(
          `${BASE_URL}/add-branch`,
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Created successfully!');

          setFormData1({
            company_id: company_id,
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
            meter: ''
          });
          setShifts([{ ...EMPTY_SHIFT }]);
          setRefreshBranches((prev) => prev + 1);
        } else {
          alert(
            'Failed to create Branch: ' + (result.message || 'Unknown error')
          );
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setIsEdit(false);
      setActiveBranchForm(false);
    }
  };

  const resetBranchForm = () => {
    setActiveBranchForm(false);
    setIsEdit(false);
    setFormData1({
      company_id: company_id,
      branch_name: '',
      branch_lon: '',
      branch_lat: '',
      branch_address: '',
      branch_id: '',
      meter: ''
    });
    setShifts([{ ...EMPTY_SHIFT }]);
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="cd-loader"></div>
        <p>Loading Company records...</p>
      </div>
    );
  }

  return (
    <div className="cd-page cd-fade-in-up">
      {/* HEADER */}
      <div className="cd-header-card cd-glass">
        <div className="cd-header-content">
          <div className="cd-title-group">
            <Lottie animationData={animationData} style={{ width: "70px", height: "70px" }} />
            <div>
              <h1>Add Company</h1>
              <p>
                Create and maintain company profiles to streamline operations,
                improve data management, and support organizational growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="cd-toolbar">
        <button
          className="cd-toggle-btn"
          onClick={() => setActiveBranchForm(true)}
        >
          <IoAdd style={{ fontSize: '15px' }} /> Add Branch
        </button>
        <button
          className="cd-toggle-btn cd-toggle-btn--ghost"
          onClick={() => setBranchListOpen((prev) => !prev)}
        >
          {branchListOpen ? 'Hide Branches' : 'View Branches'}
        </button>
      </div>

      {/* ================= COMPANY FORM ================= */}

      {activeCompanyForm &&
        createPortal(
          <div
            className="cd-modal-overlay"
            onClick={() => setActiveCompanyForm(false)}
          >
            <div
              className="cd-form-card cd-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="cd-close-btn"
                onClick={() => setActiveCompanyForm(false)}
              >
                ×
              </button>
              <h2 className="cd-form-title">Add New Company</h2>

              <form onSubmit={handleSubmit} className="cd-form-grid">
                {/* COMPANY NAME */}

                <div className="cd-form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* COMPANY ADDRESS */}

                <div className="cd-form-group cd-form-group--full">
                  <label>Company Address</label>

                  <textarea
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* SUBMIT */}

                <div className="cd-form-actions cd-form-group--full">
                  <button type="submit" className="cd-submit-btn">
                    Add Company
                  </button>
                </div>

              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= BRANCH FORM ================= */}

      {activeBranchForm &&
        createPortal(
          <div
            className="cd-modal-overlay"
            onClick={resetBranchForm}
          >
            <div
              className="cd-form-card cd-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="cd-close-btn"
                onClick={resetBranchForm}
              >
                ×
              </button>
              <h2 className="cd-form-title">
                {isEdit ? 'Update Branch' : 'Add New Branch'}
              </h2>

              <form onSubmit={branchUpdate} className="cd-form-grid">

                {/* BRANCH NAME */}
                <div className="cd-form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData1.branch_name}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH LATITUDE */}
                <div className="cd-form-group">
                  <label>Company Latitude</label>
                  <input
                    type="text"
                    name="branch_lat"
                    value={formData1.branch_lat}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH LONGITUDE */}
                <div className="cd-form-group">
                  <label>Company Longitude</label>
                  <input
                    type="text"
                    name="branch_lon"
                    value={formData1.branch_lon}
                    onChange={handleChange1}
                    required
                  />
                </div>

                {/* BRANCH ADDRESS */}
                <div className="cd-form-group cd-form-group--full">
                  <label>Branch Address</label>
                  <textarea
                    name="branch_address"
                    value={formData1.branch_address}
                    onChange={handleChange1}
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* RADIUS DROPDOWN */}
                <div className="cd-form-group">
                  <label>Allowed Radius (Meters)</label>
                  <select name="meter" value={formData1.meter} onChange={handleChange1} required>
                    <option value="">Select Radius</option>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((meter) => (
                      <option key={meter} value={meter}>
                        {meter} meters
                      </option>
                    ))}
                  </select>
                </div>

                {/* ================= BRANCH SHIFTS (add + update) ================= */}
                <div className="cd-form-group cd-form-group--full cd-shift-section">
                  <label>Branch Shifts</label>

                  {shifts.map((shift, index) => (
                    <div className="cd-shift-row" key={index}>
                      <div className="cd-form-group">
                        <label>Shift Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Morning"
                          value={shift.name}
                          onChange={(e) => handleShiftChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="cd-form-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={shift.start_time}
                          onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)}
                          required
                        />
                      </div>
                      <div className="cd-form-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={shift.end_time}
                          onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)}
                          required
                        />
                      </div>
                      <div className="cd-form-group cd-shift-remove-wrap">
                        <button
                          type="button"
                          className="cd-btn-secondary"
                          onClick={() => removeShift(index)}
                          disabled={shifts.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="cd-btn-secondary" onClick={addShift}>
                    + Add Shift
                  </button>
                </div>

                {/* SUBMIT */}

                <div className="cd-form-actions cd-form-group--full">
                  <button type="submit" className="cd-submit-btn">
                    {isEdit ? 'Update Branch' : 'Add Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= BRANCH LIST (default-open page section) ================= */}

      {branchListOpen && (
        <section className="cd-branch-section">
          <div className="cd-branch-section-head">
            <h2 className="cd-form-title cd-form-title--inline">Branches</h2>
            <span className="cd-branch-count">{branch.length}</span>
          </div>

          {branch.length === 0 ? (
            <div className="cd-branch-empty">
              <p>No branches yet.</p>
              <span>Add your first branch to start tracking attendance by location.</span>
            </div>
          ) : (
            <div className="cd-branch-grid">
              {branch.map((data) => (
                <div className="cd-branch-card" key={data.id}>
                  <div className="cd-branch-card-top">
                    <h3>{data.branch_name}</h3>
                    <button
                      className="cd-icon-btn"
                      onClick={() => handleEdit(data)}
                      aria-label={`Edit ${data.branch_name}`}
                    >
                      <CiEdit />
                    </button>
                  </div>

                  <div className="cd-branch-fields">
                    <div className="cd-branch-field">
                      <span className="cd-branch-field-label">Latitude</span>
                      <span className="cd-branch-field-value">{data.branch_lat}</span>
                    </div>
                    <div className="cd-branch-field">
                      <span className="cd-branch-field-label">Longitude</span>
                      <span className="cd-branch-field-value">{data.branch_lon}</span>
                    </div>
                    <div className="cd-branch-field">
                      <span className="cd-branch-field-label">Allowed radius</span>
                      <span className="cd-branch-field-value">{data.meter} m</span>
                    </div>
                  </div>

                  <p className="cd-branch-address">{data.branch_address}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CompanyDetails;