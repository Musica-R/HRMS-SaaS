import React, { useEffect, useState } from "react";
import "../styles/TaskStatusPanel.css";
import { FaUserTie, FaUsers } from "react-icons/fa6";
import { FiClock, FiRefreshCw, FiCheckCircle, FiWatch, FiPauseCircle } from "react-icons/fi";
import { GoTasklist } from "react-icons/go";
import { HiUserGroup } from "react-icons/hi2";
import { getCompanyBranch } from '../utils/companyContext';

/* ── API endpoints ──────────────────────────────────────────────── */
const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const TASK_API = process.env.REACT_APP_API_BASE_URL;

/* ── Lookup tables ──────────────────────────────────────────────── */
const STATUS_META = {
    todo: {
        label: "To Do",
        icon: <FiClock />,
        cls: "tsp-status-todo"
    },

    pending: {
        label: "Pending",
        icon: <FiWatch />,
        cls: "tsp-status-pending"
    },

    "in-progress": {
        label: "In Progress",
        icon: <FiRefreshCw />,
        cls: "tsp-status-in_progress"
    },

    completed: {
        label: "Completed",
        icon: <FiCheckCircle />,
        cls: "tsp-status-completed"
    },

    hold: {
        label: "Hold",
        icon: <FiPauseCircle />,
        cls: "tsp-status-hold"
    },

    not_completed: {
        label: "Not Completed",
        icon: <FiPauseCircle />,
        cls: "tsp-status-not_completed"
    },
};

const PRIORITY_META = {
    very_low: {
        label: "Very Low",
        cls: "tsp-priority-very-low",
        dot: "tsp-dot-very-low"
    },

    low: {
        label: "Low",
        cls: "tsp-priority-low",
        dot: "tsp-dot-low"
    },

    medium: {
        label: "Medium",
        cls: "tsp-priority-medium",
        dot: "tsp-dot-medium"
    },

    high: {
        label: "High",
        cls: "tsp-priority-high",
        dot: "tsp-dot-high"
    },

    very_high: {
        label: "Very High",
        cls: "tsp-priority-very-high",
        dot: "tsp-dot-very-high"
    },
};

const AVATAR_PALETTE = ["tsp-av-0", "tsp-av-1", "tsp-av-2", "tsp-av-3", "tsp-av-4", "tsp-av-5"];

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtTime(t) { return t ? t.substring(0, 5) : null; }
function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}
function initials(name) {
    return name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
}
function avatarCls(name) {
    return AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
}

/* ── Atoms ───────────────────────────────────────────────────────── */
const Dash = () => <span className="tsp-dash">—</span>;

function StatusPill({ status }) {
    const m = STATUS_META[status] || STATUS_META.todo;
    return (
        <span className={`tsp-status-pill ${m.cls}`}>
            {m.icon} {m.label}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const m = PRIORITY_META[priority] || PRIORITY_META.medium;
    return (
        <span className={`tsp-priority-badge ${m.cls}`}>
            <span className={`tsp-priority-dot ${m.dot}`} />
            {m.label}
        </span>
    );
}

function UserCell({ name }) {
    if (!name) return <Dash />;
    return (
        <span className="tsp-user-cell">
            <span className={`tsp-avatar ${avatarCls(name)}`}>{initials(name)}</span>
            <span className="tsp-user-name">{name}</span>
        </span>
    );
}

/* ── Summary Bar — hardcoded structure, no .map() ──────────────── */
function SummaryBar({ s, onFilter, active }) {



    return (
        <div className="tsp-summary-bar">

            <div
                className={`tsp-summary-item tsp-stat-total ${active === "all" ? "active" : ""}`}
                onClick={() => onFilter("all")}
            >
                <span className="tsp-summary-num">{s.total_tasks ?? 0}</span>
                <span className="tsp-summary-lbl">Total Tasks</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-completed ${active === "completed" ? "active" : ""}`}
                onClick={() => onFilter("completed")}
            >
                <span className="tsp-summary-num">{s.completed ?? 0}</span>
                <span className="tsp-summary-lbl">Completed</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-inprogress ${active === "in-progress" ? "active" : ""}`}
                onClick={() => onFilter("in-progress")}
            >
                <span className="tsp-summary-num">{s.in_progress ?? 0}</span>
                <span className="tsp-summary-lbl">In Progress</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-pending ${active === "pending" ? "active" : ""}`}
                onClick={() => onFilter("pending")}
            >
                <span className="tsp-summary-num">{s.pending ?? 0}</span>
                <span className="tsp-summary-lbl">Pending</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-hold ${active === "hold" ? "active" : ""}`}
                onClick={() => onFilter("hold")}
            >
                <span className="tsp-summary-num">{s.hold ?? 0}</span>
                <span className="tsp-summary-lbl">On Hold</span>
            </div>

        </div>
    );
}

/* ── Table ───────────────────────────────────────────────────────── */
function TaskTable({ tasks }) {
    if (!tasks || tasks.length === 0) {
        return <div className="tsp-empty-table">No tasks in this section.</div>;
    }

    return (
        <div className="tsp-table-wrap">
            <table className="tsp-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Project</th>
                        <th>Assigned To</th>
                        <th>Assigned By</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Duration</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id}>

                            <td className="tsp-col-id">{task.id}</td>

                            <td className="tsp-col-title">
                                {task.title || <Dash />}
                            </td>

                            {/* Full description — wraps naturally, no ellipsis */}
                            <td className="tsp-col-desc">
                                {task.description || <Dash />}
                            </td>

                            <td className="tsp-col-project">
                                <span className="tsp-project-tag">{task.project_name || <Dash />}</span>
                            </td>

                            <td className="tsp-col-user">
                                <UserCell name={task.assigned_to_name} />
                            </td>

                            <td className="tsp-col-user">
                                <UserCell name={task.assigned_by_name} />
                            </td>

                            <td className="tsp-col-status">
                                <StatusPill status={task.status} />
                            </td>

                            <td className="tsp-col-priority">
                                <PriorityBadge priority={task.priority} />
                            </td>

                            <td className="tsp-col-date">
                                {fmtDate(task.task_date) || <Dash />}
                            </td>

                            <td className="tsp-col-time">
                                {fmtTime(task.start_time) || <Dash />}
                            </td>

                            <td className="tsp-col-time">
                                {fmtTime(task.end_time) || <Dash />}
                            </td>

                            <td className="tsp-col-duration">
                                {task.duration
                                    ? <span className="tsp-duration-badge">{task.duration}</span>
                                    : <Dash />}
                            </td>

                            {/* Full reason — wraps naturally */}
                            <td className="tsp-col-reason">
                                {task.reason || <Dash />}
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Section (TL / TM) ───────────────────────────────────────────── */
function SectionBlock({ icon, title, headerCls, badgeCls, tasks }) {
    return (
        <div className="tsp-section">
            <div className={`tsp-section-header ${headerCls}`}>
                <span className="tsp-section-icon">{icon}</span>
                <span className="tsp-section-title">{title}</span>
                <span className={`tsp-section-badge ${badgeCls}`}>{tasks?.length ?? 0}</span>
            </div>
            <TaskTable tasks={tasks} />
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function TaskStatusPanel() {
   
    const { company_id, branch_id } = getCompanyBranch();

    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [taskData, setTaskData] = useState(null);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState("all");

    const filterTasks = (tasks) => {
        if (!statusFilter || statusFilter === "all") return tasks;
        return tasks?.filter(t => t.status === statusFilter);
    };

    /* Fetch team list on mount */
    useEffect(() => {
        const load = async () => {
            setTeamsLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/teams/team-list?company_id=${company_id}&branch_id=${branch_id}`);
                const json = await res.json();
                if (json.success) setTeams(json.data);
            } catch (err) { console.error("Teams fetch error:", err); }
            setTeamsLoading(false);
        };
        load();
    }, [company_id, branch_id]);

    /* Fetch tasks whenever team changes */

    useEffect(() => {
        if (!selectedTeam) { setTaskData(null); return; }

        setStatusFilter("all");

        const load = async () => {
            setTasksLoading(true);
            try {
                const res = await fetch(`${TASK_API}/task-List-ByTeam?team_id=${selectedTeam}&company_id=${company_id}&branch_id=${branch_id}`);
                const json = await res.json();
                if (json.success) setTaskData(json);
            } catch (err) { console.error("Tasks fetch error:", err); }
            setTasksLoading(false);
        };
        load();
    }, [selectedTeam, company_id, branch_id]);

    return (
        <div className="tsp-page">
            <div className="tsp-inner">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="tsp-header">
                    <div className="tsp-header-glow" />

                    <div className="tsp-header-inner">
                        {/* Brand */}
                        <div className="tsp-header-brand">
                            <div className="tsp-header-logo"><GoTasklist /></div>
                            <div>
                                <h1 className="tsp-header-title">Task Status Panel</h1>
                                <p className="tsp-header-subtitle">Monitor and track team task progress at a glance</p>
                            </div>
                        </div>

                        {/* Right: selector + stat */}
                        <div className="tsp-header-right">
                            {/* Team selector */}
                            <div className="tsp-team-field">
                                <label className="tsp-team-label" htmlFor="tsp-team-select">
                                    Select Team <span className="tsp-required">*</span>
                                </label>
                                <div className="tsp-select-wrap">
                                    <select
                                        id="tsp-team-select"
                                        className="tsp-select"
                                        value={selectedTeam}
                                        onChange={e => setSelectedTeam(e.target.value)}
                                        disabled={teamsLoading}
                                    >
                                        <option value="">
                                            {teamsLoading ? "Loading teams…" : "— Choose a team —"}
                                        </option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <span className="tsp-select-arrow">▾</span>
                                </div>
                            </div>

                            {/* Stat pill — total tasks */}
                            <div className="tsp-header-stat">
                                <span className="tsp-header-stat-num">
                                    {taskData?.summary?.total_tasks ?? "—"}
                                </span>
                                <span className="tsp-header-stat-lbl">Total Tasks</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── No team chosen ─────────────────────────────────── */}
                {!selectedTeam && (
                    <div className="tsp-empty-page">
                        <div className="tsp-empty-icon"><HiUserGroup /></div>
                        <h3>Select a team to view tasks</h3>
                        <p>Choose a team from the dropdown above to see the task status table.</p>
                    </div>
                )}

                {/* ── Loading ────────────────────────────────────────── */}
                {selectedTeam && tasksLoading && (
                    <div className="tsp-loading">
                        <FiRefreshCw className="tsp-loading-icon" />
                        Loading tasks…
                    </div>
                )}

                {/* ── Content ────────────────────────────────────────── */}
                {selectedTeam && !tasksLoading && taskData && (
                    <>
                        {/* Summary — hardcoded, zero .map() */}
                        <SummaryBar
                            s={taskData.summary || {}}
                            onFilter={(status) => setStatusFilter(status)}
                            active={statusFilter}
                        />

                        {/* Team Lead tasks */}
                        <SectionBlock
                            icon={<FaUserTie />}
                            title="Team Lead Tasks"
                            headerCls="tsp-section-header-tl"
                            badgeCls="tsp-section-badge-tl"
                            tasks={filterTasks(taskData.tl_tasks)}
                        />

                        {/* Team Member tasks */}
                        <SectionBlock
                            icon={<FaUsers />}
                            title="Team Member Tasks"
                            headerCls="tsp-section-header-tm"
                            badgeCls="tsp-section-badge-tm"
                            tasks={filterTasks(taskData.tm_tasks)}
                        />
                    </>
                )}

            </div>
        </div>
    );
}