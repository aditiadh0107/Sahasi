// middleware server - handles real-time websocket connections using socket.io
// notifies trusted contacts about SOS alerts and police about new incidents

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { Client } = require('pg')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

// setup socket.io with cors
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

// connect to postgres
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://aditidump@localhost:5432/sahasi_db',
})

dbClient.connect()
  .then(() => console.log('connected to postgres'))
  .catch(err => console.error('db connection error:', err))

// track active socket connections by user id
const activeUsers = new Map()
const activeTherapists = new Map()
const activePolice = new Map()

// socket.io connection handling
io.on('connection', (socket) => {
  console.log('new connection:', socket.id)

  // register user/therapist/police with their id
  socket.on('register', ({ userId, userType }) => {
    console.log('registered:', userType, userId)

    if (userType === 'user') {
      activeUsers.set(userId, socket.id)
    } else if (userType === 'therapist') {
      activeTherapists.set(userId, socket.id)
    } else if (userType === 'police') {
      activePolice.set(userId, socket.id)
    }

    socket.userId = userId
    socket.userType = userType
    socket.emit('registered', { success: true, userId })
  })

  // clean up when user disconnects
  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id)
    if (socket.userId && socket.userType) {
      if (socket.userType === 'user') activeUsers.delete(socket.userId)
      else if (socket.userType === 'therapist') activeTherapists.delete(socket.userId)
      else if (socket.userType === 'police') activePolice.delete(socket.userId)
    }
  })

  // send a chat message (saves to db and sends to receiver if online)
  socket.on('send_message', async (data) => {
    const { chatRequestId, senderId, senderType, messageText, receiverId } = data

    try {
      // save message to database
      const result = await dbClient.query(`
        INSERT INTO messages (chat_request_id, sender_id, sender_type, message_text)
        VALUES ($1, $2, $3, $4)
        RETURNING message_id, sent_at
      `, [chatRequestId, senderId, senderType, messageText])

      const message = {
        messageId: result.rows[0].message_id,
        chatRequestId,
        senderId,
        senderType,
        messageText,
        sentAt: result.rows[0].sent_at,
      }

      // find receiver socket and send them the message
      const receiverType = senderType === 'user' ? 'therapist' : 'user'
      const receiverSocketId = receiverType === 'user'
        ? activeUsers.get(receiverId)
        : activeTherapists.get(receiverId)

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', message)
      }

      socket.emit('message_sent', { success: true, message })
    } catch (error) {
      console.log('error sending message:', error)
      socket.emit('message_error', { error: 'Failed to send message' })
    }
  })

  // handle SOS alert from mobile app
  socket.on('sos_alert', async (data) => {
    const { userId, latitude, longitude, alertId } = data

    try {
      // get trusted contacts from db
      const contacts = await dbClient.query(`
        SELECT * FROM get_trusted_contacts($1)
      `, [userId])

      // get user name/phone
      const userInfo = await dbClient.query(`
        SELECT name, phone FROM users WHERE user_id = $1
      `, [userId])

      const alertData = {
        alertId,
        userId,
        userName: userInfo.rows[0]?.name,
        userPhone: userInfo.rows[0]?.phone,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }

      // notify each trusted contact if they are online
      contacts.rows.forEach((contact) => {
        const contactSocketId = activeUsers.get(contact.contact_user_id)
        if (contactSocketId) {
          io.to(contactSocketId).emit('sos_alert', alertData)
        }

        // also log in db
        dbClient.query(`
          INSERT INTO notification_logs (recipient_id, recipient_type, notification_type, notification_data)
          VALUES ($1, 'user', 'sos_alert', $2)
        `, [contact.contact_user_id, JSON.stringify(alertData)])
      })

      socket.emit('sos_alert_sent', { success: true, contactsNotified: contacts.rows.length })
      console.log('SOS alert sent by', userId, 'to', contacts.rows.length, 'contacts')
    } catch (error) {
      console.log('sos error:', error)
      socket.emit('sos_alert_error', { error: 'Failed to send SOS alert' })
    }
  })

  // location update - broadcasts to trusted contacts
  socket.on('update_location', async (data) => {
    const { userId, latitude, longitude, accuracy } = data
    try {
      await dbClient.query(`
        SELECT update_user_location($1, $2, $3, $4)
      `, [userId, latitude, longitude, accuracy])

      const contacts = await dbClient.query(`
        SELECT * FROM get_trusted_contacts($1)
      `, [userId])

      const locationData = {
        userId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      }

      contacts.rows.forEach((contact) => {
        const contactSocketId = activeUsers.get(contact.contact_user_id)
        if (contactSocketId) {
          io.to(contactSocketId).emit('contact_location_update', locationData)
        }
      })
    } catch (error) {
      console.log('location update error:', error)
    }
  })

  // notify therapist about new chat request
  socket.on('chat_request_notification', async (data) => {
    const { therapistId, userId, requestId } = data
    try {
      const therapistSocketId = activeTherapists.get(therapistId)
      if (therapistSocketId) {
        const userInfo = await dbClient.query(`
          SELECT name FROM users WHERE user_id = $1
        `, [userId])

        io.to(therapistSocketId).emit('new_chat_request', {
          requestId,
          userId,
          userName: userInfo.rows[0]?.name,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.log('chat request notification error:', error)
    }
  })

  // notify police about new incident report
  socket.on('incident_report_notification', async (data) => {
    const { reportId, userId, latitude, longitude } = data
    try {
      // send to all active police
      activePolice.forEach((socketId) => {
        io.to(socketId).emit('new_incident_report', {
          reportId,
          userId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        })
      })
      console.log('incident report', reportId, 'sent to', activePolice.size, 'police officers')
    } catch (error) {
      console.log('incident notification error:', error)
    }
  })

  // typing indicators for chat
  socket.on('typing_start', (data) => {
    const { chatRequestId, senderType, receiverId } = data
    const receiverType = senderType === 'user' ? 'therapist' : 'user'
    const receiverSocketId = receiverType === 'user' ? activeUsers.get(receiverId) : activeTherapists.get(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_indicator', { chatRequestId, isTyping: true })
    }
  })

  socket.on('typing_stop', (data) => {
    const { chatRequestId, senderType, receiverId } = data
    const receiverType = senderType === 'user' ? 'therapist' : 'user'
    const receiverSocketId = receiverType === 'user' ? activeUsers.get(receiverId) : activeTherapists.get(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_indicator', { chatRequestId, isTyping: false })
    }
  })
})

// rest endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Sahasi Middleware',
    activeUsers: activeUsers.size,
    activeTherapists: activeTherapists.size,
    activePolice: activePolice.size,
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', connections: { users: activeUsers.size, therapists: activeTherapists.size, police: activePolice.size } })
})

// trigger SOS notification (called by FastAPI backend)
app.post('/trigger/sos', async (req, res) => {
  const { userId, latitude, longitude, alertId } = req.body
  try {
    // get trusted contacts
    const contacts = await dbClient.query(`SELECT * FROM get_trusted_contacts($1)`, [userId])
    const userInfo = await dbClient.query(`SELECT name, phone FROM users WHERE user_id = $1`, [userId])

    const alertData = {
      alertId,
      userId,
      userName: userInfo.rows[0]?.name,
      userPhone: userInfo.rows[0]?.phone,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    }

    let notifiedCount = 0
    contacts.rows.forEach((contact) => {
      const contactSocketId = activeUsers.get(contact.contact_user_id)
      if (contactSocketId) {
        io.to(contactSocketId).emit('sos_alert', alertData)
        notifiedCount++
      }
    })

    res.json({ success: true, totalContacts: contacts.rows.length, notifiedCount })
  } catch (error) {
    console.log('trigger sos error:', error)
    res.status(500).json({ error: error.message })
  }
})

// trigger incident notification (called by FastAPI backend)
app.post('/trigger/incident', async (req, res) => {
  const { reportId, userId, latitude, longitude } = req.body
  try {
    const notificationData = { reportId, userId, latitude, longitude, timestamp: new Date().toISOString() }

    let notifiedCount = 0
    activePolice.forEach((socketId) => {
      io.to(socketId).emit('new_incident_report', notificationData)
      notifiedCount++
    })

    res.json({ success: true, notifiedCount })
  } catch (error) {
    console.log('trigger incident error:', error)
    res.status(500).json({ error: error.message })
  }
})

// trigger chat request notification (called by FastAPI backend)
app.post('/trigger/chat-request', async (req, res) => {
  const { therapistId, userId, requestId } = req.body
  try {
    const therapistSocketId = activeTherapists.get(therapistId)
    if (therapistSocketId) {
      const userInfo = await dbClient.query(`SELECT name FROM users WHERE user_id = $1`, [userId])
      io.to(therapistSocketId).emit('new_chat_request', {
        requestId,
        userId,
        userName: userInfo.rows[0]?.name,
        timestamp: new Date().toISOString(),
      })
      res.json({ success: true, notified: true })
    } else {
      res.json({ success: true, notified: false, reason: 'Therapist offline' })
    }
  } catch (error) {
    console.log('trigger chat request error:', error)
    res.status(500).json({ error: error.message })
  }
})

// cleanup expired connection codes every hour
setInterval(async () => {
  try {
    await dbClient.query('SELECT cleanup_expired_codes()')
    console.log('cleaned up expired codes')
  } catch (error) {
    console.log('cleanup error:', error)
  }
}, 3600000)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`middleware server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    dbClient.end()
    process.exit(0)
  })
})
