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
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [stats, setStats] = useState({ pendingRequests: 0, activeChats: 0 });

  useEffect(() => { loadTherapists(); }, []);
  useEffect(() => { if (selectedTherapistId) loadStats(); }, [selectedTherapistId]);

  const loadTherapists = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.THERAPISTS));
      if (!response.ok) throw new Error('Failed to load therapists');
      const data = await response.json();
      setTherapists(data || []);
      if (data.length > 0) setSelectedTherapistId(data[0].therapist_id);
    } catch (error) { console.log('Error loading therapists:', error); }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT_REQUESTS_FOR_THERAPIST(selectedTherapistId)));
      if (!response.ok) throw new Error('Failed to load chat requests');
      const requests = await response.json();
      setStats({
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        activeChats:     requests.filter(r => r.status === 'accepted').length,
      });
    } catch (error) { console.log('Error loading stats:', error); }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Sahasi Therapist Dashboard</p>
        </div>
        <button className="refresh-btn" onClick={loadStats}>↻ Refresh</button>
      </div>

      <div className="therapist-bar">
        <span className="filter-label">Select Therapist:</span>
        <select className="form-select" style={{ width: 'auto' }} value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)}>
          <option value="">-- Choose a therapist --</option>
          {therapists.map((t) => (
            <option key={t.therapist_id} value={t.therapist_id}>{t.name} ({t.specialization})</option>
          ))}
        </select>
      </div>

      {selectedTherapistId && (
        <>
          <p className="viewing-label">
            Viewing requests for: <strong>{therapists.find(t => t.therapist_id === selectedTherapistId)?.name}</strong>
          </p>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange" />
              <div className="stat-body">
                <h3>Pending Requests</h3>
                <p className="stat-number">{stats.pendingRequests}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue" />
              <div className="stat-body">
                <h3>Active Chats</h3>
                <p className="stat-number">{stats.activeChats}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ChatRequests = () => {
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadTherapists(); }, []);
  useEffect(() => { if (selectedTherapistId) loadRequests(); }, [selectedTherapistId]);

  const loadTherapists = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.THERAPISTS));
      if (!response.ok) throw new Error('Failed to load therapists');
      const data = await response.json();
      setTherapists(data || []);
      if (data.length > 0) setSelectedTherapistId(data[0].therapist_id);
    } catch (error) { console.log('Error loading therapists:', error); }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT_REQUESTS_FOR_THERAPIST(selectedTherapistId)));
      if (!response.ok) throw new Error('Failed to load chat requests');
      const data = await response.json();
      setRequests(data || []);
      setError(null);
    } catch (error) {
      console.log('Error loading requests:', error);
      setError(error.message);
    } finally { setLoading(false); }
  };

  const handleAccept = async (requestId) => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT_REQUEST_RESPOND(requestId)), getFetchOptions('PUT', { status: 'accepted' }));
      if (!response.ok) throw new Error('Failed to accept request');
      loadRequests();
    } catch (error) {
      console.log('Error accepting request:', error);
      alert('Failed to accept request: ' + error.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CHAT_REQUEST_RESPOND(requestId)), getFetchOptions('PUT', { status: 'rejected' }));
      if (!response.ok) throw new Error('Failed to reject request');
      loadRequests();
    } catch (error) {
      console.log('Error rejecting request:', error);
      alert('Failed to reject request: ' + error.message);
    }
  };

  const statusClass = (s) => s === 'pending' ? 'pending' : s === 'accepted' ? 'resolved' : 'closed';

  return (
    <div className="chat-requests">
      <div className="page-header">
        <div>
          <h1>Chat Requests</h1>
          <p>{requests.length} request{requests.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="refresh-btn" onClick={loadRequests}>↻ Refresh</button>
      </div>

      <div className="therapist-bar">
        <span className="filter-label">Select Therapist:</span>
        <select className="form-select" style={{ width: 'auto' }} value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)}>
          <option value="">-- Choose a therapist --</option>
          {therapists.map((t) => (
            <option key={t.therapist_id} value={t.therapist_id}>{t.name} ({t.specialization})</option>
          ))}
        </select>
      </div>

      {error && <div className="error-text">Error: {error}</div>}
      {loading ? (
        <p className="loading-text">Loading requests…</p>
      ) : requests.length === 0 ? (
        <p className="empty-text">No chat requests for this therapist.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Status</th>
                <th>Requested At</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.user_name}</td>
                  <td><span className={`status-pill ${statusClass(request.status)}`}>{request.status}</span></td>
                  <td>{new Date(request.requested_at).toLocaleString()}</td>
                  <td className="center">
                    {request.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success" style={{ marginRight: 6 }} onClick={() => handleAccept(request.request_id)}>Accept</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(request.request_id)}>Reject</button>
                      </>
                    )}
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

const Messages = () => {
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [acceptedChats, setAcceptedChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadTherapists(); }, []);
  useEffect(() => { if (selectedTherapistId) loadAcceptedChats(); }, [selectedTherapistId]);
  useEffect(() => {
    if (selectedChatId) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChatId]);

  const loadTherapists = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.THERAPISTS));
      if (!response.ok) throw new Error('Failed to load therapists');
      const data = await response.json();
      setTherapists(data || []);
      if (data.length > 0) setSelectedTherapistId(data[0].therapist_id);
    } catch (error) { console.log('Error loading therapists:', error); setError(error.message); }
  };

  const loadAcceptedChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ACCEPTED_CHATS(selectedTherapistId)));
      if (!response.ok) throw new Error('Failed to load accepted chats');
      const data = await response.json();
      setAcceptedChats(data || []);
      setError(null);
    } catch (error) { console.log('Error loading accepted chats:', error); setError(error.message); }
    finally { setLoading(false); }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MESSAGES(selectedChatId)));
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data || []);
    } catch (error) { console.log('Error loading messages:', error); }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) { alert('Please enter a message'); return; }
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SEND_MESSAGE), getFetchOptions('POST', {
        request_id: selectedChatId, sender_id: selectedTherapistId,
        sender_type: 'therapist', message_text: messageText
      }));
      if (!response.ok) throw new Error('Failed to send message');
      setMessageText('');
      loadMessages();
    } catch (error) { console.log('Error sending message:', error); alert('Failed to send message: ' + error.message); }
  };

  return (
    <div className="messages">
      <div className="page-header">
        <div>
          <h1>Chat with Users</h1>
          <p>Real-time messaging with accepted clients</p>
        </div>
      </div>

      {error && <div className="error-text">Error: {error}</div>}

      <div className="therapist-bar">
        <span className="filter-label">Select Therapist:</span>
        <select className="form-select" style={{ width: 'auto' }} value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)}>
          <option value="">-- Choose a therapist --</option>
          {therapists.map((t) => (
            <option key={t.therapist_id} value={t.therapist_id}>{t.name} ({t.specialization})</option>
          ))}
        </select>
      </div>

      {selectedTherapistId && (
        <div className="chat-layout">
          <div className="chat-list">
            <div className="chat-list-header">Accepted Chats</div>
            <div className="chat-list-scroll">
              {loading ? (
                <div className="chat-list-empty">Loading chats…</div>
              ) : acceptedChats.length === 0 ? (
                <div className="chat-list-empty">No accepted chats yet</div>
              ) : (
                acceptedChats.map((chat) => (
                  <div
                    key={chat.request_id}
                    className={`chat-list-item ${selectedChatId === chat.request_id ? 'active' : ''}`}
                    onClick={() => setSelectedChatId(chat.request_id)}
                  >
                    <div className="chat-list-item-name">{chat.user_name}</div>
                    <div className="chat-list-item-date">{new Date(chat.responded_at).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-window">
            {selectedChatId ? (
              <>
                <div className="chat-window-header">
                  Chat with {acceptedChats.find(c => c.request_id === selectedChatId)?.user_name}
                </div>
                <div className="messages-area">
                  {messages.length === 0 ? (
                    <div className="messages-empty">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.message_id} className={`message ${msg.sender_type === 'therapist' ? 'therapist' : 'user-msg'}`}>
                        <div className="message-meta">
                          {msg.sender_type === 'therapist' ? 'You' : 'User'} · {new Date(msg.sent_at).toLocaleTimeString()}
                        </div>
                        {msg.message_text}
                      </div>
                    ))
                  )}
                </div>
                <div className="message-input-row">
                  <input
                    className="message-input"
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Type your message…"
                  />
                  <button className="btn btn-primary" onClick={handleSendMessage}>Send</button>
                </div>
              </>
            ) : (
              <div className="chat-window-empty">Select a chat to start messaging</div>
            )}
          </div>
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
            <h2>Sahasi Therapist</h2>
            <div className="logo-sub">Therapist Portal</div>
          </div>
          <ul className="nav-links">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/requests" label="Chat Requests" />
            <NavItem to="/messages" label="Messages" />
          </ul>
          <div className="sidebar-footer">
            <div className="live-dot">Live</div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/requests" element={<ChatRequests />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
