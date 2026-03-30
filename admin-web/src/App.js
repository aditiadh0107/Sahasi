import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import { buildApiUrl, API_ENDPOINTS, getFetchOptions } from './api';

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <li>
      <Link to={to} className={active ? 'active' : ''}>
        <span>{label}</span>
      </Link>
    </li>
  );
}

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, activeIncidents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersResponse = await fetch(buildApiUrl(API_ENDPOINTS.USERS));
      const usersData = usersResponse.ok ? await usersResponse.json() : [];
      const incidentsResponse = await fetch(buildApiUrl(API_ENDPOINTS.INCIDENTS));
      const incidentsData = incidentsResponse.ok ? await incidentsResponse.json() : [];
      const activeIncidents = incidentsData.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        activeIncidents,
      });
    } catch (error) {
      console.log('Error loading stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Sahasi Admin Dashboard</p>
        </div>
        <button className="refresh-btn" onClick={loadStats}>↻ Refresh</button>
      </div>
      {error && <div className="error-text">Error: {error}</div>}
      {loading && <p className="loading-text">Loading stats…</p>}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue" />
          <div className="stat-body">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange" />
          <div className="stat-body">
            <h3>Active Incidents</h3>
            <p className="stat-number">{stats.activeIncidents}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USERS));
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error loading users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) return;
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.DELETE_USER(userId)), getFetchOptions('DELETE'));
      if (!response.ok) throw new Error('Failed to delete user');
      loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.log('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  };

  return (
    <div className="users">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="refresh-btn" onClick={loadUsers}>↻ Refresh</button>
      </div>
      {error && <div className="error-text">Error: {error}</div>}
      {loading ? (
        <p className="loading-text">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="empty-text">No users found</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td className="center">
                    <button className="btn btn-sm btn-danger" onClick={() => deleteUser(user.user_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Therapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '',
    qualification: '', specialization: '', experience_years: '', license_number: ''
  });

  useEffect(() => { loadTherapists(); }, []);

  const loadTherapists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.THERAPISTS));
      if (!response.ok) throw new Error('Failed to load therapists');
      const data = await response.json();
      setTherapists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error loading therapists:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingTherapist
        ? API_ENDPOINTS.UPDATE_THERAPIST(editingTherapist.therapist_id)
        : API_ENDPOINTS.CREATE_THERAPIST;
      const method = editingTherapist ? 'PUT' : 'POST';
      const bodyData = { ...formData };
      if (editingTherapist && !bodyData.password) delete bodyData.password;
      const response = await fetch(buildApiUrl(endpoint), getFetchOptions(method, bodyData));
      if (!response.ok) throw new Error(`Failed to ${editingTherapist ? 'update' : 'create'} therapist`);
      resetForm();
      loadTherapists();
      alert(`Therapist ${editingTherapist ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.log('Error saving therapist:', error);
      alert(`Failed to ${editingTherapist ? 'update' : 'create'} therapist: ` + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', age: '', qualification: '', specialization: '', experience_years: '', license_number: '' });
    setEditingTherapist(null);
    setShowForm(false);
  };

  const editTherapist = (therapist) => {
    setFormData({
      name: therapist.name || '', email: therapist.email || '', password: '',
      age: therapist.age || '', qualification: therapist.qualification || '',
      specialization: therapist.specialization || '',
      experience_years: therapist.experience_years || '',
      license_number: therapist.license_number || ''
    });
    setEditingTherapist(therapist);
    setShowForm(true);
  };

  return (
    <div className="therapists">
      <div className="page-header">
        <div>
          <h1>Therapist Management</h1>
          <p>{therapists.length} therapist{therapists.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="refresh-btn" onClick={loadTherapists}>↻ Refresh</button>
      </div>
      {error && <div className="error-text">Error: {error}</div>}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Therapist'}
        </button>
        {showForm && (
          <button className="btn btn-secondary" onClick={resetForm}>Reset Form</button>
        )}
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingTherapist ? 'Edit Therapist' : 'Add New Therapist'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">{editingTherapist ? 'Password (leave blank to keep current)' : 'Password *'}</label>
                <input className="form-input" type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingTherapist} />
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input className="form-input" type="number" name="age" value={formData.age} onChange={handleInputChange} required min="18" max="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Qualification *</label>
                <input className="form-input" type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization *</label>
                <input className="form-input" type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Experience (Years) *</label>
                <input className="form-input" type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange} required min="0" max="50" />
              </div>
              <div className="form-group">
                <label className="form-label">License Number *</label>
                <input className="form-input" type="text" name="license_number" value={formData.license_number} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingTherapist ? 'Update Therapist' : 'Create Therapist'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading therapists…</p>
      ) : therapists.length === 0 ? (
        <p className="empty-text">No therapists found</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>License #</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {therapists.map((therapist) => (
                <tr key={therapist.therapist_id}>
                  <td>{therapist.therapist_id}</td>
                  <td>{therapist.name || 'N/A'}</td>
                  <td>{therapist.email || 'N/A'}</td>
                  <td>{therapist.license_number || 'N/A'}</td>
                  <td>{therapist.specialization || 'N/A'}</td>
                  <td>{therapist.experience_years ? `${therapist.experience_years} yrs` : 'N/A'}</td>
                  <td className="center">
                    <button className="btn btn-sm btn-primary" onClick={() => editTherapist(therapist)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadIncidents(); }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.INCIDENTS));
      if (!response.ok) throw new Error('Failed to load incidents');
      const data = await response.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error loading incidents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = statusFilter === 'all' ? incidents : incidents.filter(i => i.status === statusFilter);

  const updateStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.UPDATE_INCIDENT(reportId)), getFetchOptions('PUT', { status: newStatus }));
      if (!response.ok) throw new Error('Failed to update incident');
      loadIncidents();
    } catch (error) {
      console.log('Error updating incident:', error);
      alert('Failed to update incident: ' + error.message);
    }
  };

  const statusColor = (s) => {
    if (s === 'submitted')    return 'submitted';
    if (s === 'investigating') return 'investigating';
    if (s === 'resolved')     return 'resolved';
    if (s === 'closed')       return 'closed';
    return 'pending';
  };

  return (
    <div className="incidents">
      <div className="page-header">
        <div>
          <h1>Incident Reports</h1>
          <p>{filteredIncidents.length} report{filteredIncidents.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="refresh-btn" onClick={loadIncidents}>↻ Refresh</button>
      </div>
      {error && <div className="error-text">Error: {error}</div>}

      <div className="filter-bar">
        <span className="filter-label">Filter by Status:</span>
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Loading incidents…</p>
      ) : filteredIncidents.length === 0 ? (
        <p className="empty-text">No incidents found</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>User ID</th>
                <th>Description</th>
                <th>Status</th>
                <th className="center">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.report_id}>
                  <td>{incident.report_id}</td>
                  <td>{incident.user_id}</td>
                  <td>{incident.description ? incident.description.substring(0, 50) + '...' : 'N/A'}</td>
                  <td>
                    <span className={`status-pill ${statusColor(incident.status)}`}>{incident.status}</span>
                  </td>
                  <td className="center">
                    <select
                      className="form-select"
                      style={{ width: 'auto', fontSize: '0.78rem' }}
                      value={incident.status}
                      onChange={(e) => updateStatus(incident.report_id, e.target.value)}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="sidebar">
          <div className="logo">
            <h2>Sahasi Admin</h2>
            <div className="logo-sub">Admin Portal</div>
          </div>
          <ul className="nav-links">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/users" label="Users" />
            <NavItem to="/therapists" label="Therapists" />
            <NavItem to="/incidents" label="Incidents" />
          </ul>
          <div className="sidebar-footer">
            <div className="live-dot">Live</div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/therapists" element={<Therapists />} />
            <Route path="/incidents" element={<Incidents />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
