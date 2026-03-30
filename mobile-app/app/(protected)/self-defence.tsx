// self-defence screen — BMI-categorized lessons with video demos
import React, { useRef } from 'react'
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useProfile } from '@/contexts/ProfileContext'
import { T } from '@/constants/theme'

const { width } = Dimensions.get('window')

// ─── BMI helpers ────────────────────────────────────────────────────────────

const calcBmi = (weight: number, height: number) =>
  parseFloat((weight / (height * height)).toFixed(1))

const getBmiCategory = (bmi: number): 1 | 2 => (bmi < 25 ? 1 : 2)

// ─── Lesson data ─────────────────────────────────────────────────────────────

type Lesson = {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
  videoUrl: string          // opens in browser
  thumbEmoji: string        // shown in placeholder thumbnail
  focus: string             // short focus label
}

const CAT1_LESSONS: Lesson[] = [
  {
    id: 'c1-1',
    title: 'Wrist Grab Escape',
    description: 'A fast rotational twist to break any wrist grip before an attacker can tighten their hold. Uses speed over force.',
    duration: '8 min',
    difficulty: 'Beginner',
    tags: ['Speed', 'Escape', 'Wrist'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '🤝',
    focus: 'Agile Escape',
  },
  {
    id: 'c1-2',
    title: 'Palm Strike & Run',
    description: 'A sharp palm strike to the nose or chin creates enough distance to turn and escape. Emphasises explosive speed.',
    duration: '10 min',
    difficulty: 'Beginner',
    tags: ['Strike', 'Speed', 'Counterattack'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '✋',
    focus: 'Quick Strike',
  },
  {
    id: 'c1-3',
    title: 'Hair Grab Release',
    description: 'Pin the attacker\'s hand against your head and rotate sharply. Fast shoulder drop neutralises the leverage instantly.',
    duration: '7 min',
    difficulty: 'Beginner',
    tags: ['Release', 'Rotation', 'Hair'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '💇',
    focus: 'Fast Release',
  },
  {
    id: 'c1-4',
    title: 'Elbow & Knee Combo',
    description: 'Close-range elbow strike to the face followed immediately by a knee to the midsection. High-tempo two-hit sequence.',
    duration: '12 min',
    difficulty: 'Intermediate',
    tags: ['Combo', 'Elbow', 'Knee'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '💥',
    focus: 'Rapid Combo',
  },
  {
    id: 'c1-5',
    title: 'Choke Defense – Front',
    description: 'Tuck chin, step to the side, drive both arms up between attacker\'s wrists and spin out. Works in under 1 second.',
    duration: '10 min',
    difficulty: 'Intermediate',
    tags: ['Choke', 'Spin', 'Neck'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '🛡️',
    focus: 'Choke Escape',
  },
  {
    id: 'c1-6',
    title: 'Side Kick Foundation',
    description: 'Chamber, thrust, and retract. This side kick to the knee or hip creates 4–6 feet of immediate space. Speed is key.',
    duration: '15 min',
    difficulty: 'Intermediate',
    tags: ['Kick', 'Distance', 'Power'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '🦶',
    focus: 'Kick & Space',
  },
]

const CAT2_LESSONS: Lesson[] = [
  {
    id: 'c2-1',
    title: 'Low Stance Palm Barrier',
    description: 'A wide, grounded stance lets you absorb and redirect force. The two-handed palm barrier stops a push or grab cold.',
    duration: '8 min',
    difficulty: 'Beginner',
    tags: ['Stability', 'Block', 'Stance'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '🧱',
    focus: 'Stable Block',
  },
  {
    id: 'c2-2',
    title: 'Body-Weight Throw',
    description: 'Use your center of gravity as a weapon. Step in, hip-check, and redirect the attacker\'s momentum into a controlled fall.',
    duration: '12 min',
    difficulty: 'Beginner',
    tags: ['Leverage', 'Throw', 'Weight'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '⚖️',
    focus: 'Leverage Throw',
  },
  {
    id: 'c2-3',
    title: 'Seated Wrist Lock',
    description: 'From a seated or crouching position, apply a wrist lock that uses rotation rather than upper-body strength to control.',
    duration: '10 min',
    difficulty: 'Beginner',
    tags: ['Seated', 'Lock', 'Control'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '🪑',
    focus: 'Seated Defense',
  },
  {
    id: 'c2-4',
    title: 'Forearm Block & Push',
    description: 'A low-impact forearm rising block deflects strikes upward, immediately followed by a two-handed shove to create space.',
    duration: '10 min',
    difficulty: 'Intermediate',
    tags: ['Block', 'Forearm', 'Push'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '🤜',
    focus: 'Block & Push',
  },
  {
    id: 'c2-5',
    title: 'Ground Escape Roll',
    description: 'If taken to the ground, a side bridge and hip escape creates separation. Designed for all body types with minimal joint stress.',
    duration: '14 min',
    difficulty: 'Intermediate',
    tags: ['Ground', 'Escape', 'Roll'],
    videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    thumbEmoji: '🌀',
    focus: 'Ground Escape',
  },
  {
    id: 'c2-6',
    title: 'Bear Hug Defense',
    description: 'Drop your weight, widen stance, and drive your head back into the attacker\'s face. Body weight makes this brutally effective.',
    duration: '9 min',
    difficulty: 'Intermediate',
    tags: ['Bear Hug', 'Head Strike', 'Weight'],
    videoUrl: 'https://www.youtube.com/watch?v=1vf7q-7Sb8U',
    thumbEmoji: '🐻',
    focus: 'Power Defense',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function DifficultyDots({ level }: { level: Lesson['difficulty'] }) {
  const filled = level === 'Beginner' ? 1 : level === 'Intermediate' ? 2 : 3
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            dotStyle.dot,
            { backgroundColor: i <= filled ? T.primary : T.border },
          ]}
        />
      ))}
    </View>
  )
}

const dotStyle = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
})

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start()
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start()

  const openVideo = () => WebBrowser.openBrowserAsync(lesson.videoUrl)

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 14 }}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={openVideo}
        style={styles.card}
      >
        {/* thumbnail */}
        <View style={styles.thumbContainer}>
          <LinearGradient
            colors={['#FFD6E7', '#FFF0F5']}
            style={styles.thumb}
          >
            <Text style={styles.thumbEmoji}>{lesson.thumbEmoji}</Text>
            <View style={styles.playBadge}>
              <Ionicons name="play-circle" size={36} color={T.primary} />
            </View>
          </LinearGradient>
          <View style={styles.focusLabel}>
            <Text style={styles.focusLabelText}>{lesson.focus}</Text>
          </View>
        </View>

        {/* content */}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
            <DifficultyDots level={lesson.difficulty} />
          </View>

          <Text style={styles.lessonDesc} numberOfLines={3}>{lesson.description}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={T.muted} />
              <Text style={styles.metaText}>{lesson.duration}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="fitness-outline" size={13} color={T.muted} />
              <Text style={styles.metaText}>{lesson.difficulty}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="videocam-outline" size={13} color={T.primary} />
              <Text style={[styles.metaText, { color: T.primary }]}>Watch</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {lesson.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SelfDefenceScreen() {
  const router = useRouter()
  const { profile, isProfileComplete } = useProfile()

  if (!isProfileComplete || !profile.id) {
    return (
      <View style={styles.centered}>
        <Ionicons name="shield-half" size={64} color={T.border} />
        <Text style={styles.centeredTitle}>Profile Required</Text>
        <Text style={styles.centeredSub}>Complete your profile to access personalized self-defence training.</Text>
        <Pressable style={styles.actionBtn} onPress={() => router.push('/(auth)/auth')}>
          <Text style={styles.actionBtnText}>Complete Profile</Text>
        </Pressable>
      </View>
    )
  }

  const bmi = calcBmi(
    parseFloat(profile.weight) || 0,
    parseFloat(profile.height) || 1,
  )
  const category = getBmiCategory(bmi)
  const lessons = category === 1 ? CAT1_LESSONS : CAT2_LESSONS

  const isC1 = category === 1
  const categoryLabel = isC1 ? 'Category 1 — Agile & Fast' : 'Category 2 — Stable & Powerful'
  const categoryDesc = isC1
    ? 'Your BMI supports flexible, high-speed techniques and rapid evasion.'
    : 'Your BMI suits leverage-based, stability-focused defence methods.'
  const trainingFocus = isC1
    ? ['Speed over strength', 'Evasion & escape', 'Quick combos']
    : ['Leverage & body weight', 'Stability-first stance', 'Low-impact power']

  const bmiLabel =
    bmi < 18.5 ? 'Underweight' :
    bmi < 25   ? 'Normal' :
    bmi < 30   ? 'Overweight' : 'Obese'

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero gradient header ── */}
      <LinearGradient
        colors={[T.primary, T.light, '#FFD6E7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroGreeting}>Hi, {profile.name || 'Warrior'} 🥋</Text>
        <Text style={styles.heroSub}>Your personalized self-defence plan</Text>

        {/* BMI row */}
        <View style={styles.bmiRow}>
          <View style={styles.bmiBox}>
            <Text style={styles.bmiNum}>{isNaN(bmi) ? '—' : bmi}</Text>
            <Text style={styles.bmiLbl}>BMI</Text>
          </View>
          <View style={styles.bmiDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bmiClassLabel}>{bmiLabel}</Text>
            <Text style={styles.categoryTag}>{categoryLabel}</Text>
          </View>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{isC1 ? '⚡' : '💪'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Training Profile card ── */}
      <View style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <Ionicons name="body" size={20} color={T.primary} />
          <Text style={styles.profileCardTitle}>Your Training Profile</Text>
        </View>
        <Text style={styles.profileCardDesc}>{categoryDesc}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile.weight || '—'} kg</Text>
            <Text style={styles.statLbl}>Weight</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile.height || '—'} m</Text>
            <Text style={styles.statLbl}>Height</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile.age || '—'}</Text>
            <Text style={styles.statLbl}>Age</Text>
          </View>
        </View>

        <View style={styles.focusList}>
          <Text style={styles.focusListTitle}>Training Focus</Text>
          {trainingFocus.map((f, i) => (
            <View key={i} style={styles.focusItem}>
              <View style={styles.focusDot} />
              <Text style={styles.focusItemText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Lessons ── */}
      <View style={styles.lessonsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Lessons</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{lessons.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSub}>Tap a card to watch the video demonstration</Text>

        {lessons.map((lesson, idx) => (
          <LessonCard key={lesson.id} lesson={lesson} index={idx} />
        ))}
      </View>

      {/* ── Safety tip banner ── */}
      <View style={styles.tipBanner}>
        <Ionicons name="information-circle" size={20} color={T.primary} />
        <Text style={styles.tipBannerText}>
          Practice with a trained partner when possible. Awareness and confidence are your greatest weapons.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: T.pale,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // centered / profile-required state
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: T.pale,
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  centeredSub: {
    fontSize: 15,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: T.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  bmiBox: {
    alignItems: 'center',
  },
  bmiNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  bmiLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  bmiDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  bmiClassLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  categoryTag: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  catBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catBadgeText: {
    fontSize: 24,
  },

  // training profile card
  profileCard: {
    backgroundColor: T.white,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.dark,
  },
  profileCardDesc: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: T.pale,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: T.primary,
  },
  statLbl: {
    fontSize: 11,
    color: T.muted,
    marginTop: 2,
  },
  focusList: {
    backgroundColor: T.pale,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  focusListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.dark,
    marginBottom: 8,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  focusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.primary,
  },
  focusItemText: {
    fontSize: 13,
    color: T.muted,
  },

  // lessons section
  lessonsSection: {
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.dark,
  },
  countBadge: {
    backgroundColor: T.card,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.primary,
  },
  sectionSub: {
    fontSize: 13,
    color: T.muted,
    marginBottom: 16,
  },

  // lesson card
  card: {
    backgroundColor: T.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  thumbContainer: {
    position: 'relative',
  },
  thumb: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: 56,
  },
  playBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  focusLabel: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: T.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  focusLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: T.dark,
    marginRight: 10,
  },
  lessonDesc: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 19,
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.pale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  metaText: {
    fontSize: 11,
    color: T.muted,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: T.card,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    color: T.primary,
    fontWeight: '600',
  },

  // tip banner
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  tipBannerText: {
    flex: 1,
    fontSize: 13,
    color: T.muted,
    lineHeight: 19,
  },
})
