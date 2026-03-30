-- Sahasi Women Safety App - PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 13 AND age <= 120),
    height DECIMAL(5, 2) NOT NULL CHECK (height > 0), -- in meters
    weight DECIMAL(5, 2) NOT NULL CHECK (weight > 0), -- in kg
    bmi DECIMAL(5, 2) GENERATED ALWAYS AS (weight / (height * height)) STORED,
    bmi_category INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN (weight / (height * height)) < 25 THEN 1
            ELSE 2
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_bmi_category ON users(bmi_category);

-- ============================================
-- THERAPISTS TABLE
-- ============================================
CREATE TABLE therapists (
    therapist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18),
    qualification VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for therapists
CREATE INDEX idx_therapists_email ON therapists(email);
CREATE INDEX idx_therapists_specialization ON therapists(specialization);

-- ============================================
-- POLICE TABLE
-- ============================================
CREATE TABLE police (
    police_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    station_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'officer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for police
CREATE INDEX idx_police_email ON police(email);
CREATE INDEX idx_police_badge ON police(badge_number);

-- ============================================
-- TRUSTED CONTACTS TABLE
-- ============================================
CREATE TABLE trusted_contacts (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connection_code VARCHAR(6) UNIQUE,
    code_expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'connected')),
    connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users CHECK (user_id_1 != user_id_2)
);

-- Indexes for trusted contacts
CREATE INDEX idx_trusted_contacts_user1 ON trusted_contacts(user_id_1);
CREATE INDEX idx_trusted_contacts_user2 ON trusted_contacts(user_id_2);
CREATE INDEX idx_trusted_contacts_code ON trusted_contacts(connection_code);
CREATE INDEX idx_trusted_contacts_status ON trusted_contacts(status);

-- Directional trusted contact links for fast lookup.
CREATE TABLE trusted_contact_links (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trusted_contact_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trusted_contact_link_unique UNIQUE (user_id, trusted_contact_id),
    CONSTRAINT trusted_contact_link_not_self CHECK (user_id <> trusted_contact_id)
);

CREATE INDEX idx_trusted_contact_links_user ON trusted_contact_links(user_id);
CREATE INDEX idx_trusted_contact_links_contact ON trusted_contact_links(trusted_contact_id);

-- ============================================
-- LOCATION ZONES TABLE
-- ============================================
CREATE TABLE zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    zone_type VARCHAR(10) NOT NULL CHECK (zone_type IN ('safe', 'unsafe')),
    zone_name VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INTEGER DEFAULT 1000, -- in meters (default 1 km)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for zones
CREATE INDEX idx_zones_user ON zones(user_id);
CREATE INDEX idx_zones_type ON zones(zone_type);
CREATE INDEX idx_zones_location ON zones(latitude, longitude);

-- ============================================
-- INCIDENT REPORTS TABLE
-- ============================================
CREATE TABLE incident_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    image_data TEXT, -- Base64 encoded image or URL
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES police(police_id)
);

-- Indexes for incident reports
CREATE INDEX idx_incident_reports_user ON incident_reports(user_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_incident_reports_date ON incident_reports(reported_at);
CREATE INDEX idx_incident_reports_location ON incident_reports(latitude, longitude);

-- ============================================
-- SOS ALERTS TABLE
-- ============================================
CREATE TABLE sos_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes for SOS alerts
CREATE INDEX idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_sos_alerts_date ON sos_alerts(triggered_at);

-- ============================================
-- CHAT REQUESTS TABLE
-- ============================================
CREATE TABLE chat_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(therapist_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Indexes for chat requests
CREATE INDEX idx_chat_requests_user ON chat_requests(user_id);
CREATE INDEX idx_chat_requests_therapist ON chat_requests(therapist_id);
CREATE INDEX idx_chat_requests_status ON chat_requests(status);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID NOT NULL REFERENCES chat_requests(request_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'therapist')),
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes for messages
CREATE INDEX idx_messages_chat ON messages(chat_request_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_date ON messages(sent_at);

-- ============================================
-- SELF DEFENCE LESSONS TABLE
-- ============================================
CREATE TABLE lessons (
    lesson_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bmi_category INTEGER NOT NULL CHECK (bmi_category IN (1, 2)),
    lesson_title VARCHAR(255) NOT NULL,
    lesson_description TEXT,
    video_url TEXT NOT NULL,
    animation_url TEXT,
    duration_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    lesson_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lessons
CREATE INDEX idx_lessons_category ON lessons(bmi_category);
CREATE INDEX idx_lessons_order ON lessons(lesson_order);

-- ============================================
-- LEGAL TOPICS TABLE (For Chatbot)
-- ============================================
CREATE TABLE legal_topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_name VARCHAR(255) NOT NULL UNIQUE,
    topic_description TEXT NOT NULL,
    relevant_laws TEXT[], -- Array of law names
    actionable_steps TEXT[], -- Array of steps
    helpline_numbers TEXT[], -- Array of helpline contacts
    keywords TEXT[], -- For search functionality
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for legal topics
CREATE INDEX idx_legal_topics_name ON legal_topics(topic_name);

-- ============================================
-- USER LOCATION TRACKING TABLE (For real-time location)
-- ============================================
CREATE TABLE user_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2), -- GPS accuracy in meters
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user locations
CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_updated ON user_locations(updated_at);

-- ============================================
-- NOTIFICATION LOGS TABLE
-- ============================================
CREATE TABLE notification_logs (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'therapist', 'police')),
    notification_type VARCHAR(50) NOT NULL,
    notification_data JSONB,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes for notifications
CREATE INDEX idx_notifications_recipient ON notification_logs(recipient_id, recipient_type);
CREATE INDEX idx_notifications_type ON notification_logs(notification_type);
CREATE INDEX idx_notifications_date ON notification_logs(sent_at);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample legal topics
INSERT INTO legal_topics (topic_name, topic_description, relevant_laws, actionable_steps, helpline_numbers, keywords) VALUES
(
    'Domestic Violence',
    'Protection against violence within the household including physical, emotional, sexual, and economic abuse.',
    ARRAY['Protection of Women from Domestic Violence Act, 2005', 'Section 498A IPC'],
    ARRAY['File a complaint at nearest police station', 'Seek protection order from magistrate', 'Contact women helpline for support', 'Document evidence of abuse'],
    ARRAY['181 - Women Helpline', '1091 - Police', '100 - Emergency'],
    ARRAY['domestic', 'violence', 'abuse', 'husband', 'family', 'physical', 'emotional']
),
(
    'Sexual Harassment',
    'Unwelcome sexual advances, requests for sexual favors, and other verbal or physical conduct of a sexual nature.',
    ARRAY['Sexual Harassment of Women at Workplace Act, 2013', 'Section 354A IPC'],
    ARRAY['Report to Internal Complaints Committee (ICC)', 'File police complaint within 3 months', 'Collect evidence (emails, messages, witnesses)', 'Seek legal counsel'],
    ARRAY['181 - Women Helpline', '1091 - Police', '1800-123-9999 - NCW Helpline'],
    ARRAY['harassment', 'sexual', 'workplace', 'unwelcome', 'advances', 'touching']
),
(
    'Dowry Laws',
    'Prevention and punishment for giving or taking dowry in connection with marriage.',
    ARRAY['Dowry Prohibition Act, 1961', 'Section 304B IPC (Dowry Death)', 'Section 498A IPC'],
    ARRAY['File FIR at police station', 'Provide evidence of dowry demand', 'Contact National Commission for Women', 'Seek protection order if facing threats'],
    ARRAY['181 - Women Helpline', '1091 - Police', '011-26942369 - NCW'],
    ARRAY['dowry', 'marriage', 'demand', 'gifts', 'harassment', 'death']
),
(
    'FIR Process',
    'First Information Report - How to file a complaint at police station for any cognizable offense.',
    ARRAY['Section 154 CrPC', 'Section 156 CrPC'],
    ARRAY['Visit nearest police station', 'Provide detailed written complaint', 'Get FIR copy (mandatory)', 'If refused, approach Superintendent of Police', 'Can file online FIR in many states'],
    ARRAY['100 - Police Emergency', '1091 - Women Police'],
    ARRAY['fir', 'complaint', 'police', 'report', 'crime', 'station']
),
(
    'Workplace Harassment',
    'Rights and remedies for harassment at workplace including sexual harassment and discrimination.',
    ARRAY['Sexual Harassment of Women at Workplace Act, 2013', 'Equal Remuneration Act, 1976', 'Maternity Benefit Act, 1961'],
    ARRAY['Report to Internal Complaints Committee', 'File written complaint within 3 months', 'Can remain anonymous initially', 'Employer must complete inquiry within 90 days'],
    ARRAY['1800-123-9999 - NCW Helpline', '1091 - Police', '181 - Women Helpline'],
    ARRAY['workplace', 'office', 'harassment', 'discrimination', 'boss', 'colleague']
),
(
    'Divorce Rights',
    'Legal grounds and process for divorce, maintenance, and child custody rights.',
    ARRAY['Hindu Marriage Act, 1955', 'Special Marriage Act, 1954', 'Muslim Personal Law', 'Section 125 CrPC (Maintenance)'],
    ARRAY['Consult a family lawyer', 'File divorce petition in family court', 'Claim maintenance and alimony', 'Seek child custody if applicable', 'Mediation available before trial'],
    ARRAY['155260 - National Legal Services Authority', '011-26942369 - NCW'],
    ARRAY['divorce', 'separation', 'maintenance', 'alimony', 'custody', 'marriage']
),
(
    'Police Rights',
    'Your rights when dealing with police including arrest procedures and protection from abuse.',
    ARRAY['Section 41 CrPC (Arrest Procedures)', 'Section 42 CrPC', 'Section 46 CrPC', 'D.K. Basu Guidelines'],
    ARRAY['Police must inform reason for arrest', 'Right to be informed of grounds of arrest', 'Right to consult lawyer', 'Cannot be detained beyond 24 hours without magistrate order', 'Woman cannot be arrested after sunset', 'Medical examination right if custodial violence'],
    ARRAY['100 - Police Emergency', '1091 - Women Police', '1800-110-007 - State Human Rights Commission'],
    ARRAY['police', 'arrest', 'custody', 'rights', 'detention', 'interrogation']
);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to clean up expired connection codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM trusted_contacts 
    WHERE status = 'pending' 
    AND code_expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
    p_user_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_location_id UUID;
BEGIN
    -- Delete old location
    DELETE FROM user_locations WHERE user_id = p_user_id;
    
    -- Insert new location
    INSERT INTO user_locations (user_id, latitude, longitude, accuracy)
    VALUES (p_user_id, p_latitude, p_longitude, p_accuracy)
    RETURNING location_id INTO v_location_id;
    
    RETURN v_location_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get trusted contacts for user
CREATE OR REPLACE FUNCTION get_trusted_contacts(p_user_id UUID)
RETURNS TABLE (
    contact_user_id UUID,
    contact_name VARCHAR,
    contact_phone VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN tc.user_id_1 = p_user_id THEN u.user_id
            ELSE u2.user_id
        END as contact_user_id,
        CASE 
            WHEN tc.user_id_1 = p_user_id THEN u.name
            ELSE u2.name
        END as contact_name,
        CASE 
            WHEN tc.user_id_1 = p_user_id THEN u.phone
            ELSE u2.phone
        END as contact_phone
    FROM trusted_contacts tc
    LEFT JOIN users u ON tc.user_id_2 = u.user_id
    LEFT JOIN users u2 ON tc.user_id_1 = u2.user_id
    WHERE (tc.user_id_1 = p_user_id OR tc.user_id_2 = p_user_id)
    AND tc.status = 'connected';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active SOS alerts with user details
CREATE OR REPLACE VIEW active_sos_alerts AS
SELECT 
    sa.alert_id,
    sa.user_id,
    u.name as user_name,
    u.phone as user_phone,
    sa.latitude,
    sa.longitude,
    sa.triggered_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sa.triggered_at))/60 as minutes_active
FROM sos_alerts sa
JOIN users u ON sa.user_id = u.user_id
WHERE sa.status = 'active';

-- View for pending incident reports
CREATE OR REPLACE VIEW pending_incident_reports AS
SELECT 
    ir.report_id,
    ir.user_id,
    u.name as reporter_name,
    u.phone as reporter_phone,
    ir.description,
    ir.latitude,
    ir.longitude,
    ir.reported_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ir.reported_at))/3600 as hours_pending
FROM incident_reports ir
JOIN users u ON ir.user_id = u.user_id
WHERE ir.status = 'pending'
ORDER BY ir.reported_at DESC;

-- View for therapist chat statistics
CREATE OR REPLACE VIEW therapist_chat_stats AS
SELECT 
    t.therapist_id,
    t.name,
    COUNT(CASE WHEN cr.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN cr.status = 'accepted' THEN 1 END) as active_chats,
    COUNT(CASE WHEN cr.status = 'rejected' THEN 1 END) as rejected_requests
FROM therapists t
LEFT JOIN chat_requests cr ON t.therapist_id = cr.therapist_id
GROUP BY t.therapist_id, t.name;

-- ============================================
-- PERMISSIONS (Example - adjust as needed)
-- ============================================

-- Create roles
-- CREATE ROLE app_user;
-- CREATE ROLE app_therapist;
-- CREATE ROLE app_police;

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON users, zones, incident_reports, sos_alerts, messages TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON therapists, chat_requests, messages TO app_therapist;
-- GRANT SELECT, UPDATE ON incident_reports TO app_police;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_trusted_contacts_users ON trusted_contacts(user_id_1, user_id_2, status);
CREATE INDEX idx_messages_chat_date ON messages(chat_request_id, sent_at);
CREATE INDEX idx_incident_reports_status_date ON incident_reports(status, reported_at DESC);

-- ============================================
-- DATABASE SETUP COMPLETE
-- ============================================
