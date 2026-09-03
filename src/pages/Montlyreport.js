import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/MonthlyReport.css";
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function MonthlyReport() {

    const { company_id, branch_id } = getCompanyBranch();

    const navigate = useNavigate();
    const location = useLocation();
    const selectedEmployee = location.state?.selectedEmployee;
    const userType = location.state?.userType || "emp_present";

    const [employees, setEmployees] = useState([]);

    const [selectedUser, setSelectedUser] = useState(
        selectedEmployee?.id || ""
    );

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState([]);
    const [summary, setSummary] = useState(null); // ✅ NEW: store summary

    const selectedEmployeeName =
        employees.find((e) => String(e.id) === String(selectedUser))?.name || "";

    // ✅ FETCH EMPLOYEES
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const url =
                    userType === "intern_present" || userType === "intern_absent"
                        ? `${BASE_URL}/employee-List-roles?company_id=${company_id}&branch_id=${branch_id}`
                        : `${BASE_URL}/employee-List?company_id=${company_id}&branch_id=${branch_id}`;

                const res = await fetch(url);
                const data = await res.json();

                if (data.success) {
                    setEmployees(data.data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchEmployees();
    }, [userType, company_id, branch_id]);


    const fetchMonthlyReport = useCallback(async () => {
        if (!selectedUser) return alert("Select Employee");

        try {

             const res = await fetch(
                `${BASE_URL}/get-Monthly-Summary?user_id=${selectedUser}&month=${month}&year=${year}&company_id=${company_id}&branch_id=${branch_id}`
            );

            const data = await res.json();

            if (data.success) {
                setReport(data.data.attendance);
                // ✅ Store summary fields
                setSummary({
                    total_days: data.data.total_days,
                    total_holidays: data.data.total_holidays,
                    working_days: data.data.working_days,
                    present_days: data.data.present_days,

                    absent_days: data.data.absent_days,
                    leave_days: data.data.leave_days,

                    casual_leave: data.data.casual_leave || 0,
                    lop_leave: data.data.lop_leave || 0,

                    total_late_time: data.data.total_late_time,
                });
            }
        } catch (err) {
            console.error(err);
        }
    }, [selectedUser, month, year, company_id, branch_id]);

    const formatTotalLateTime = (timeStr) => {
        if (!timeStr || timeStr === "00:00") return "-";

        const [hh, mm] = timeStr.split(":");
        const minutes = parseInt(hh) * 60 + parseInt(mm);

        return `${minutes} min`;
    };

    // ✅ FORMAT TIME
    const formatTime = (timeString) => {
        if (!timeString || timeString === "00:00:00" || timeString === "-:--:--") return "-";

        const [hourStr, minute] = timeString.split(":");

        if (!hourStr || !minute) return "-";

        const hourNum = parseInt(hourStr, 10);
        if (isNaN(hourNum)) return "-";

        const ampm = hourNum >= 12 ? "PM" : "AM";
        const hour = hourNum % 12 || 12;

        return `${hour}:${minute} ${ampm}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString();
    };

    // ✅ FORMAT LATE CHECK-IN (already HH:MM, just display as-is or dash)
    const formatLateTime = (timeStr) => {
        if (!timeStr || timeStr === "00:00" || timeStr === "--:--") return "-";

        const [hh, mm] = timeStr.split(":");
        const minutes = parseInt(hh) * 60 + parseInt(mm);

        return `${minutes} min`;
    };

    const formatBreakTime = (timeStr) => {
        if (!timeStr || timeStr === "00:00") return "-";

        const [hh, mm] = timeStr.split(":");
        const minutes = parseInt(hh) * 60 + parseInt(mm);

        return `${minutes} min`;
    };

    // ✅ EXPORT EXCEL
    // ✅ EXPORT EXCEL
    const exportMonthlyReport = () => {
        if (report.length === 0) return alert("No data to export");

        const workbook = XLSX.utils.book_new();

        const summaryRows = summary
            ? [
                ["Monthly Attendance Report"],
                [`Employee: ${selectedEmployeeName}`],
                [],
                ["Total Days", summary.total_days],
                ["Total Holidays", summary.total_holidays],
                ["Working Days", summary.working_days],
                ["Present Days", summary.present_days],
                ["Absent Days", summary.absent_days],
                ["Leave Days", summary.leave_days],
                ["Paid Leave", summary.paid_leave],
                ["Loss Pay", summary.losspay_leave],
                ["Total Late Time", formatTotalLateTime(summary.total_late_time)],
                [],
            ]
            : [
                ["Monthly Attendance Report"],
                [`Employee: ${selectedEmployeeName}`],
                [],
            ];

        const attendanceHeader = [
            "S.No",
            "Date",
            "Check In",
            "Check Out",
            "Break In",
            "Break Out",
            "Total Break",
            "Late Check-In Time",
            "Status",
        ];

        const attendanceRows = report.map((r, index) => [
            index + 1,
            r.date || "-",
            formatTime(r.check_in),
            formatTime(r.check_out),
            formatTime(r.break_in),
            formatTime(r.break_out),
            formatBreakTime(r.total_break_minutes),
            formatLateTime(r.late_checkin_time),
            getStatusLabel(r.type)
        ]);

        const allRows = [...summaryRows, attendanceHeader, ...attendanceRows];

        const worksheet = XLSX.utils.aoa_to_sheet(allRows);

        // ✅ Merge title + employee name across columns
        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        ];

        // ✅ Title style
        worksheet["A1"].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: "center" }
        };

        // ✅ Employee name style (VISIBLE)
        worksheet["A2"].s = {
            font: { bold: true, sz: 14, color: { rgb: "007BFF" } },
            alignment: { horizontal: "center" }
        };

        // Column widths
        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 14 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 },
            { wch: 10 },
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
        XLSX.writeFile(workbook, "Monthly_Attendance_Report.xlsx");
    };

    // ✅ EXPORT PDF
    // ✅ EXPORT PDF
    const exportPDF = () => {
        if (report.length === 0) return alert("No data to export");

        const doc = new jsPDF({ orientation: "landscape" });

        // ✅ Title centered
        doc.setFontSize(16);
        doc.text("Monthly Attendance Report", 150, 15, { align: "center" });

        // ✅ Employee name (VISIBLE)
        doc.setFontSize(13);
        doc.setTextColor(0, 123, 255);
        doc.text(`Employee: ${selectedEmployeeName}`, 150, 25, { align: "center" });

        doc.setTextColor(0, 0, 0);

        // ✅ Summary table (spacing fixed)
        if (summary) {
            autoTable(doc, {
                startY: 32,
                head: [[
                    "Total Days",
                    "Holidays",
                    "Working Days",
                    "Present",
                    "Absent",
                    "Leave",
                    "Paid Leave",
                    "Loss Pay",
                    "Late Time"
                ]],
                body: [[
                    summary.total_days,
                    summary.total_holidays,
                    summary.working_days,
                    summary.present_days,
                    summary.absent_days,
                    summary.leave_days,
                    summary.paid_leave,
                    summary.losspay_leave,
                    formatTotalLateTime(summary.total_late_time),
                ]],
                theme: "grid",
                headStyles: { fillColor: [0, 123, 255] },
                styles: { halign: "center" },
            });
        }

        // Attendance table
        const tableData = report.map((r, i) => [
            i + 1,
            formatDate(r.date),
            formatTime(r.check_in),
            formatTime(r.check_out),
            formatTime(r.break_in),
            formatTime(r.break_out),
            formatBreakTime(r.total_break_minutes),
            formatLateTime(r.late_checkin_time),
            getStatusLabel(r.type)
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40,
            head: [[
                "S.No",
                "Date",
                "Check In",
                "Check Out",
                "Break In",
                "Break Out",
                "Total Break",
                "Late Check-In",
                "Status",
            ]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [0, 123, 255] },
            styles: { halign: "center", fontSize: 10 },
        });

        doc.save("Monthly_Attendance_Report.pdf");
    };

    const getStatusLabel = (type) => {
        return {
            "PRESENT": "Present",
            "ABSENT": "Absent",
            "HALFDAY": "Half Day",
            "LEAVE": "Leave",
            "SICK": "Sick Leave",
            "CASUAL": "Casual Leave",
            "LOP": "Loss of Pay",
            "ONDUTY": "On Duty",

            "L-H": "Local Holiday",
            "C-H": "Casual Holiday",
            "W-H": "Weekend Holiday",
        }[type] || type;   // ✅ fallback to original value
    };

    useEffect(() => {
        if (selectedUser) {
            fetchMonthlyReport();
        }
    }, [selectedUser, fetchMonthlyReport]);

    return (
        <div className="monthly-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <h2 className="title">Monthly Report</h2>

            {selectedEmployeeName && (
                <h3 className="employee-name">
                    Employee: {selectedEmployeeName}
                </h3>
            )}

            {/* FILTERS */}
            <div className="filters">
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                            {e.name}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="Month"
                />

                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year"
                />

                <button onClick={fetchMonthlyReport}>Get Report</button>
                <button onClick={exportMonthlyReport}>Export Excel</button>
                <button className="pdf-btn" onClick={exportPDF}>
                    Export PDF
                </button>
            </div>

            {/* ✅ SUMMARY CARDS */}
            {summary && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <span className="summary-label">Total Days</span>
                        <span className="summary-value">{summary.total_days}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Holidays</span>
                        <span className="summary-value">{summary.total_holidays}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Working Days</span>
                        <span className="summary-value">{summary.working_days}</span>
                    </div>
                    <div className="summary-card present">
                        <span className="summary-label">Present Days</span>
                        <span className="summary-value">{summary.present_days}</span>
                    </div>

                    <div className="summary-card absent">
                        <span className="summary-label">Absent Days</span>
                        <span className="summary-value">{summary.absent_days}</span>
                    </div>

                    <div className="summary-card leave">
                        <span className="summary-label">Leave Days</span>
                        <span className="summary-value">{summary.leave_days}</span>
                    </div>

                    <div className="summary-card paid-leave">
                        <span className="summary-label">Paid Leave</span>
                        <span className="summary-value">
                            {summary.casual_leave}
                        </span>
                    </div>

                    <div className="summary-card lop">
                        <span className="summary-label">Loss Pay</span>
                        <span className="summary-value">
                            {summary.lop_leave}
                        </span>
                    </div>

                    <div className="summary-card late">
                        <span className="summary-label">Total Late</span>
                        <span className="summary-value" style={{ fontFamily: "math" }}>
                            {formatTotalLateTime(summary.total_late_time)}
                        </span>
                    </div>
                </div>
            )}

            {/* TABLE */}
            {report.length === 0 ? (
                <p className="no-data">No data available</p>
            ) : (
                <div className="table-wrapper">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Break In</th>
                                <th>Break Out</th>
                                <th>Total Break</th>
                                <th>Check Out</th>
                                <th>Late Check-In</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map((r, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{formatDate(r.date)}</td>
                                    <td>{formatTime(r.check_in)}</td>
                                    <td>{formatTime(r.break_in)}</td>
                                    <td>{formatTime(r.break_out)}</td>
                                    <td>{formatBreakTime(r.total_break_minutes)}</td>
                                    <td>{formatTime(r.check_out)}</td>
                                    <td className={r.late_checkin ? "late-text" : ""}>
                                        {formatLateTime(r.late_checkin_time)}
                                    </td>
                                    <td>
                                        <span
                                            className={`status-pill ${r.type === "PRESENT" ? "present" :
                                                r.type === "ABSENT" ? "absent" :
                                                    r.type === "HALFDAY" ? "halfday" :
                                                        r.type === "LEAVE" || r.type === "SICK" || r.type === "CASUAL" ? "leave" :
                                                            r.type === "LOP" ? "lop" :
                                                                r.type === "ONDUTY" ? "onduty" :
                                                                    "holiday"
                                                }`}
                                        >
                                            {getStatusLabel(r.type)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}