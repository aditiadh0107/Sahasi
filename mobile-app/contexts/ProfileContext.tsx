import React, { createContext, useContext, useState } from 'react'

// stores logged in user info throughout the app
const ProfileContext = createContext<any>(null)

export const ProfileProvider = ({ children }: any) => {
  const [profile, setProfile] = useState<any>({})

  // merge updates into existing profile
  const updateProfile = (updates: any) => {
    setProfile((current: any) => ({ ...current, ...updates }))
  }

  const clearProfile = () => {
    setProfile({})
  }

  // user is complete if they have age/height/weight
  const isProfileComplete = !!(profile.age && profile.height && profile.weight)

  return (
    <ProfileContext.Provider value={{ profile, setProfile, updateProfile, clearProfile, isProfileComplete }}>
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
