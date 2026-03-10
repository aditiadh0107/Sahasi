// SOS screen - press and hold button to send emergency alert
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  Platform,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useProfile } from '@/contexts/ProfileContext'
import { API_ENDPOINTS, buildApiUrl, getFetchOptions } from '@/constants/api'

// how long user needs to hold for SOS to trigger
const HOLD_TIME = 3000

export default function SOSScreen() {
  const { profile, isProfileComplete } = useProfile()
  const [isHolding, setIsHolding] = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)
  const [statusMsg, setStatusMsg] = useState('Press and hold for 3 seconds to trigger SOS')

  const holdTimer = useRef<any>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const flashAnim = useRef(new Animated.Value(0)).current

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const stopHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    setIsHolding(false)
    progressAnim.stopAnimation()
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start()
  }

  const triggerSOS = async () => {
    if (!profile.id) {
      Alert.alert('Profile required', 'Please complete profile setup first.')
      stopHold()
      return
    }

    setIsTriggered(true)
    setStatusMsg('SOS triggered. Sending alert to trusted contacts')
    Vibration.vibrate([0, 300, 160, 300, 160, 300])

    // flashing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
      ])
    ).start()

    try {
      let latitude = 0
      let longitude = 0

      if (Platform.OS === 'web') {
        // web uses browser geolocation
        const coords: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { timeout: 10000 }
          )
        })
        latitude = coords.latitude
        longitude = coords.longitude
      } else {
        // native - request permission then get location
        const perm = await Location.requestForegroundPermissionsAsync()
        if (perm.status !== 'granted') {
          latitude = 27.7172
          longitude = 85.3240
        } else {
          let loc = null
          try {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          } catch (e) {
            // try last known if current fails
            loc = await Location.getLastKnownPositionAsync()
          }

          if (!loc) {
            throw new Error('Could not get location. Make sure GPS is on.')
          }

          latitude = loc.coords.latitude
          longitude = loc.coords.longitude
        }
      }

      console.log('sending SOS with location:', latitude, longitude)

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.SOS(profile.id)),
        getFetchOptions('POST', {
          emergency_type: 'distress',
          location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          latitude,
          longitude,
        })
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to send SOS')
      }

      const result = await response.json()
      setStatusMsg(`SOS sent. Contacts notified: ${result.notified_contacts}`)
      Alert.alert('SOS activated', 'Emergency alert sent with your location.')
    } catch (error: any) {
      console.log('SOS error:', error.message)
      setStatusMsg('SOS failed. Please try again.')
      Alert.alert('SOS error', error.message)
    } finally {
      stopHold()
      setTimeout(() => {
        flashAnim.stopAnimation()
        flashAnim.setValue(0)
      }, 2800)
    }
  }

  const startHold = () => {
    if (isTriggered) setIsTriggered(false)
    setIsHolding(true)
    setStatusMsg('Keep holding...')

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_TIME,
      useNativeDriver: false,
    }).start()

    holdTimer.current = setTimeout(() => {
      triggerSOS()
    }, HOLD_TIME)
  }

  useEffect(() => {
    return () => {
      stopHold()
      flashAnim.stopAnimation()
    }
  }, [])

  // if user hasn't set up profile yet
  if (!isProfileComplete || !profile.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Complete your profile before using SOS.</Text>
      </View>
    )
  }

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FFD5D5'],
  })

  return (
    <Animated.View style={[styles.container, { backgroundColor: flashBg }]}>
      <View style={styles.header}>
        <Ionicons name="warning" size={52} color="#DC143C" />
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Long press for 3 seconds to send emergency alert.</Text>
      </View>

      <View style={styles.sosContainer}>
        <Pressable
          style={styles.sosWrapper}
          onPressIn={startHold}
          onPressOut={stopHold}
        >
          <View style={[styles.sosBtn, isTriggered && { backgroundColor: '#8B0000' }]}>
            <Animated.View style={[styles.progressFill, { height: progressHeight }]} />
            <Text style={styles.sosBtnText}>SOS</Text>
          </View>
        </Pressable>
        <Text style={styles.holdHint}>{isHolding ? 'Hold steady...' : statusMsg}</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="flash" size={20} color="#FF6B9D" />
          <Text style={styles.infoText}>Vibration and flashing screen confirm activation</Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#2D2D2D',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 24,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sosWrapper: {
    width: 230,
    height: 230,
    borderRadius: 115,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosBtn: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 7,
    borderColor: '#fff',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#B61D16',
  },
  sosBtnText: {
    fontSize: 44,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
    zIndex: 2,
  },
  holdHint: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6B6B6B',
    fontSize: 14,
    maxWidth: 260,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginLeft: 8,
  },
})
