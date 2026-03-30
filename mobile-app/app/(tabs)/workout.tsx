// Training / Workout page — 5-tab layout with BMI recommendations + real human GIFs
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useFocusEffect } from 'expo-router'
import { useProfile } from '@/contexts/ProfileContext'
import { Ionicons } from '@expo/vector-icons'
import ExerciseGif from '@/src/components/ExerciseGif'
import { prefetchAllExercises } from '@/src/services/exerciseMediaService'
import { T } from '@/constants/theme'
import {
  getExercisesByTab,
  sessionCompleted,
  TabCategory,
  WorkoutExercise,
} from '@/constants/workoutExercises'

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS: { key: TabCategory; label: string }[] = [
  { key: 'strength',     label: 'Strength'     },
  { key: 'self-defence', label: 'Self Defence'  },
  { key: 'cardio',       label: 'Cardio'        },
  { key: 'flexibility',  label: 'Flexibility'   },
  { key: 'core',         label: 'Core'          },
]

// BMI category → recommended difficulty
const getRecommendedDifficulty = (bmiCat: string): 'beginner' | 'intermediate' | 'advanced' => {
  if (bmiCat === 'normal') return 'intermediate'
  return 'beginner'
}

// BMI config for hero display
const BMI_CONFIG: Record<string, { label: string; desc: string }> = {
  underweight: { label: 'Underweight',  desc: 'Light and gentle movements recommended' },
  normal:      { label: 'Normal BMI',   desc: 'Moderate intensity training for you' },
  overweight:  { label: 'Overweight',   desc: 'Low-impact workouts recommended' },
  obese:       { label: 'High BMI',     desc: 'Gentle, standing exercises recommended' },
}

export default function WorkoutScreen() {
  const { profile } = useProfile()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabCategory>('strength')
  // refreshKey forces re-render when returning from exercise screen
  const [refreshKey, setRefreshKey] = useState(0)

  // Bouncing animation for BMI badge
  const bounceAnim = useRef(new Animated.Value(1)).current

  // ── BMI calculations ────────────────────────────────────────────────────────

  const getBmiValue = (): number | null => {
    if (!profile?.weight || !profile?.height) return null
    const h = profile.height / 100
    return parseFloat((profile.weight / (h * h)).toFixed(1))
  }

  const getBmiCategory = (): string => {
    const bmi = getBmiValue()
    if (bmi === null) return 'normal'
    if (bmi < 18.5) return 'underweight'
    if (bmi < 25) return 'normal'
    if (bmi < 30) return 'overweight'
    return 'obese'
  }

  const bmiValue = getBmiValue()
  const bmiCategory = getBmiCategory()
  const bmiConf = BMI_CONFIG[bmiCategory]
  const recommendedDifficulty = getRecommendedDifficulty(bmiCategory)

  const userName = profile?.name || 'Friend'

  // ── Tab exercises ───────────────────────────────────────────────────────────

  const tabExercises = getExercisesByTab(activeTab)
  const completedInTab = tabExercises.filter(ex => sessionCompleted.has(ex.exercise_id)).length
  const totalInTab = tabExercises.length
  const progressPct = totalInTab > 0 ? completedInTab / totalInTab : 0

  const isRecommended = (ex: WorkoutExercise) => ex.difficulty_level === recommendedDifficulty

  const recommendedForTab = tabExercises.filter(isRecommended).slice(0, 3)

  const totalMinutes = Math.ceil(
    tabExercises.reduce((sum, ex) => sum + ex.duration_seconds, 0) / 60
  )

  // ── Pre-fetch all exercise GIFs on first mount ───────────────────────────────

  useEffect(() => {
    prefetchAllExercises()
  }, [])

  // ── Re-render when screen comes back into focus ─────────────────────────────

  useFocusEffect(
    useCallback(() => {
      setRefreshKey(k => k + 1)
    }, [])
  )

  // ── Bounce animation ────────────────────────────────────────────────────────

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.3, duration: 650, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1.0, duration: 650, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  // ── Navigate to exercise detail ─────────────────────────────────────────────

  const goToExercise = (exerciseId: string) => {
    router.push({ pathname: '/workout-exercise', params: { exerciseId, tab: activeTab } })
  }

  const allTabDone = totalInTab > 0 && completedInTab === totalInTab

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[1]}
    >

      {/* ── INDEX 0: HERO ────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[T.primary, T.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroGreeting}>Hi, {userName}!</Text>
        <Text style={styles.heroSub}>{bmiConf.desc}</Text>

        {/* BMI badge */}
        <View style={styles.bmiBadge}>
          <Animated.View style={[styles.bmiDot, { transform: [{ scale: bounceAnim }] }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bmiLabel}>
              {bmiConf.label}{bmiValue ? `  •  BMI ${bmiValue}` : ''}
            </Text>
            <Text style={styles.bmiDesc}>{bmiConf.desc}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{totalInTab}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{bmiValue ?? '—'}</Text>
            <Text style={styles.statLabel}>BMI</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {completedInTab}/{totalInTab} exercises completed
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
          </View>
        </View>
      </LinearGradient>

      {/* ── INDEX 1: TAB BAR (sticky) ────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ── INDEX 2: CONTENT ─────────────────────────────────────────────── */}
      <View style={styles.content}>

        {/* Recommended section (only if we have bmi data) */}
        {bmiValue !== null && recommendedForTab.length > 0 && (
          <View style={styles.recommendedSection}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, gap: 12, paddingRight: 8 }}
            >
              {recommendedForTab.map((ex) => {
                const done = sessionCompleted.has(ex.exercise_id)
                return (
                  <TouchableOpacity
                    key={ex.exercise_id}
                    style={styles.recommendedCard}
                    onPress={() => goToExercise(ex.exercise_id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.recommendedAnimBox}>
                      <ExerciseGif
                        exerciseId={ex.exercise_id}
                        width={48}
                        height={48}
                        borderRadius={24}
                      />
                    </View>
                    <Text style={styles.recommendedName} numberOfLines={2}>
                      {ex.title}
                    </Text>
                    <Text style={styles.recommendedMeta}>
                      {ex.sets} sets  •  {ex.reps_display}
                    </Text>
                    {done && (
                      <View style={styles.doneMiniBadge}>
                        <Text style={styles.doneMiniBadgeText}>Done</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Exercise list */}
        <View style={styles.exerciseList}>
          <Text style={styles.sectionTitle}>All Exercises</Text>
          <FlatList
            data={tabExercises}
            keyExtractor={item => item.exercise_id}
            scrollEnabled={false}
            extraData={refreshKey}
            renderItem={({ item: ex }) => {
              const done = sessionCompleted.has(ex.exercise_id)
              const recommended = isRecommended(ex)
              const challenging = bmiValue !== null && !recommended

              return (
                <TouchableOpacity
                  style={[
                    styles.exerciseCard,
                    recommended && styles.exerciseCardRecommended,
                    !recommended && bmiValue !== null && styles.exerciseCardDim,
                  ]}
                  onPress={() => goToExercise(ex.exercise_id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardRow}>
                    {/* Left: real human exercise GIF */}
                    <View style={styles.cardAnimBox}>
                      <ExerciseGif
                        exerciseId={ex.exercise_id}
                        width={76}
                        height={76}
                        borderRadius={12}
                      />
                    </View>

                    {/* Right info */}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{ex.title}</Text>

                      {/* Muscle group pills (first 2) */}
                      <View style={styles.pillsRow}>
                        {ex.muscle_groups.slice(0, 2).map((m: string, i: number) => (
                          <View key={i} style={styles.pill}>
                            <Text style={styles.pillText}>{m}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={styles.cardMeta}>
                        {ex.sets} sets  •  {ex.reps_display}
                      </Text>
                      <Text style={styles.cardRest}>
                        Rest: {ex.rest_seconds}s
                      </Text>
                    </View>
                  </View>

                  {/* Bottom action row */}
                  <View style={styles.cardFooter}>
                    {done ? (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => goToExercise(ex.exercise_id)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[T.primary, T.light]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.startBtn}
                        >
                          <Text style={styles.startBtnText}>Start</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {challenging && (
                      <View style={styles.challengingBadge}>
                        <Text style={styles.challengingText}>Challenging</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>

        {/* Tab complete banner */}
        {allTabDone && (
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeBanner}
          >
            <Text style={styles.completeBannerTitle}>Tab Complete!</Text>
            <Text style={styles.completeBannerSub}>
              Great job! You finished all {totalInTab} exercises in this tab.
            </Text>
            <View style={styles.completeBannerStats}>
              <Text style={styles.completeBannerStat}>{totalInTab} exercises  •  {totalMinutes} min</Text>
            </View>
          </LinearGradient>
        )}

        <View style={{ height: 32 }} />
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: T.pale,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
  },
  bmiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bmiDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bmiLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  bmiDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────────
  tabBar: {
    backgroundColor: T.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: T.pale,
    borderWidth: 1,
    borderColor: T.border,
  },
  tabBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.muted,
  },
  tabTextActive: {
    color: '#fff',
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  content: {
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: T.dark,
    marginBottom: 12,
    paddingHorizontal: 16,
  },

  // ── Recommended cards (horizontal scroll) ────────────────────────────────────
  recommendedSection: {
    marginBottom: 24,
  },
  recommendedCard: {
    width: 160,
    backgroundColor: T.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: T.primary,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedAnimBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: T.dark,
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendedMeta: {
    fontSize: 11,
    color: T.muted,
  },
  doneMiniBadge: {
    marginTop: 6,
    backgroundColor: T.success + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  doneMiniBadgeText: {
    fontSize: 11,
    color: T.success,
    fontWeight: '600',
  },

  // ── Exercise list ─────────────────────────────────────────────────────────────
  exerciseList: {
    paddingBottom: 8,
  },
  exerciseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: T.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseCardRecommended: {
    borderColor: T.primary,
    borderWidth: 1.5,
  },
  exerciseCardDim: {
    opacity: 0.75,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  // Lottie animation box on each exercise card
  cardAnimBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: T.card,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: T.dark,
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: T.card,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    color: T.primary,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 12,
    color: T.dark,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardRest: {
    fontSize: 12,
    color: T.muted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    backgroundColor: T.success + '20',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.success,
  },
  startBtn: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  challengingBadge: {
    backgroundColor: T.warning + '20',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  challengingText: {
    fontSize: 11,
    color: T.warning,
    fontWeight: '600',
  },

  // ── Tab complete banner ────────────────────────────────────────────────────────
  completeBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  completeBannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  completeBannerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },
  completeBannerStats: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  completeBannerStat: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})
