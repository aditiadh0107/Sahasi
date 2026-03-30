// ExerciseGif.tsx
// Displays a 3D anatomy exercise GIF fetched from ExerciseDB.
// Uses FastImage for smooth looping GIF playback.
// Shows a pink placeholder while loading, gray box if fetch fails — never crashes.

import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import FastImage from 'react-native-fast-image'
import { getExerciseGifUrl } from '@/src/services/exerciseMediaService'
import { T } from '@/constants/theme'

interface Props {
  exerciseId: string
  width: number
  height: number
  style?: any
  borderRadius?: number
  // 'high' for the active exercise in the workout modal, 'normal' for card thumbnails
  priority?: 'normal' | 'high'
}

export default function ExerciseGif({
  exerciseId,
  width,
  height,
  style,
  borderRadius = 12,
  priority = 'normal',
}: Props) {
  const [gifUrl, setGifUrl]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [hasError, setHasError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    setGifUrl(null)
    setHasError(false)

    getExerciseGifUrl(exerciseId).then(url => {
      if (mounted.current) {
        setGifUrl(url)
        setLoading(false)
      }
    })

    return () => { mounted.current = false }
  }, [exerciseId])

  if (loading) {
    return (
      <View style={[{ width, height, borderRadius }, styles.placeholder, style]}>
        <ActivityIndicator color={T.primary} size="small" />
      </View>
    )
  }

  if (!gifUrl || hasError) {
    // Silent fallback — gray box, no error message shown to user
    return <View style={[{ width, height, borderRadius }, styles.fallback, style]} />
  }

  return (
    <FastImage
      source={{
        uri: gifUrl,
        priority: priority === 'high'
          ? FastImage.priority.high
          : FastImage.priority.normal,
      }}
      style={[{ width, height, borderRadius }, style]}
      resizeMode={FastImage.resizeMode.contain}
      onError={() => {
        console.log('[ExerciseGif] load failed:', exerciseId)
        setHasError(true)
      }}
    />
  )
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#FFD6E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    backgroundColor: '#E0E0E0',
  },
})
