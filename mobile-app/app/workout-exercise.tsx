// Guided exercise detail screen — set-by-set phase state machine + real human GIFs
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { T } from '@/constants/theme'
import {
  findExerciseById,
  sessionCompleted,
  TabCategory,
  WorkoutExercise,
} from '@/constants/workoutExercises'
import ExerciseGif from '@/src/components/ExerciseGif'

//  Phase types 

type Phase = 'ready' | 'exercise' | 'rest' | 'complete'

//  Motivational messages per tab 

const MOTIVATIONAL: Record<TabCategory, string> = {
  'strength':     "You're getting stronger every day!",
  'self-defence': "You're more prepared and powerful now!",
  'cardio':       "Your heart is stronger and you can run faster!",
  'flexibility':  "Your body thanks you for taking care of it!",
  'core':         "Rock solid core! Keep it up!",
}

// ── Calories per minute per tab ───────────────────────────────────────────────

const CAL_PER_MIN: Record<TabCategory, number> = {
  'strength':     6,
  'self-defence': 8,
  'cardio':       10,
  'flexibility':  2,
  'core':         5,
}


export default function WorkoutExerciseScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const exerciseId = params.exerciseId as string
  const tab = (params.tab as TabCategory) || 'strength'

  const exercise = findExerciseById(exerciseId)

  // ── Phase state machine ───────────────────────────────────────────────────

  const [phase, setPhase] = useState<Phase>('ready')
  const [currentSet, setCurrentSet] = useState(1)
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(exercise?.set_duration_seconds ?? 30)
  const [restTimeLeft, setRestTimeLeft] = useState(exercise?.rest_seconds ?? 60)
  const [isRunning, setIsRunning] = useState(false)
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
  const [completedSetsCount, setCompletedSetsCount] = useState(0)
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)

  // ── Timer: exercise phase (timed exercises) ───────────────────────────────

  useEffect(() => {
    if (phase !== 'exercise' || !exercise?.is_timed || !isRunning) return
    const interval = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          handleSetDone()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, isRunning, exercise])

  // Timer: rest phase 

  useEffect(() => {
    if (phase !== 'rest') return
    const interval = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          handleRestDone()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartWorkout = () => {
    if (!exercise) return
    setStartTimestamp(Date.now())
    setPhase('exercise')
    if (exercise.is_timed) {
      setIsRunning(true)
    }
  }

  const handleSetDone = useCallback(() => {
    if (!exercise) return
    const newCompletedCount = completedSetsCount + 1
    setCompletedSetsCount(newCompletedCount)
    setIsRunning(false)

    if (currentSet >= exercise.sets) {
      // All sets done
      sessionCompleted.add(exercise.exercise_id)
      setPhase('complete')
    } else {
      // Go to rest
      setRestTimeLeft(exercise.rest_seconds)
      setPhase('rest')
    }
  }, [exercise, currentSet, completedSetsCount])

  const handleRestDone = useCallback(() => {
    if (!exercise) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const nextSet = currentSet + 1
    setCurrentSet(nextSet)
    setExerciseTimeLeft(exercise.set_duration_seconds ?? 30)
    setPhase('exercise')
    setIsRunning(true)
  }, [exercise, currentSet])

  const handleSkipRest = () => {
    handleRestDone()
  }

  const togglePause = () => {
    setIsRunning(r => !r)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (ms: number): string => {
    const secs = Math.floor(ms / 1000)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatSeconds = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const estimateCalories = (): number => {
    if (!startTimestamp) return 0
    const minutes = (Date.now() - startTimestamp) / 60000
    return Math.round(minutes * (CAL_PER_MIN[tab] || 5))
  }

  const getTotalTimeMs = (): number => {
    if (!startTimestamp) return 0
    return Date.now() - startTimestamp
  }

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!exercise) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Exercise Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBtn}>
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.notFoundBtnGrad}
          >
            <Text style={styles.notFoundBtnText}>← Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  }

  // ── PHASE: READY ──────────────────────────────────────────────────────────

  if (phase === 'ready') {
    const visibleInstructions = instructionsExpanded
      ? exercise.instructions
      : exercise.instructions.slice(0, 3)

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.readyHero}
          >
            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <View style={styles.backBtnCircle}>
                <Ionicons name="chevron-back" size={20} color={T.primary} />
              </View>
            </TouchableOpacity>

            <ExerciseGif
              exerciseId={exercise.exercise_id}
              width={120}
              height={120}
              borderRadius={16}
              priority="high"
            />
            <Text style={styles.heroTitle}>{exercise.title}</Text>
            <View style={styles.heroCategoryRow}>
              <Text style={styles.heroCategoryText}>{exercise.tab.toUpperCase()}</Text>
              <Text style={styles.heroCategoryDot}>•</Text>
              <Text style={styles.heroCategoryText}>{exercise.difficulty_level}</Text>
            </View>
          </LinearGradient>

          <View style={styles.readyContent}>

            {/* Stats cards row */}
            <View style={styles.statsCards}>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Sets</Text>
                <Text style={styles.statCardValue}>{exercise.sets}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>
                  {exercise.is_timed ? 'Duration' : 'Reps'}
                </Text>
                <Text style={styles.statCardValue}>{exercise.reps_display}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Rest</Text>
                <Text style={styles.statCardValue}>{exercise.rest_seconds}s</Text>
              </View>
            </View>

            {/* About */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.cardText}>{exercise.description}</Text>
            </View>

            {/* Instructions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How To Do It</Text>
              {visibleInstructions.map((step, idx) => (
                <View key={idx} style={styles.instructionRow}>
                  <View style={styles.instructionNum}>
                    <Text style={styles.instructionNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{step}</Text>
                </View>
              ))}
              {exercise.instructions.length > 3 && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setInstructionsExpanded(e => !e)}
                >
                  <Text style={styles.expandBtnText}>
                    {instructionsExpanded
                      ? '▲ Show Less'
                      : `▼ Show All ${exercise.instructions.length} Steps`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Muscle groups */}
            {exercise.muscle_groups.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Target Muscles</Text>
                <View style={styles.pillsRow}>
                  {exercise.muscle_groups.map((m, i) => (
                    <View key={i} style={styles.pill}>
                      <Text style={styles.pillText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Safety focus */}
            <View style={[styles.card, { backgroundColor: T.pale }]}>
              <Text style={styles.cardTitle}>Safety Focus</Text>
              <Text style={styles.cardText}>{exercise.safety_focus}</Text>
            </View>

          </View>
        </ScrollView>

        {/* Fixed bottom: Start button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backAction} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={T.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleStartWorkout}>
            <LinearGradient
              colors={[T.primary, T.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bigStartBtn}
            >
              <Ionicons name="fitness" size={20} color="#fff" />
              <Text style={styles.bigStartBtnText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── PHASE: EXERCISE ───────────────────────────────────────────────────────

  if (phase === 'exercise') {
    const currentInstructionIdx = (currentSet - 1) % exercise.instructions.length
    const currentInstruction = exercise.instructions[currentInstructionIdx]
    const timerProgress = exercise.is_timed && exercise.set_duration_seconds
      ? (1 - exerciseTimeLeft / exercise.set_duration_seconds)
      : 0

    return (
      <View style={[styles.container, { backgroundColor: T.pale }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.phaseHeader}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.phaseBackBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.phaseTitle}>Set {currentSet} of {exercise.sets}</Text>
            <Text style={styles.phaseSubtitle}>{exercise.title}</Text>
          </LinearGradient>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentSet ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
            ))}
          </View>

          <View style={styles.exercisePhaseContent}>

            {/* Real human exercise GIF — centered, large */}
            <View style={styles.phaseLottieBox}>
              <ExerciseGif
                exerciseId={exercise.exercise_id}
                width={160}
                height={160}
                borderRadius={20}
                priority="high"
              />
            </View>

            {exercise.is_timed ? (
              /* Timed exercise: circle timer */
              <View style={styles.timerSection}>
                {/* Circle timer */}
                <View style={styles.timerCircle}>
                  <Text style={styles.timerCountdown}>{exerciseTimeLeft}</Text>
                  <Text style={styles.timerSecondsLabel}>seconds</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.timerProgressTrack}>
                  <View style={[styles.timerProgressFill, {
                    width: `${timerProgress * 100}%` as any
                  }]} />
                </View>

                {/* Pause / Resume */}
                <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
                  <LinearGradient
                    colors={[T.primary, T.light]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pauseBtnGrad}
                  >
                    <Ionicons name={isRunning ? 'pause' : 'play'} size={24} color="#fff" />
                    <Text style={styles.pauseBtnText}>
                      {isRunning ? 'Pause' : 'Resume'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Rep-based exercise: show reps + done button */
              <View style={styles.repsSection}>
                <Text style={styles.repsDisplay}>{exercise.reps_display}</Text>
                <Text style={styles.repsLabel}>Complete your reps</Text>

                {/* Current instruction hint */}
                <View style={styles.instructionHint}>
                  <Text style={styles.instructionHintStep}>Step {currentInstructionIdx + 1}</Text>
                  <Text style={styles.instructionHintText}>{currentInstruction}</Text>
                </View>

                {/* Done set button */}
                <TouchableOpacity onPress={handleSetDone} style={styles.doneSetBtnWrapper}>
                  <LinearGradient
                    colors={[T.primary, T.light]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.doneSetBtn}
                  >
                    <Ionicons name="checkmark" size={22} color="#fff" />
                    <Text style={styles.doneSetBtnText}>Done Set {currentSet}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Current instruction */}
            <View style={styles.currentInstructionCard}>
              <Text style={styles.currentInstructionLabel}>
                Current Instruction ({currentInstructionIdx + 1}/{exercise.instructions.length})
              </Text>
              <Text style={styles.currentInstructionText}>{currentInstruction}</Text>
            </View>

          </View>
        </ScrollView>

        {/* Bottom action (for timed: skip set) */}
        {exercise.is_timed && (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.backAction} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={T.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={handleSetDone}>
              <View style={styles.skipSetBtn}>
                <Text style={styles.skipSetBtnText}>Skip Set →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  // ── PHASE: REST ───────────────────────────────────────────────────────────

  if (phase === 'rest') {
    const restProgress = 1 - restTimeLeft / (exercise.rest_seconds || 1)
    const isLastSet = currentSet >= exercise.sets

    return (
      <View style={[styles.container, { backgroundColor: T.pale }]}>
        <View style={styles.restFullScreen}>

          {/* Header */}
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.restHeader}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.phaseBackBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.restTitle}>Rest Time</Text>
            <Text style={styles.restSubtitle}>
              {isLastSet
                ? 'Last set done! Almost there!'
                : `Next: Set ${currentSet + 1} of ${exercise.sets}`}
            </Text>
          </LinearGradient>

          {/* Show the exercise GIF during rest so user can preview the next set */}
          <View style={styles.phaseLottieBox}>
            <ExerciseGif
              exerciseId={exercise.exercise_id}
              width={160}
              height={160}
              borderRadius={20}
              priority="high"
            />
          </View>

          {/* Rest timer circle */}
          <View style={styles.restTimerSection}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerCountdown}>{restTimeLeft}</Text>
              <Text style={styles.timerSecondsLabel}>seconds</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.timerProgressTrack}>
              <View style={[styles.timerProgressFill, {
                width: `${restProgress * 100}%` as any
              }]} />
            </View>

            {/* Skip rest button */}
            <TouchableOpacity onPress={handleSkipRest} style={styles.skipRestBtnWrapper}>
              <View style={styles.skipRestBtn}>
                <Text style={styles.skipRestBtnText}>Skip Rest →</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Progress dots at bottom */}
          <View style={styles.dotsRow}>
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentSet ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    )
  }

  // ── PHASE: COMPLETE ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    const totalMs = getTotalTimeMs()
    const calories = estimateCalories()
    const motivational = MOTIVATIONAL[tab] ?? "Great job finishing the workout!"

    return (
      <View style={[styles.container, { backgroundColor: T.pale }]}>
        <ScrollView
          contentContainerStyle={styles.completeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise complete — show GIF of the exercise just completed */}
          <View style={styles.completeLottieBox}>
            <ExerciseGif
              exerciseId={exercise.exercise_id}
              width={180}
              height={180}
              borderRadius={24}
              priority="high"
            />
          </View>

          {/* Complete card */}
          <LinearGradient
            colors={[T.primary, T.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeCard}
          >
            <Text style={styles.completeTitle}>Exercise Complete!</Text>
            <Text style={styles.completeMotivational}>{motivational}</Text>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.completeStatsCard}>
            <Text style={styles.completeStatsTitle}>Your Stats</Text>
            <View style={styles.completeStatRow}>
              <View style={styles.completeStat}>
                <Text style={styles.completeStatVal}>{exercise.sets}</Text>
                <Text style={styles.completeStatLabel}>Sets Done</Text>
              </View>
              <View style={styles.completeStatDivider} />
              <View style={styles.completeStat}>
                <Text style={styles.completeStatVal}>{formatTime(totalMs)}</Text>
                <Text style={styles.completeStatLabel}>Total Time</Text>
              </View>
              <View style={styles.completeStatDivider} />
              <View style={styles.completeStat}>
                <Text style={styles.completeStatVal}>{calories}</Text>
                <Text style={styles.completeStatLabel}>Est. Calories</Text>
              </View>
            </View>
          </View>

          {/* Exercise summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{exercise.title}</Text>
            <Text style={styles.cardText}>{exercise.description}</Text>
          </View>

          {/* Back to workout button */}
          <TouchableOpacity onPress={() => router.back()}>
            <LinearGradient
              colors={[T.primary, T.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backToWorkoutBtn}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.backToWorkoutText}>Back to Workout</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.white,
  },

  // ── GIF containers ─────────────────────────────────────────────────────────
  heroGif: {
    marginBottom: 12,
  },
  phaseLottieBox: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  phaseLottie: {
    width: 160,
    height: 160,
  },
  completeLottieBox: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  completeLottie: {
    width: 180,
    height: 180,
  },

  // ── Not found ──────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: T.pale,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: T.dark,
    marginBottom: 20,
  },
  notFoundBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  notFoundBtnGrad: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  notFoundBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ── Ready phase: hero ──────────────────────────────────────────────────────
  readyHero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 12,
    left: 16,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCategoryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  heroCategoryDot: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },

  // ── Ready phase: content ───────────────────────────────────────────────────
  readyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardLabel: {
    fontSize: 11,
    color: T.muted,
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: T.dark,
    textAlign: 'center',
  },

  // ── Cards ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: T.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: T.dark,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: T.muted,
    lineHeight: 22,
  },

  // ── Instructions ───────────────────────────────────────────────────────────
  instructionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  instructionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.card,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  instructionNumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: T.primary,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: T.muted,
    lineHeight: 21,
  },
  expandBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  expandBtnText: {
    fontSize: 13,
    color: T.primary,
    fontWeight: '600',
  },

  // ── Muscle pills ───────────────────────────────────────────────────────────
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    backgroundColor: T.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.primary,
  },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  backAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.white,
  },
  bigStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 14,
  },
  bigStartBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  // ── Phase header ───────────────────────────────────────────────────────────
  phaseHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  phaseBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 12,
    left: 16,
    padding: 6,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  phaseSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Progress dots ──────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFilled: {
    backgroundColor: T.primary,
  },
  dotEmpty: {
    backgroundColor: T.card,
    borderWidth: 1.5,
    borderColor: T.primary,
  },

  // ── Exercise phase ─────────────────────────────────────────────────────────
  exercisePhaseContent: {
    paddingHorizontal: 20,
  },

  // Timer
  timerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: T.primary,
    backgroundColor: T.pale,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  timerCountdown: {
    fontSize: 44,
    fontWeight: 'bold',
    color: T.primary,
  },
  timerSecondsLabel: {
    fontSize: 11,
    color: T.muted,
    marginTop: -4,
  },
  timerProgressTrack: {
    width: 180,
    height: 6,
    backgroundColor: T.card,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primary,
  },
  pauseBtn: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pauseBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  pauseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Reps-based exercise
  repsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  repsDisplay: {
    fontSize: 52,
    fontWeight: 'bold',
    color: T.primary,
    marginBottom: 8,
  },
  repsLabel: {
    fontSize: 16,
    color: T.muted,
    marginBottom: 20,
  },
  instructionHint: {
    backgroundColor: T.pale,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: T.primary,
  },
  instructionHintStep: {
    fontSize: 12,
    fontWeight: '700',
    color: T.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  instructionHintText: {
    fontSize: 14,
    color: T.dark,
    lineHeight: 21,
  },
  doneSetBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  doneSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  doneSetBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Current instruction card
  currentInstructionCard: {
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  currentInstructionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  currentInstructionText: {
    fontSize: 14,
    color: T.dark,
    lineHeight: 21,
  },

  // Skip set (timed)
  skipSetBtn: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipSetBtnText: {
    color: T.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Rest phase ─────────────────────────────────────────────────────────────
  restFullScreen: {
    flex: 1,
  },
  restHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  restTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  restSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  restTimerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  skipRestBtnWrapper: {
    marginTop: 24,
  },
  skipRestBtn: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  skipRestBtnText: {
    color: T.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Complete phase ─────────────────────────────────────────────────────────
  completeContent: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  completeCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  completeMotivational: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  completeStatsCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  completeStatsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: T.dark,
    marginBottom: 14,
    textAlign: 'center',
  },
  completeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeStat: {
    flex: 1,
    alignItems: 'center',
  },
  completeStatVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: T.primary,
    marginBottom: 4,
  },
  completeStatLabel: {
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
  },
  completeStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: T.border,
    marginHorizontal: 6,
  },
  backToWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 4,
  },
  backToWorkoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
})
