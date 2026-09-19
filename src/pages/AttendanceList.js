import React, { useState, useEffect } from 'react';
import '../styles/AttendanceList.css';
import Lottie from "lottie-react";
import animationData from '../LottieFiles/Completing Tasks.json';
import * as XLSX from "xlsx-js-style";
import { useLocation } from "react-router-dom";
import { createPortal } from 'react-dom';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AttendanceList = () => {

  const navigate = useNavigate();

  const { company_id, branch_id } = getCompanyBranch();

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const [userType, setUserType] = useState(
    location.state?.userType || 'emp_present'
  );

  const now = new Date();
  const [selfiePopup, setSelfiePopup] = useState({ show: false, img: null });

  const [dateFilter, setDateFilter] = useState(now.toISOString().split('T')[0]);

  // ── Export Modal State ──────────────────────────────────────────────────────
  const [exportModal, setExportModal] = useState(false);
  const [exportTab, setExportTab] = useState('today');

  const [exportStartDate, setExportStartDate] = useState(now.toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(now.toISOString().split('T')[0]);
  const [exportData, setExportData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportGenerated, setExportGenerated] = useState(false);

  const [shiftsList, setShiftsList] = useState([]);       // [{name, start_time, end_time}, ...]
  const [shiftFilter, setShiftFilter] = useState('all');  // 'all' or a shift name like "Mrg"
  // ────────────────────────────────────────────────────────────────────────────


  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/company/shifts?company_id=${company_id}&branch_id=${branch_id}`
        );
        const result = await res.json();
        if (result.success && result.data && Array.isArray(result.data.shift)) {
          setShiftsList(result.data.shift);
        }
      } catch (err) {
        console.error('Error fetching company shifts:', err);
      }
    };

    if (company_id && branch_id) {
      fetchShifts();
    }
  }, [company_id, branch_id]);

  useEffect(() => {

    let isMounted = true;
    let timeoutId;

    const fetchAttendance = async () => {
      try {

        let url = '';

        const shiftParam = shiftFilter !== 'all' ? `&shift=${encodeURIComponent(shiftFilter)}` : '';

        switch (userType) {
          case 'emp_present':
            url = `${BASE_URL}/attendance-list?date=${dateFilter}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`;
            break;

          case 'intern_present':
            url = `${BASE_URL}/attendance-list-intern?date=${dateFilter}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`;
            break;

          case 'emp_absent':
            url = `${BASE_URL}/attendance-List-absent?date=${dateFilter}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`;
            break;

          case 'intern_absent':
            url = `${BASE_URL}/attendance-List-absentinten?date=${dateFilter}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`;
            break;

          default:
            url = `${BASE_URL}/attendance-list?date=${dateFilter}&company_id=${company_id}&branch_id=${branch_id}${shiftParam}`;
        }

        const response = await fetch(url);

        const result = await response.json();

        if (isMounted && result.success && result.data) {
          setAttendanceData(result.data);
          setLoading(false);
        }

      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(fetchAttendance, 10000);
        }
      }
    };

    fetchAttendance();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };

  }, [dateFilter, userType, company_id, branch_id, shiftFilter]); // ✅ FIX — shiftFilter added so picking a shift restarts the polling loop with the new URL immediately

  const getReportTitle = () => {
    switch (userType) {
      case 'emp_present':
        return 'Employee Check-in List';
      case 'intern_present':
        return 'Intern Check-in List';
      case 'emp_absent':
        return 'Employee Non Check-in List';
      case 'intern_absent':
        return 'Intern Non Check-in List';
      default:
        return 'Attendance Report';
    }
  };

  // FORMAT TIME
  const formatTime = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';
    const parts = timeString.split(':');
    if (parts.length < 2) return '--';
    let hour = parseInt(parts[0], 10);
    let minute = parts[1];
    if (isNaN(hour) || !minute) return '--';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const openMonthlyPage = () => {
    navigate("/admin/monthly-report", { state: { userType } });
  };

  // FORMAT WORKED HOURS
  const formatDuration = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';
    const [hours, minutes] = timeString.split(':').map(Number);
    if (hours === 0 && minutes === 0) return '--';
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  // ── Fetch date-range data from API ─────────────────────────────────────────
  const handleGenerateExport = async () => {
    setExportLoading(true);
    setExportGenerated(false);

    try {
      const res = await fetch(
        `${BASE_URL}/attendance-List-date?start_date=${exportStartDate}&end_date=${exportEndDate}&company_id=${company_id}&branch_id=${branch_id}`
      );

      const result = await res.json();
      if (result.success && result.data) {
        setExportData(result.data);
        setExportGenerated(true);
      } else {
        setExportData([]);
        setExportGenerated(true);
      }
    } catch (err) {
      console.error('Export fetch error:', err);
      setExportData([]);
      setExportGenerated(true);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Group records by date ──────────────────────────────────────────────────
  const groupByDate = (data) => {
    return data.reduce((acc, item) => {
      const date = item.attendance_date || 'Unknown';
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  // ── TODAY: Export as Excel ─────────────────────────────────────────────────
  const exportTodayExcel = () => {
    const worksheetData = attendanceData.map((item, index) => ({
      "S.No": index + 1,
      "Employee Name": item.name || "-",
      "Date": item.attendance_date || "-",
      "Check In": formatTime(item.check_in),
      "Break In": formatTime(item.break_in),
      "Break Out": formatTime(item.break_out),
      "Total Break": `${item.total_break_minutes || 0} min`,
      "Check Out": formatTime(item.check_out),
      "Status": item.type || "-",
      "Worked Hours": formatDuration(item.worked_hours),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { origin: "A5" });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["MPeoples Business Solutions Pvt Ltd"],
      [getReportTitle()],
      [`Date: ${dateFilter}`],
      []
    ], { origin: "A1" });

    ["A1", "A2", "A3"].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, sz: cell === "A1" ? 16 : 14 },
          alignment: { horizontal: "center" }
        };
      }
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `${getReportTitle().replace(/\s+/g, '_')}_${dateFilter}.xlsx`);
  };

  // ── TODAY: Export as PDF ───────────────────────────────────────────────────
  const exportTodayPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("MPeoples Business Solutions Pvt Ltd", 14, 10);
    doc.setFontSize(12);
    doc.text(getReportTitle(), 14, 18);
    doc.text(`Date: ${dateFilter}`, 14, 25);

    const columns = [
      "S.No",
      "Employee Name",
      "Date",
      "Check In",
      "Break In",
      "Break Out",
      "Total Break",
      "Check Out",
      "Status",
      "Worked Hours"
    ];

    const rows = attendanceData.map((item, index) => [
      index + 1,
      item.name || "-",
      item.attendance_date || "-",
      formatTime(item.check_in),
      formatTime(item.break_in),
      formatTime(item.break_out),
      `${item.total_break_minutes || 0} min`,
      formatTime(item.check_out),
      item.type || "-",
      formatDuration(item.worked_hours)
    ]);

    autoTable(doc, {
      startY: 30,
      head: [columns],
      body: rows,
      styles: { fontSize: 8 },
    });

    doc.save(`${getReportTitle().replace(/\s+/g, "_")}_${dateFilter}.pdf`);
  };

  // ── DATE RANGE: Export as Excel (each date = one sheet) ───────────────────
  const exportRangeExcel = () => {
    const workbook = XLSX.utils.book_new();
    const grouped = groupByDate(exportData);

    Object.entries(grouped).forEach(([date, records]) => {
      const worksheetData = records.map((item, index) => ({
        "S.No": index + 1,
        "Employee Name": item.name || "-",
        "Date": item.attendance_date || "-",
        "Check In": formatTime(item.check_in),
        "Break In": formatTime(item.break_in),
        "Break Out": formatTime(item.break_out),
        "Total Break": `${item.total_break_minutes || 0} min`,
        "Check Out": formatTime(item.check_out),
        "Status": item.type || "-",
        "Worked Hours": formatDuration(item.worked_hours),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData, { origin: "A5" });

      XLSX.utils.sheet_add_aoa(worksheet, [
        ["MPeoples Business Solutions Pvt Ltd"],
        [getReportTitle()],
        [`Date: ${date}`],
        []
      ], { origin: "A1" });

      ["A1", "A2", "A3"].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = {
            font: { bold: true, sz: cell === "A1" ? 16 : 14 },
            alignment: { horizontal: "center" }
          };
        }
      });

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }
      ];

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
      ];

      const sheetName = date.replace(/\//g, '-').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, `Attendance_${exportStartDate}_to_${exportEndDate}.xlsx`);
  };

  // ── DATE RANGE: Export as PDF (each date = one page) ──────────────────────
  const exportRangePDF = () => {
    const doc = new jsPDF();
    const grouped = groupByDate(exportData);
    const dates = Object.keys(grouped);

    dates.forEach((date, pageIndex) => {
      if (pageIndex > 0) doc.addPage();

      doc.setFontSize(14);
      doc.text("MPeoples Business Solutions Pvt Ltd", 14, 10);
      doc.setFontSize(12);
      doc.text(getReportTitle(), 14, 18);
      doc.text(`Date: ${date}`, 14, 25);

      const columns = [
        "S.No",
        "Employee Name",
        "Date",
        "Check In",
        "Break In",
        "Break Out",
        "Total Break",
        "Check Out",
        "Status",
        "Worked Hours"
      ];
      const rows = grouped[date].map((item, index) => [
        index + 1,
        item.name || "-",
        item.attendance_date || "-",
        formatTime(item.check_in),
        formatTime(item.break_in),
        formatTime(item.break_out),
        `${item.total_break_minutes || 0} min`,
        formatTime(item.check_out),
        item.type || "-",
        formatDuration(item.worked_hours)
      ]);

      autoTable(doc, {
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 8 },
      });
    });

    doc.save(`Attendance_${exportStartDate}_to_${exportEndDate}.pdf`);
  };
  // ────────────────────────────────────────────────────────────────────────────

  // ── Shared slotProps for DatePickers INSIDE the export modal ─────────────
  // The modal has zIndex 99999 — the DatePicker popper must be higher
  const modalPickerSlotProps = (extraTextFieldStyle = {}) => ({
    textField: {
      size: 'small',
      style: { background: '#fff', borderRadius: '8px', ...extraTextFieldStyle },
    },
    popper: {
      style: { zIndex: 999999 },
    },
    desktopPaper: {
      style: { zIndex: 999999 },
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="attendance-page loading-container">
        <div className="loader-pulse"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="attendance-page fade-in-up">
      {/* HEADER */}
      <div className="page-header glass-panel">
        <div className="header-content">
          <div className="permission-title-group">
            <Lottie animationData={animationData} style={{ width: "70px", height: "70px" }} />
            <div>
              <h1>Attendance Records</h1>
              <p>Track and manage employee daily presence and work hours.</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="primary-btn"
              onClick={() => {
                setExportModal(true);
                setExportTab('today');
                setExportGenerated(false);
                setExportData([]);
              }}
            >
              Export
            </button>

            <button className="success-btn" onClick={openMonthlyPage}>
              Monthly Report
            </button>
          </div>

          <div className="header-actions">
            <div className="stat-badge">
              <span className="badge-label">Today's List Count</span>
              <span className="badge-value">{attendanceData.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="date-filter-row">
        <div className="form-group">
          <label>Date Filter</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={dayjs(dateFilter)}
              onChange={(newValue) => {
                if (newValue && newValue.isValid()) {
                  setDateFilter(newValue.format('YYYY-MM-DD'));
                }
              }}
              format="DD/MM/YYYY"
              views={['year', 'month', 'day']}
              openTo="day"
              slotProps={{
                textField: {
                  size: 'small',
                  style: { background: '#fff', borderRadius: '8px' }
                }
              }}
            />
          </LocalizationProvider>
        </div>

        <div className="form-group">
          <label>Shift</label>
          <select
            className="shift-filter-select"
            value={shiftFilter}
            onChange={(e) => { setShiftFilter(e.target.value); setLoading(true); }}
          >
            <option value="all">All Shifts</option>
            {shiftsList.map((s, i) => (
              <option key={i} value={s.name}>
                {s.name} ({s.start_time}–{s.end_time})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="attendance-toggle">
        <button className={userType === 'emp_present' ? 'active-toggle' : ''}
          onClick={() => { setUserType('emp_present'); setLoading(true); }}>
          Employee Check-in List
        </button>
        <button className={userType === 'intern_present' ? 'active-toggle' : ''}
          onClick={() => { setUserType('intern_present'); setLoading(true); }}>
          Intern Check-in List
        </button>
        <button className={userType === 'emp_absent' ? 'active-toggle' : ''}
          onClick={() => { setUserType('emp_absent'); setLoading(true); }}>
          Employee Non Check-in List
        </button>
        <button className={userType === 'intern_absent' ? 'active-toggle' : ''}
          onClick={() => { setUserType('intern_absent'); setLoading(true); }}>
          Intern Non Check-in List
        </button>
      </div>

      {/* TABLE */}
      <div className="attendance-content glass-panel">
        <div className="table-responsive">
          <table className="elegant-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Employee</th>
                <th>Attendance Date</th>
                <th>Check In</th>
                <th>Break In</th>
                <th>Break Out</th>
                <th>Total Break</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Late By</th>
                <th>Worked Hours</th>
                <th>Shortfall / Overtime</th>
              </tr>
            </thead>

            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record, index) => (
                  <tr key={record.id} className="table-row">
                    <td>{index + 1}</td>
                    <td>
                      <div className="employee-cell">
                        <span className="employee-name">{record.name}</span>
                      </div>
                    </td>

                    <td>{formatDate(record.attendance_date)}</td>

                    <td>
                      <div className="checkin-cell">
                        {record.type !== 'ABSENT' && record.selfie_img ? (
                          <img
                            src={record.selfie_img}
                            alt="selfie"
                            onClick={() => setSelfiePopup({ show: true, img: record.selfie_img })}
                            className="selfie-thumb selfie-thumb--checkin"
                          />
                        ) : (
                          <div className="selfie-avatar selfie-avatar--checkin">
                            {record.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="time-badge in">
                          {record.type === 'ABSENT' ? '--' : formatTime(record.check_in)}
                        </div>
                      </div>
                    </td>

                    <td>{record.type === 'ABSENT' ? '--' : formatTime(record.break_in)}</td>
                    <td>{record.type === 'ABSENT' ? '--' : formatTime(record.break_out)}</td>
                    <td>
                      {record.type === 'ABSENT'
                        ? '--'
                        : `${record.total_break_minutes || 0} min`}
                    </td>

                    <td>
                      <div className="checkin-cell">
                        {record.type !== 'ABSENT' && record.checkout_selfie_img ? (
                          <img
                            src={record.checkout_selfie_img}
                            alt="checkout selfie"
                            onClick={() => setSelfiePopup({ show: true, img: record.checkout_selfie_img })}
                            className="selfie-thumb selfie-thumb--checkout"
                          />
                        ) : (
                          <div className="selfie-avatar selfie-avatar--checkout">
                            {record.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="time-badge out">
                          {record.type === 'ABSENT' ? '--' : formatTime(record.check_out)}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="status-flex">
                        <span
                          className={`status-pill ${record.type === 'PRESENT'
                            ? 'present'
                            : record.type === 'ABSENT'
                              ? 'absent'
                              : record.type === 'ONDUTY'
                                ? 'onduty'
                                : ['LOP', 'SICK', 'CASUAL', 'LEAVE'].includes(record.type)
                                  ? 'leave'
                                  : ['L-H', 'C-H', 'W-H'].includes(record.type)
                                    ? 'holiday'
                                    : record.type === 'HALFDAY'
                                      ? 'halfday'
                                      : ''
                            }`}
                        >
                          {{
                            'PRESENT': 'Present',
                            'ABSENT': 'Absent',
                            'HALFDAY': 'Half Day',
                            'LEAVE': 'Leave',
                            'L-H': 'Local Holiday',
                            'C-H': 'Casual Holiday',
                            'W-H': 'Weekend Holiday',
                            'SICK': 'Sick Leave',
                            'CASUAL': 'Casual Leave',
                            'LOP': 'Loss of Pay',
                            'ONDUTY': 'On Duty'
                          }[record.type] || record.type}
                        </span>

                        {record.late_checkin === 1 && (
                          <span className="late-indicator" title={`Late by ${record.late_checkin_time}`}>
                            Late
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {record.late_checkin === 1 ? formatDuration(record.late_checkin_time) : '--'}
                    </td>

                    <td>
                      <span className="hours-text">{formatDuration(record.worked_hours)}</span>
                    </td>

                    <td>
                      <span className="hours-text">{formatDuration(record.overtimed_hours)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELFIE POPUP */}
      {selfiePopup.show && createPortal(
        <div
          onClick={() => setSelfiePopup({ show: false, img: null })}
          className="selfie-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="selfie-modal"
          >
            <img
              src={selfiePopup.img}
              alt="selfie preview"
              className="selfie-modal__img"
            />
            <button
              onClick={() => setSelfiePopup({ show: false, img: null })}
              className="selfie-modal__close"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── EXPORT MODAL ── */}
      {exportModal && createPortal(
        <div
          onClick={() => setExportModal(false)}
          className="export-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="export-modal"
          >
            {/* Modal Header */}
            <div className="export-modal__header">
              <h2 className="export-modal__title">Export Attendance Report</h2>
              <p className="export-modal__subtitle">
                Choose the report type and download format.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="export-tab-switcher">
              <button
                onClick={() => setExportTab('today')}
                className={`export-tab-btn${exportTab === 'today' ? ' export-tab-btn--active' : ''}`}
              >
                Today List
              </button>
              <button
                onClick={() => {
                  setExportTab('range');
                  setExportGenerated(false);
                  setExportData([]);
                }}
                className={`export-tab-btn${exportTab === 'range' ? ' export-tab-btn--active' : ''}`}
              >
                Date Range
              </button>
            </div>

            {/* TODAY LIST TAB */}
            {exportTab === 'today' && (
              <div className="export-tab-content">
                <div className="export-today-info">
                  <span className="export-today-icon"></span>
                  <div className="export-today-body">
                    <p className="export-today-title">{getReportTitle()}</p>
                    <div className="export-today-datepicker">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={dayjs(dateFilter)}
                          onChange={(newValue) => {
                            if (newValue && newValue.isValid()) {
                              setDateFilter(newValue.format('YYYY-MM-DD'));
                            }
                          }}
                          format="DD/MM/YYYY"
                          views={['year', 'month', 'day']}
                          openTo="day"
                          slotProps={modalPickerSlotProps({ width: '160px' })}
                        />
                      </LocalizationProvider>
                      <span className="export-record-count">
                        {attendanceData.length} record(s)
                      </span>
                    </div>
                  </div>
                </div>

                {attendanceData.length === 0 ? (
                  <p className="export-empty-msg">
                    No records found for the selected date.
                  </p>
                ) : (
                  <div className="export-btn-row">
                    <button
                      onClick={() => { exportTodayExcel(); setExportModal(false); }}
                      className="export-dl-btn export-dl-btn--excel"
                    >
                      <span>⬇</span> Export Excel
                    </button>
                    <button
                      onClick={() => { exportTodayPDF(); setExportModal(false); }}
                      className="export-dl-btn export-dl-btn--pdf"
                    >
                      <span>⬇</span> Export PDF
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DATE RANGE TAB */}
            {exportTab === 'range' && (
              <div className="export-tab-content">
                <div className="export-range-pickers">
                  <div className="export-picker-group">
                    <label className="export-picker-label">Start Date</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={dayjs(exportStartDate)}
                        onChange={(newValue) => {
                          if (newValue && newValue.isValid()) {
                            setExportStartDate(newValue.format('YYYY-MM-DD'));
                            setExportGenerated(false);
                          }
                        }}
                        format="DD/MM/YYYY"
                        views={['year', 'month', 'day']}
                        openTo="day"
                        slotProps={modalPickerSlotProps({ width: '100%' })}
                      />
                    </LocalizationProvider>
                  </div>

                  <div className="export-picker-group">
                    <label className="export-picker-label">End Date</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={dayjs(exportEndDate)}
                        onChange={(newValue) => {
                          if (newValue && newValue.isValid()) {
                            setExportEndDate(newValue.format('YYYY-MM-DD'));
                            setExportGenerated(false);
                          }
                        }}
                        format="DD/MM/YYYY"
                        views={['year', 'month', 'day']}
                        openTo="day"
                        slotProps={modalPickerSlotProps({ width: '100%' })}
                      />
                    </LocalizationProvider>
                  </div>
                </div>

                <button
                  onClick={handleGenerateExport}
                  disabled={exportLoading}
                  className={`export-generate-btn${exportLoading ? ' export-generate-btn--loading' : ''}`}
                >
                  {exportLoading ? 'Fetching data...' : 'Generate'}
                </button>

                {exportGenerated && (
                  <div className="export-generated-section">
                    {exportData.length === 0 ? (
                      <p className="export-empty-msg">
                        No records found for the selected date range.
                      </p>
                    ) : (
                      <>
                        <p className="export-range-summary">
                          {exportData.length} record(s) found across {Object.keys(groupByDate(exportData)).length} date(s).
                          Each date will be a separate page / sheet.
                        </p>
                        <div className="export-btn-row">
                          <button
                            onClick={exportRangeExcel}
                            className="export-dl-btn export-dl-btn--excel"
                          >
                            <span>⬇</span> Export Excel
                          </button>
                          <button
                            onClick={exportRangePDF}
                            className="export-dl-btn export-dl-btn--pdf"
                          >
                            <span>⬇</span> Export PDF
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => setExportModal(false)}
              className="export-modal__close-btn"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AttendanceList;