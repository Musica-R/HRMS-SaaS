import React, { useEffect, useState } from "react";
import "../styles/TeamManagement.css";
import AdminHeader from "./AdminHeader";
import { getCompanyBranch } from '../utils/companyContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TeamManagement = () => {

  const { company_id, branch_id } = getCompanyBranch();

  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH TEAMS ================= */

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/teams/team-list?company_id=${company_id}&branch_id=${branch_id}`);
      const data = await res.json();

      if (data.success) {
        setTeams(data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, [company_id, branch_id]);

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      alert("Team name is required");
      return;
    }

    try {
      let url = "";
      let method = "POST";

      if (editingId) {
        url = `${BASE_URL}/teams/team-updte/${editingId}`;
      } else {
        url = `${BASE_URL}/teams/team-store`;
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: teamName, company_id, branch_id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Success");
        setTeamName("");
        setEditingId(null);
        fetchTeams();
      } else {
        alert(data.message || "Error occurred");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (team) => {
    setTeamName(team.name);
    setEditingId(team.id);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;

    try {
      const res = await fetch(`${BASE_URL}/teams/team-delete/${id}?company_id=${company_id}&branch_id=${branch_id}`);
      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Deleted");
        fetchTeams();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="team-container">
        <div className="team-card">
          <h2>Team Management</h2>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="team-form">
            <input
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <button type="submit">
              {editingId ? "Update Team" : "Add Team"}
            </button>
          </form>

          {/* LIST */}
          <div className="team-list">
            {loading ? (
              <p>Loading...</p>
            ) : teams.length === 0 ? (
              <p>No teams found</p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="team-item">
                  <span>{team.name}</span>

                  <div className="actions">
                    <button onClick={() => handleEdit(team)}>Edit</button>
                    <button onClick={() => handleDelete(team.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamManagement;