import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import { buildApiUrl, API_ENDPOINTS, getFetchOptions, POLICE_ID, MIDDLEWARE_URL } from './api';
import io from 'socket.io-client';

// ── helpers ──────────────────────────────────────────────────────────────────

const statusClass = (s) =>
  ['submitted','pending','investigating','resolved','closed'].includes(s) ? s : 'pending';

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const parseDesc = (inc) => {
  // backend now parses JSON and returns flat fields directly
  if (inc && inc.incident_type !== undefined) {
    return {
      title:       inc.title || '',
      description: inc.incident_description || inc.description || '',
      type:        inc.incident_type || '',
      severity:    inc.severity || '',
      location:    inc.location_text || '',
      dateTime:    inc.date_time || '',
      suspect:     inc.suspect_description || '',
      witness:     inc.witness_available ? 'Yes' : 'No',
      phone:       inc.phone_number || '',
    };
  }
  // fallback: try parsing description as JSON for old records
  const raw = (inc && inc.description) || '';
  try {
    const d = JSON.parse(raw);
    return {
      title:       d.title || '',
      description: d.description || '',
      type:        d.incident_type || '',
      severity:    d.severity || '',
      location:    d.location || '',
      dateTime:    d.date_time || '',
      suspect:     d.suspect_description || '',
      witness:     d.witness_available ? 'Yes' : 'No',
      phone:       d.phone_number || '',
    };
  } catch {
    return {
      title: raw.split('\n')[0] || '',
      description: raw,
      type: '', severity: '', location: '', dateTime: '',
      suspect: '', witness: '', phone: '',
    };
  }
};

const toImageSrc = (raw) => {
  if (!raw) return null;
  return raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`;
};

// ── NavLink wrapper ───────────────────────────────────────────────────────────

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

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, investigating: 0 });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.INCIDENTS));
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setStats({
        total:        data.length,
        active:       data.filter(i => i.status === 'pending' || i.status === 'submitted').length,
        investigating:data.filter(i => i.status === 'investigating').length,
        resolved:     data.filter(i => i.status === 'resolved' || i.status === 'closed').length,
      });
    } catch (e) { console.log('stats error:', e); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Sahasi Police Monitoring Dashboard</p>
        </div>
        <button className="refresh-btn" onClick={loadStats}>↻ Refresh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"></div>
          <div className="stat-body">
            <h3>Total Reports</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"></div>
          <div className="stat-body">
            <h3>Pending</h3>
            <p className="stat-number">{stats.active}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"></div>
          <div className="stat-body">
            <h3>Investigating</h3>
            <p className="stat-number">{stats.investigating}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"></div>
          <div className="stat-body">
            <h3>Resolved</h3>
            <p className="stat-number">{stats.resolved}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Incidents ─────────────────────────────────────────────────────────────────

const Incidents = () => {
  const [incidents, setIncidents]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selected, setSelected]           = useState(null);

  useEffect(() => {
    loadIncidents();

    const socket = io(MIDDLEWARE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('register', { userId: POLICE_ID, userType: 'police' });
    });

    socket.on('new_incident_report', () => loadIncidents());

    return () => socket.disconnect();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(buildApiUrl(API_ENDPOINTS.INCIDENTS));
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? [...data].reverse() : []);
    } catch (e) {
      setError(e.message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(buildApiUrl(`/api/incidents/${id}`), getFetchOptions('PUT', { status }));
      if (res.ok) { loadIncidents(); setSelected(null); }
    } catch (e) { console.log('update error:', e); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Incident Reports</h1>
          <p>{incidents.length} report{incidents.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="refresh-btn" onClick={loadIncidents}>↻ Refresh</button>
      </div>

      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button className="retry-btn" onClick={loadIncidents}>Retry</button>
        </div>
      )}

      <div className="incidents-layout">
        {/* ── List panel ── */}
        <div className="incidents-panel">
          <div className="panel-header">
            <span className="panel-title">All Reports</span>
            <span className="count-pill">{incidents.length}</span>
          </div>

          <div className="incidents-scroll">
            {loading && (
              <div className="loading-state"><p>Loading incidents…</p></div>
            )}

            {!loading && incidents.length === 0 && (
              <div className="empty-state">
                <p>No reports yet</p>
                <small>
                  • Submit a report from the mobile app<br />
                  • Open the Incident tab and fill out the form<br />
                  • Reports appear here in real-time
                </small>
                <button className="retry-btn" onClick={loadIncidents}>Refresh</button>
              </div>
            )}

            {!loading && incidents.map((inc) => {
              const { title: parsedTitle } = parseDesc(inc);
              const title = parsedTitle || 'Incident Report';
              const sc = statusClass(inc.status);
              return (
                <div
                  key={inc.report_id}
                  className={`incident-row ${selected?.report_id === inc.report_id ? 'active' : ''}`}
                  onClick={() => setSelected(inc)}
                >
                  <div className={`incident-row-bar bar-${sc}`} />
                  <div className="incident-row-body">
                    <div className="incident-row-top">
                      <span className="incident-row-title">{title}</span>
                      <span className={`status-pill ${sc}`}>{inc.status}</span>
                    </div>
                    <div className="incident-row-meta">
                      <span>User: {inc.user_id || '—'}</span>
                      <span>{fmt(inc.reported_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <span className="detail-panel-title">
              {selected ? 'Incident Details' : 'Select a report'}
            </span>
            {selected && (
              <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
            )}
          </div>

          {!selected ? (
            <div className="detail-empty">
              <p>Click any incident on the left to view its full details here.</p>
            </div>
          ) : (() => {
            const { type, severity, location, dateTime, suspect, witness, phone, description } = parseDesc(selected);
            const imageSrc = toImageSrc(selected.image_data);
            const sc = statusClass(selected.status);
            return (
              <div className="detail-body">
                {/* report meta */}
                <div className="info-grid">
                  <div className="info-block">
                    <div className="info-label">Report ID</div>
                    <div className="info-value">#{selected.report_id}</div>
                  </div>
                  <div className="info-block">
                    <div className="info-label">Status</div>
                    <div className="info-value">
                      <span className={`status-pill ${sc}`}>{selected.status}</span>
                    </div>
                  </div>
                  <div className="info-block">
                    <div className="info-label">User ID</div>
                    <div className="info-value">{selected.user_id || '—'}</div>
                  </div>
                  <div className="info-block">
                    <div className="info-label">Reported At</div>
                    <div className="info-value">{fmt(selected.reported_at)}</div>
                  </div>
                  {type && (
                    <div className="info-block">
                      <div className="info-label">Incident Type</div>
                      <div className="info-value">{type}</div>
                    </div>
                  )}
                  {severity && (
                    <div className="info-block">
                      <div className="info-label">Severity</div>
                      <div className={`info-value severity-text severity-${severity.toLowerCase()}`}>{severity}</div>
                    </div>
                  )}
                  {location && (
                    <div className="info-block full">
                      <div className="info-label">Location</div>
                      <div className="info-value">{location}</div>
                    </div>
                  )}
                  {dateTime && (
                    <div className="info-block full">
                      <div className="info-label">Date / Time of Incident</div>
                      <div className="info-value">{dateTime}</div>
                    </div>
                  )}
                  {phone && (
                    <div className="info-block full">
                      <div className="info-label">Contact Number</div>
                      <div className="info-value phone">{phone}</div>
                    </div>
                  )}
                </div>

                {/* description */}
                <div className="info-block">
                  <div className="info-label">Description</div>
                  <div className="info-value description">{description}</div>
                </div>

                {/* suspect + witness */}
                {(suspect || witness) && (
                  <div className="info-grid">
                    {suspect && (
                      <div className="info-block full">
                        <div className="info-label">Suspect Description</div>
                        <div className="info-value description">{suspect}</div>
                      </div>
                    )}
                    {witness && (
                      <div className="info-block">
                        <div className="info-label">Witness Available</div>
                        <div className="info-value">{witness}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* evidence image */}
                {imageSrc && (
                  <div className="evidence-wrapper">
                    <div className="evidence-label">Evidence Image</div>
                    <img src={imageSrc} alt="Evidence" className="evidence-img" />
                  </div>
                )}

                {/* actions */}
                <div>
                  <div className="action-section-title">Update Status</div>
                  <div className="action-buttons">
                    <button
                      className="action-btn investigating"
                      onClick={() => updateStatus(selected.report_id, 'investigating')}
                    >Investigating</button>
                    <button
                      className="action-btn resolved"
                      onClick={() => updateStatus(selected.report_id, 'resolved')}
                    >Resolved</button>
                    <button
                      className="action-btn closed"
                      onClick={() => updateStatus(selected.report_id, 'closed')}
                    >Close Report</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// ── App shell ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="sidebar">
          <div className="logo">
            <h2>Sahasi Police</h2>
            <div className="logo-sub">Monitoring Portal</div>
          </div>
          <ul className="nav-links">
            <NavItem to="/"          label="Dashboard" />
            <NavItem to="/incidents" label="Incidents" />
          </ul>
          <div className="sidebar-footer">
            <div className="live-dot">Live</div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
