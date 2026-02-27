// manage trusted contacts and view incoming SOS alerts
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Vibration,
  Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProfile } from '@/contexts/ProfileContext'
import { API_ENDPOINTS, buildApiUrl, getFetchOptions, MIDDLEWARE_URL } from '@/constants/api'
import io from 'socket.io-client'

export default function ManagePeopleScreen() {
  const router = useRouter()
  const { profile, isProfileComplete } = useProfile()

  const [generatedCode, setGeneratedCode] = useState<any>(null)
  const [connectCode, setConnectCode] = useState('')
  const [trustedContacts, setTrustedContacts] = useState<any[]>([])
  const [sosAlerts, setSosAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [alertFlash] = useState(new Animated.Value(0))

  const userId = profile.id

  // fetch trusted contacts from backend
  const loadTrustedContacts = async () => {
    if (!userId) return
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.CONTACTS(userId)))
      if (!res.ok) throw new Error('Failed to load contacts')
      const data = await res.json()
      setTrustedContacts(data)
    } catch (error) {
      console.log('contacts error:', error)
    }
  }

  // fetch SOS alerts for this user
  const loadSosAlerts = async () => {
    if (!userId) return
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.SOS_ALERTS(userId)))
      if (!res.ok) throw new Error('Failed to load alerts')
      const data = await res.json()
      setSosAlerts(data)
    } catch (error) {
      console.log('alerts error:', error)
    }
  }

  useEffect(() => {
    loadTrustedContacts()
    loadSosAlerts()

    // connect to websocket to get real-time SOS alerts
    const socket = io(MIDDLEWARE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('connected to middleware')
      socket.emit('register', { userId: profile.id, userType: 'user' })
    })

    socket.on('sos_alert', (data: any) => {
      console.log('incoming SOS alert:', data)

      Vibration.vibrate([0, 300, 150, 300, 150, 300, 150, 500])

      // flash animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(alertFlash, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(alertFlash, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      ).start()

      Alert.alert(
        '🚨 SOS ALERT!',
        `${data.userName || data.userId} is in distress!\n\nLocation: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
        [{ text: 'OK', onPress: () => { alertFlash.setValue(0); loadSosAlerts() } }]
      )

      setTimeout(() => loadSosAlerts(), 500)
    })

    socket.on('disconnect', () => {
      console.log('disconnected from middleware')
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])

  const handleGenerateCode = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.CONTACTS_GENERATE_CODE(userId)),
        getFetchOptions('POST')
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to generate code')
      }
      const data = await res.json()
      setGeneratedCode(data.code)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectWithCode = async () => {
    if (!userId) return
    if (!connectCode.trim()) {
      Alert.alert('Required', 'Enter a 6-digit code')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.CONTACTS_VERIFY_CODE(userId)),
        getFetchOptions('POST', { code: connectCode.trim() })
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Connection failed')
      }
      Alert.alert('Connected', 'Trusted contact linked successfully.')
      setConnectCode('')
      await loadTrustedContacts()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isProfileComplete || !userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Manage People</Text>
        <Text style={styles.subtitle}>Complete your profile to use trusted contacts.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/(auth)/auth')}>
          <Text style={styles.primaryBtnText}>Login / Sign Up</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Manage People</Text>
      <Text style={styles.subtitle}>Generate a trusted code or connect with one.</Text>

      {/* generate code section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Generate Code</Text>
        <Text style={styles.cardText}>Create a one-time 6-digit code to share.</Text>
        <Pressable style={styles.primaryBtn} onPress={handleGenerateCode}>
          <Text style={styles.primaryBtnText}>Generate Code</Text>
        </Pressable>

        {isLoading && <ActivityIndicator style={{ marginTop: 8 }} color="#FF6B9D" />}

        {generatedCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your Code</Text>
            <Text style={styles.codeValue}>{generatedCode}</Text>
            <Text style={styles.codeHint}>Share this with your trusted contact</Text>
          </View>
        )}
      </View>

      {/* connect with code section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connect with Code</Text>
        <Text style={styles.cardText}>Enter another user's 6-digit code to connect.</Text>
        <TextInput
          value={connectCode}
          onChangeText={setConnectCode}
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />
        <Pressable style={styles.primaryBtn} onPress={handleConnectWithCode}>
          <Text style={styles.primaryBtnText}>Connect</Text>
        </Pressable>
      </View>

      {/* list of trusted contacts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trusted Contacts ({trustedContacts.length})</Text>
        {trustedContacts.length === 0 ? (
          <Text style={styles.cardText}>No trusted contacts connected yet.</Text>
        ) : (
          trustedContacts.map((contact, i) => (
            <View key={i} style={styles.contactRow}>
              <Text style={styles.contactText}>{contact.name || 'Unknown'}</Text>
              <Text style={styles.contactDate}>
                Connected: {new Date(contact.connection_date).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* incoming SOS alerts from people you are trusted contact of */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Incoming SOS Alerts ({sosAlerts.length})</Text>
        {sosAlerts.length === 0 ? (
          <Text style={styles.cardText}>No SOS alerts yet.</Text>
        ) : (
          sosAlerts.slice(0, 5).map((alert: any, i) => (
            <Animated.View
              key={i}
              style={[
                styles.alertCard,
                {
                  backgroundColor: alertFlash.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ffffff', '#ffe6e6'],
                  }),
                }
              ]}
            >
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.alertTitle}>🚨 SOS Alert from {alert.name || 'Unknown'}</Text>
              </View>

              {alert.emergency_type && (
                <Text style={styles.alertInfo}>Type: {alert.emergency_type}</Text>
              )}

              <View style={styles.locationBox}>
                <Text style={styles.locationTitle}>📍 Location</Text>
                <Text style={styles.locationCoords}>
                  {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                </Text>
                {alert.location && <Text style={styles.locationAddr}>{alert.location}</Text>}
              </View>

              <Text style={styles.alertTime}>{new Date(alert.triggered_at).toLocaleString()}</Text>
            </Animated.View>
          ))
        )}
      </View>

      <Pressable style={styles.refreshBtn} onPress={() => { loadTrustedContacts(); loadSosAlerts() }}>
        <Text style={styles.refreshText}>Refresh Contacts & Alerts</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF0F5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF0F5',
  },
  title: {
    fontSize: 28,
    color: '#2D2D2D',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF6B9D',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    color: '#2D2D2D',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeBox: {
    marginTop: 12,
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#6B6B6B',
    fontSize: 14,
  },
  codeValue: {
    marginTop: 4,
    fontSize: 36,
    letterSpacing: 6,
    color: '#FF6B9D',
    fontWeight: 'bold',
  },
  codeHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B6B6B',
  },
  input: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  contactRow: {
    borderTopWidth: 1,
    borderTopColor: '#F2D7E3',
    paddingTop: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  contactDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  alertCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD6E7',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    flex: 1,
  },
  alertInfo: {
    fontSize: 14,
    color: '#DC143C',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  locationBox: {
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  locationCoords: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  locationAddr: {
    fontSize: 13,
    color: '#2D2D2D',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  refreshBtn: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  refreshText: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '600',
  },
})
