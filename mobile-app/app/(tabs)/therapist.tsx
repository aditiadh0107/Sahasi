// therapist chat screen - users can request and chat with therapists
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProfile } from '@/contexts/ProfileContext'
import { buildApiUrl, getFetchOptions } from '@/constants/api'

export default function TherapistChatScreen() {
  const router = useRouter()
  const { profile, isProfileComplete } = useProfile()

  const [therapists, setTherapists] = useState<any[]>([])
  const [chatRequests, setChatRequests] = useState<any[]>([])
  const [activeRequestId, setActiveRequestId] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)

  const chatScrollRef = useRef<ScrollView | null>(null)
  const userId = profile.id || ''

  // find the active request object
  const activeRequest = chatRequests.find(r => r.request_id === activeRequestId)

  const loadTherapists = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/therapists'))
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setTherapists(data)
    } catch (error) {
      console.log('therapists error:', error)
    }
  }

  const loadChatRequests = async () => {
    if (!userId) return
    try {
      const res = await fetch(buildApiUrl('/api/chat-requests', { user_id: userId }))
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setChatRequests(data)

      // auto-select first accepted request
      if (!activeRequestId) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].status === 'accepted') {
            setActiveRequestId(data[i].request_id)
            break
          }
        }
      }
    } catch (error) {
      console.log('chat requests error:', error)
    }
  }

  const loadMessages = async (requestId: string) => {
    try {
      const res = await fetch(buildApiUrl(`/api/chat-requests/${requestId}/messages`))
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.log('messages error:', error)
    }
  }

  useEffect(() => {
    if (!isProfileComplete || !userId) return
    loadTherapists()
    loadChatRequests()
  }, [userId, isProfileComplete])

  // poll for new messages every 3 seconds when there's an active chat
  useEffect(() => {
    if (!activeRequestId) return
    loadMessages(activeRequestId)
    const interval = setInterval(() => {
      loadMessages(activeRequestId)
    }, 3000)
    return () => clearInterval(interval)
  }, [activeRequestId])

  // scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true })
    }, 50)
  }, [messages])

  const requestTherapistChat = async (therapistId: string) => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl('/api/chat-requests'),
        getFetchOptions('POST', { user_id: userId, therapist_id: therapistId })
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Request failed')
      }
      const request = await res.json()
      setActiveRequestId(request.request_id)
      await loadChatRequests()
      Alert.alert('Request sent', 'Therapist will receive your chat request.')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!activeRequestId) {
      Alert.alert('No active request', 'Send a request to a therapist first.')
      return
    }
    if (!messageInput.trim()) return

    try {
      const res = await fetch(
        buildApiUrl('/api/messages'),
        getFetchOptions('POST', {
          request_id: activeRequestId,
          sender_id: userId,
          sender_type: 'user',
          message_text: messageInput.trim(),
        })
      )
      if (!res.ok) throw new Error('Send failed')

      // add to local state immediately so it shows up fast
      const newMsg = {
        message_id: Date.now().toString(),
        chat_request_id: activeRequestId,
        sender_id: userId,
        sender_type: 'user',
        message_text: messageInput.trim(),
        sent_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newMsg])
      setMessageInput('')
    } catch (error) {
      console.log('send message error:', error)
      Alert.alert('Error', 'Failed to send message')
    }
  }

  if (!isProfileComplete || !userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Therapist Support</Text>
        <Text style={styles.subtitle}>Complete your profile to access this feature.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#2D2D2D" />
        </Pressable>
        <Text style={styles.title}>Therapist Support</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading && <ActivityIndicator color="#FF6B9D" style={{ marginVertical: 8 }} />}

        {/* available therapists list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Therapists</Text>
          {therapists.length === 0 ? (
            <Text style={styles.emptyText}>No therapists available right now.</Text>
          ) : (
            therapists.map((t: any) => (
              <View key={t.therapist_id} style={styles.therapistCard}>
                <Text style={styles.therapistName}>{t.name}</Text>
                <Text style={styles.therapistInfo}>{t.specialization}</Text>
                <Text style={styles.therapistInfo}>Experience: {t.experience_years} years</Text>
                <Pressable
                  style={styles.requestBtn}
                  onPress={() => requestTherapistChat(t.therapist_id)}
                >
                  <Text style={styles.requestBtnText}>Send Request</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* all requests list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          {chatRequests.length === 0 ? (
            <Text style={styles.emptyText}>No requests yet. Pick a therapist above.</Text>
          ) : (
            chatRequests.map((req: any) => {
              // look up therapist name
              const therapist = therapists.find((t: any) => t.therapist_id === req.therapist_id)
              const therapistName = therapist ? therapist.name : 'Unknown'
              return (
                <View key={req.request_id} style={styles.requestCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.requestId}>Dr. {therapistName}</Text>
                    <Text style={[styles.reqStatus, req.status === 'accepted' && { color: '#3CB371', backgroundColor: '#E8F5E9' }]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.requestDate}>Sent: {new Date(req.requested_at).toLocaleDateString()}</Text>
                </View>
              )
            })
          )}
        </View>

        {/* active chats tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Chats ({chatRequests.filter(r => r.status === 'accepted').length})</Text>
          {chatRequests.filter(r => r.status === 'accepted').length === 0 ? (
            <Text style={styles.emptyText}>No active chats yet. Wait for a therapist to accept.</Text>
          ) : (
            <FlatList
              horizontal
              data={chatRequests.filter(r => r.status === 'accepted')}
              keyExtractor={(req: any) => req.request_id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item: req }: any) => {
                const therapist = therapists.find((t: any) => t.therapist_id === req.therapist_id)
                const therapistName = therapist ? therapist.name : 'Unknown'
                return (
                  <Pressable
                    style={[styles.chatTab, activeRequestId === req.request_id && styles.chatTabActive]}
                    onPress={() => setActiveRequestId(req.request_id)}
                  >
                    <Text style={[styles.chatTabText, activeRequestId === req.request_id && styles.chatTabTextActive]}>
                      {therapistName}
                    </Text>
                  </Pressable>
                )
              }}
            />
          )}
        </View>

        {/* chat messages area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat Messages</Text>
          {activeRequest ? (
            <View style={styles.chatBox}>
              <ScrollView ref={chatScrollRef} style={styles.messagesBox}>
                {messages.length === 0 ? (
                  <Text style={styles.noMsgsText}>No messages yet. Start the conversation!</Text>
                ) : (
                  messages.map((msg: any) => {
                    const isMe = msg.sender_type === 'user'
                    return (
                      <View key={msg.message_id} style={[styles.msgRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                          <Text style={styles.msgText}>{msg.message_text}</Text>
                          <Text style={styles.msgTime}>
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    )
                  })
                )}
              </ScrollView>

              {activeRequest.status === 'accepted' ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={messageInput}
                    onChangeText={setMessageInput}
                    placeholder="Type your message..."
                    multiline
                  />
                  <Pressable style={styles.sendBtn} onPress={sendMessage}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.waitText}>Waiting for therapist to accept...</Text>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Send a request above to start chatting.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF0F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  backIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD6E7',
  },
  title: {
    fontSize: 20,
    color: '#2D2D2D',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#FF6B9D',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2D2D2D',
    fontWeight: '600',
    marginBottom: 10,
  },
  therapistCard: {
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  therapistName: {
    fontSize: 16,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  therapistInfo: {
    marginTop: 2,
    fontSize: 14,
    color: '#6B6B6B',
  },
  requestBtn: {
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  requestBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  chatTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFD6E7',
    borderWidth: 1,
    borderColor: '#FFD6E7',
  },
  chatTabActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  chatTabText: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  chatTabTextActive: {
    color: '#fff',
  },
  requestCard: {
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  requestId: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  reqStatus: {
    fontSize: 12,
    color: '#6B6B6B',
    backgroundColor: '#FFD6E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requestDate: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
  },
  chatBox: {
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 8,
    padding: 10,
  },
  messagesBox: {
    maxHeight: 320,
    marginBottom: 10,
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    padding: 8,
  },
  noMsgsText: {
    color: '#6B6B6B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  msgRow: {
    marginBottom: 6,
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2D7E3',
  },
  msgText: {
    color: '#2D2D2D',
    fontSize: 14,
  },
  msgTime: {
    color: '#6B6B6B',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 90,
    backgroundColor: '#fff',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitText: {
    color: '#6B6B6B',
    fontSize: 14,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#6B6B6B',
    fontSize: 14,
  },
})
