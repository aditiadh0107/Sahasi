import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'sahasi_user_session'

// stores logged in user info throughout the app
const ProfileContext = createContext<any>(null)

export const ProfileProvider = ({ children }: any) => {
  const [profile, setProfile] = useState<any>({})
  const [sessionLoaded, setSessionLoaded] = useState(false)

  // load saved session on startup
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            setProfile(JSON.parse(raw))
          } catch {}
        }
      })
      .finally(() => setSessionLoaded(true))
  }, [])

  // merge updates into existing profile and persist
  const updateProfile = (updates: any) => {
    setProfile((current: any) => {
      const next = { ...current, ...updates }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const clearProfile = () => {
    setProfile({})
    AsyncStorage.removeItem(STORAGE_KEY)
  }

  // user is complete if they have age/height/weight
  const isProfileComplete = !!(profile.age && profile.height && profile.weight)

  return (
    <ProfileContext.Provider value={{ profile, setProfile, updateProfile, clearProfile, isProfileComplete, sessionLoaded }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error('useProfile must be inside ProfileProvider')
  }
  return ctx
}
