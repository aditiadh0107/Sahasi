// ExerciseGif.tsx
// Displays a workout exercise animation.
// Primary: loads a GIF from ExerciseDB via expo-image (works in Expo Go).
// Fallback: shows an animated stick-figure workout animation via WorkoutAnimation.

import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { Image } from 'expo-image'
import { getExerciseGifUrl } from '@/src/services/exerciseMediaService'
import WorkoutAnimation from '@/src/components/WorkoutAnimation'
import { T } from '@/constants/theme'

interface Props {
  exerciseId: string
  width: number
  height: number
  style?: any
  borderRadius?: number
  priority?: 'normal' | 'high'
}

// Pulsing pink shimmer while GIF is loading
function LoadingShimmer({ width, height, borderRadius }: { width: number; height: number; borderRadius: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      style={{ width, height, borderRadius, backgroundColor: '#FFD6E7', opacity: pulse }}
    />
  )
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

  // While fetching — show pulsing shimmer
  if (loading) {
    return (
      <View style={[{ width, height, borderRadius }, styles.centered, style]}>
        <LoadingShimmer width={width} height={height} borderRadius={borderRadius} />
      </View>
    )
  }

  // No GIF available — show animated stick figure
  if (!gifUrl || hasError) {
    return (
      <View style={[{ width, height, borderRadius }, styles.fallbackBg, style]}>
        <WorkoutAnimation exerciseId={exerciseId} size={Math.min(width, height)} />
      </View>
    )
  }

  // GIF loaded — show it with expo-image (supports GIF in Expo Go)
  return (
    <Image
      source={{ uri: gifUrl }}
      style={[{ width, height, borderRadius }, style]}
      contentFit="contain"
      priority={priority === 'high' ? 'high' : 'normal'}
      onError={() => {
        console.log('[ExerciseGif] load failed:', exerciseId)
        setHasError(true)
      }}
    />
  )
}

const styles = StyleSheet.create({
  centered: {
    overflow: 'hidden',
  },
  fallbackBg: {
    backgroundColor: '#FFF0F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
})
