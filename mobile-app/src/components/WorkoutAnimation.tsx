// WorkoutAnimation.tsx
// Animated stick-figure workout animations — one unique motion per exercise.
// Uses React Native's built-in Animated API only. Works in Expo Go with no extra deps.

import React, { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import { T } from '@/constants/theme'

const C = T.primary   // #FF1493

// ── Canvas dimensions ────────────────────────────────────────────────────────
const W  = 150        // always 150×150 internally; outer Canvas scales it
const CX = 75         // horizontal centre

// ── Standing-figure body dimensions ─────────────────────────────────────────
const HR = 11         // head radius
const NW = 4,  NH = 9   // neck
const TW = 5,  TH = 38  // torso
const AW = 5,  AH = 28  // arm (single segment)
const LW = 5,  LH = 36  // leg (single segment)

// Vertical positions (top of each element, standing upright)
const HY  = 5
const NY  = HY + HR * 2        // = 27
const TY  = NY + NH             // = 36
const SY  = TY + 6              // shoulder pivot  = 42
const PY  = TY + TH             // hip pivot       = 74

// ── Helpers ───────────────────────────────────────────────────────────────────

function usePingPong(duration: number, delay = 0): Animated.Value {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        ...(delay > 0 ? [Animated.delay(delay)] : []),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    )
    a.start()
    return () => a.stop()
  }, [])
  return v
}

// Pivot-correct rotating limb.
// Positions a rectangle at (pivotX, pivotY) and rotates it around that top edge.
// rotate = Animated.AnimatedInterpolation<string> or a plain-string angle like '-25deg'
function Limb({
  pivotX, pivotY, w, h, rotate, color = C,
}: {
  pivotX: number; pivotY: number; w: number; h: number
  rotate: Animated.AnimatedInterpolation<string> | string
  color?: string
}) {
  const half = h / 2
  return (
    <Animated.View
      style={{
        position: 'absolute', left: pivotX - w / 2, top: pivotY,
        width: w, height: h, borderRadius: 3, backgroundColor: color,
        transform: [
          { translateY: -half },
          { rotate: rotate as string },
          { translateY: half },
        ] as any,
      }}
    />
  )
}

// Static body parts
function Head({ cx = CX, top = HY }: { cx?: number; top?: number }) {
  return <View style={{ position: 'absolute', left: cx - HR, top, width: HR * 2, height: HR * 2, borderRadius: HR, backgroundColor: C }} />
}
function Neck({ cx = CX, top = NY }: { cx?: number; top?: number }) {
  return <View style={{ position: 'absolute', left: cx - NW / 2, top, width: NW, height: NH, borderRadius: 2, backgroundColor: C }} />
}
function Torso({ cx = CX, top = TY }: { cx?: number; top?: number }) {
  return <View style={{ position: 'absolute', left: cx - TW / 2, top, width: TW, height: TH, borderRadius: 3, backgroundColor: C }} />
}

// Outer canvas — scales the 150×150 internal canvas to match requested size
function Canvas({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ width: W, height: W, transform: [{ scale: size / W }] }}>
        {children}
      </View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDING ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── SQUAT — hips sink, legs fan wide ─────────────────────────────────────────
function SquatAnimation({ size }: { size: number }) {
  const p = usePingPong(900)
  const bodyDown  = p.interpolate({ inputRange: [0,1], outputRange: [0, 16] })
  const leftLeg   = p.interpolate({ inputRange: [0,1], outputRange: ['-18deg', '-55deg'] })
  const rightLeg  = p.interpolate({ inputRange: [0,1], outputRange: ['18deg', '55deg'] })
  const leftArm   = p.interpolate({ inputRange: [0,1], outputRange: ['-22deg', '-8deg'] })
  const rightArm  = p.interpolate({ inputRange: [0,1], outputRange: ['22deg', '8deg'] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: bodyDown }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={leftLeg} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={rightLeg} />
    </Canvas>
  )
}

// ── LUNGE — one leg steps forward, body drops ────────────────────────────────
function LungeAnimation({ size }: { size: number }) {
  const p = usePingPong(1000)
  const bodyDown   = p.interpolate({ inputRange: [0,1], outputRange: [0, 14] })
  const frontLeg   = p.interpolate({ inputRange: [0,1], outputRange: ['-10deg', '-40deg'] })
  const backLeg    = p.interpolate({ inputRange: [0,1], outputRange: ['10deg', '32deg'] })
  const leftArm    = '-20deg'
  const rightArm   = '20deg'
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: bodyDown }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={frontLeg} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={backLeg} />
    </Canvas>
  )
}

// ── DEADLIFT — whole upper body hinges forward at hip, arms hang down ─────────
// Hip ≈ canvas centre (75,74), so rotating the body group around canvas centre
// gives a convincing hip-hinge motion.
function DeadliftAnimation({ size }: { size: number }) {
  const p = usePingPong(950)
  const hinge = p.interpolate({ inputRange: [0,1], outputRange: ['0deg', '42deg'] })
  const legL  = '-10deg'
  const legR  = '10deg'
  return (
    <Canvas size={size}>
      {/* Upper body hinges forward from hip */}
      <Animated.View
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: W,
          transform: [{ rotate: hinge as any }],
        }}
      >
        <Head /><Neck /><Torso />
        {/* Arms hang straight — they follow the body tilt naturally */}
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate="-5deg" />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate="5deg" />
      </Animated.View>
      {/* Legs stay mostly upright */}
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={legL} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={legR} />
    </Canvas>
  )
}

// ── OVERHEAD PRESS — both arms raise together overhead ───────────────────────
function PressAnimation({ size }: { size: number }) {
  const p = usePingPong(800)
  const leftArm  = p.interpolate({ inputRange: [0,1], outputRange: ['-28deg', '-158deg'] })
  const rightArm = p.interpolate({ inputRange: [0,1], outputRange: ['28deg', '158deg'] })
  const lift     = p.interpolate({ inputRange: [0,1], outputRange: [0, -3] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: lift }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-14deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="14deg" />
    </Canvas>
  )
}

// ── BICEP CURL — arms alternate curling up ────────────────────────────────────
function CurlAnimation({ size }: { size: number }) {
  const pA = usePingPong(700)
  const pB = usePingPong(700, 700)   // half-cycle out of phase
  const leftArm  = pA.interpolate({ inputRange: [0,1], outputRange: ['-20deg', '-130deg'] })
  const rightArm = pB.interpolate({ inputRange: [0,1], outputRange: ['20deg', '130deg'] })
  return (
    <Canvas size={size}>
      <Head /><Neck /><Torso />
      <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
      <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-14deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="14deg" />
    </Canvas>
  )
}

// ── BENT-OVER ROW — body tilts forward, arms row back repeatedly ──────────────
function RowAnimation({ size }: { size: number }) {
  const p = usePingPong(750)
  // Arms pull back from hanging (~+5° forward) to behind (~-60°)
  const leftArm  = p.interpolate({ inputRange: [0,1], outputRange: ['-15deg', '-80deg'] })
  const rightArm = p.interpolate({ inputRange: [0,1], outputRange: ['15deg', '80deg'] })
  return (
    <Canvas size={size}>
      {/* Body is statically hinged forward ~38° */}
      <Animated.View
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: W,
          transform: [{ rotate: '35deg' as any }],
        }}
      >
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      {/* Slightly bent legs for the hinge */}
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-8deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="8deg" />
    </Canvas>
  )
}

// ── PULL-UP — arms overhead, body rises and falls ─────────────────────────────
function PullupAnimation({ size }: { size: number }) {
  const p = usePingPong(900)
  const bodyLift  = p.interpolate({ inputRange: [0,1], outputRange: [0, -22] })
  return (
    <Canvas size={size}>
      {/* Arms fixed overhead */}
      <Limb pivotX={CX} pivotY={SY - 45} w={AW} h={AH + 20} rotate="-155deg" />
      <Limb pivotX={CX} pivotY={SY - 45} w={AW} h={AH + 20} rotate="155deg" />
      {/* Body rises */}
      <Animated.View style={{ transform: [{ translateY: bodyLift }] }}>
        <Head /><Neck /><Torso />
      </Animated.View>
      {/* Legs hang together */}
      <Animated.View style={{ transform: [{ translateY: bodyLift }] }}>
        <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-8deg" />
        <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="8deg" />
      </Animated.View>
    </Canvas>
  )
}

// ── RUNNING — alternating arm/leg swing ───────────────────────────────────────
function RunAnimation({ size }: { size: number }) {
  const pA = usePingPong(420)
  const pB = usePingPong(420, 420)
  const leftArm  = pA.interpolate({ inputRange: [0,1], outputRange: ['-45deg', '25deg'] })
  const rightArm = pB.interpolate({ inputRange: [0,1], outputRange: ['-45deg', '25deg'] })
  const leftLeg  = pB.interpolate({ inputRange: [0,1], outputRange: ['-38deg', '28deg'] })
  const rightLeg = pA.interpolate({ inputRange: [0,1], outputRange: ['-38deg', '28deg'] })
  const bob      = pA.interpolate({ inputRange: [0,1], outputRange: [0, -5] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={leftLeg} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={rightLeg} />
    </Canvas>
  )
}

// ── JUMPING JACK — arms and legs spread wide simultaneously ───────────────────
function JumpingJackAnimation({ size }: { size: number }) {
  const p = usePingPong(600)
  const leftArm   = p.interpolate({ inputRange: [0,1], outputRange: ['-20deg', '-95deg'] })
  const rightArm  = p.interpolate({ inputRange: [0,1], outputRange: ['20deg', '95deg'] })
  const leftLeg   = p.interpolate({ inputRange: [0,1], outputRange: ['-10deg', '-38deg'] })
  const rightLeg  = p.interpolate({ inputRange: [0,1], outputRange: ['10deg', '38deg'] })
  const bob       = p.interpolate({ inputRange: [0,1], outputRange: [0, -6] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={leftLeg} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={rightLeg} />
    </Canvas>
  )
}

// ── FRONT KICK — one leg snaps forward ───────────────────────────────────────
function KickAnimation({ size }: { size: number }) {
  const p = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(p, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(500),
      ])
    )
    a.start()
    return () => a.stop()
  }, [])
  const kickLeg  = p.interpolate({ inputRange: [0,1], outputRange: ['-15deg', '-95deg'] })
  const bodyTilt = p.interpolate({ inputRange: [0,1], outputRange: ['0deg', '8deg'] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ rotate: bodyTilt as any }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate="-35deg" />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate="30deg" />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate={kickLeg} />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="15deg" />
    </Canvas>
  )
}

// ── PUNCH — snap jab, body rotates into it ────────────────────────────────────
function PunchAnimation({ size }: { size: number }) {
  const p = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(110),
        Animated.timing(p, { toValue: 0, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(420),
      ])
    )
    a.start()
    return () => a.stop()
  }, [])
  const punchArm  = p.interpolate({ inputRange: [0,1], outputRange: ['30deg', '-82deg'] })
  const bodyTwist = p.interpolate({ inputRange: [0,1], outputRange: ['0deg', '8deg'] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ rotate: bodyTwist as any }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate="-35deg" />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={punchArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-22deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="18deg" />
    </Canvas>
  )
}

// ── TRICEP DIPS — seated dip, body lowers and raises ─────────────────────────
function DipsAnimation({ size }: { size: number }) {
  const p = usePingPong(700)
  const bodyDrop  = p.interpolate({ inputRange: [0,1], outputRange: [0, 18] })
  const leftArm   = p.interpolate({ inputRange: [0,1], outputRange: ['-90deg', '-60deg'] })
  const rightArm  = p.interpolate({ inputRange: [0,1], outputRange: ['90deg', '60deg'] })
  return (
    <Canvas size={size}>
      {/* Arms stay fixed (on bench), body drops between them */}
      <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
      <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      <Animated.View style={{ transform: [{ translateY: bodyDrop }] }}>
        <Head /><Neck /><Torso />
      </Animated.View>
      {/* Legs extended forward */}
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-30deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="30deg" />
    </Canvas>
  )
}

// ── STRETCH — slow arm raise with gentle body sway ───────────────────────────
function StretchAnimation({ size }: { size: number }) {
  const p    = usePingPong(1400)
  const leftArm  = p.interpolate({ inputRange: [0,1], outputRange: ['-25deg', '-170deg'] })
  const rightArm = p.interpolate({ inputRange: [0,1], outputRange: ['25deg', '170deg'] })
  const sway     = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '5deg', '0deg'] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ rotate: sway as any }] }}>
        <Head /><Neck /><Torso />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={leftArm} />
        <Limb pivotX={CX} pivotY={SY} w={AW} h={AH} rotate={rightArm} />
      </Animated.View>
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="-12deg" />
      <Limb pivotX={CX} pivotY={PY} w={LW} h={LH} rotate="12deg" />
    </Canvas>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HORIZONTAL (FLOOR) ANIMATIONS — side-profile view
// The figure lies on its back, head on the left, feet to the right.
//
// Side-profile coordinates (all in 150×150 canvas):
//   Ground level y ≈ 105
//   Head r=8,  centre (18, 95)
//   Neck: (26,101)→(33,101)  h=4, w=7
//   Torso: (33,101)→(72,101) h=5, w=39
//   Hip pivot at (72, 103)
//   Shoulder pivot at (40, 101)
// ═══════════════════════════════════════════════════════════════════════════════

// Horizontal side-profile static body parts
function HHead() {
  return <View style={{ position: 'absolute', left: 10, top: 87, width: 16, height: 16, borderRadius: 8, backgroundColor: C }} />
}
function HNeck() {
  return <View style={{ position: 'absolute', left: 26, top: 99, width: 7, height: 4, borderRadius: 2, backgroundColor: C }} />
}
// Torso length and hip/shoulder x-positions for side view
const H_SHOULDER_X = 40   // arm pivot x
const H_HIP_X      = 72   // leg pivot x
const H_Y          = 101  // body centre y

function HTorso() {
  return <View style={{ position: 'absolute', left: 33, top: H_Y - 2, width: H_HIP_X - 33, height: 5, borderRadius: 3, backgroundColor: C }} />
}

// Horizontal limb: pivots around its LEFT end (for rightward limbs going up/down)
// pivotX, pivotY = joint position; length; angle measured from rightward horizontal
function HLimb({
  pivotX, pivotY, length, thickness = 5, angle, color = C,
}: {
  pivotX: number; pivotY: number; length: number; thickness?: number
  angle: Animated.AnimatedInterpolation<string> | string
  color?: string
}) {
  const half = length / 2
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: pivotX,          // left end at pivot
        top: pivotY - thickness / 2,
        width: length,
        height: thickness,
        borderRadius: 3,
        backgroundColor: color,
        // Pivot around LEFT end: translateX(-half), rotate, translateX(half)
        transform: [
          { translateX: -half },
          { rotate: angle as string },
          { translateX: half },
        ] as any,
      }}
    />
  )
}

// ── PUSH-UP / PLANK — horizontal face-down, subtle breathing pulse ────────────
function PlankAnimation({ size }: { size: number }) {
  const p = usePingPong(2000)
  const breathe = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.02, 1] })
  return (
    <Canvas size={size}>
      <Animated.View style={{
        position: 'absolute', left: 0, top: 0, width: W, height: W,
        transform: [{ scaleY: breathe }],
      }}>
        <HHead />
        <HNeck />
        <HTorso />
        {/* Arms bent at ~90° supporting body */}
        <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={20} angle="-70deg" />
        <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={20} angle="70deg" />
        {/* Legs straight behind */}
        <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={35} angle="-8deg" />
        <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={35} angle="8deg" />
      </Animated.View>
    </Canvas>
  )
}

// ── PUSH-UP / BENCH PRESS — body horizontal, arms extend/compress ─────────────
function PushupAnimation({ size }: { size: number }) {
  const p = usePingPong(700)
  const leftArm  = p.interpolate({ inputRange: [0,1], outputRange: ['-55deg', '-90deg'] })
  const rightArm = p.interpolate({ inputRange: [0,1], outputRange: ['55deg', '90deg'] })
  const bodyLift = p.interpolate({ inputRange: [0,1], outputRange: [0, -12] })
  return (
    <Canvas size={size}>
      <Animated.View style={{ transform: [{ translateY: bodyLift }] }}>
        <HHead />
        <HNeck />
        <HTorso />
      </Animated.View>
      {/* Arms animate — elbows bend/extend */}
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={24} angle={leftArm} />
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={24} angle={rightArm} />
      {/* Legs flat */}
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={35} angle="-5deg" />
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={35} angle="5deg" />
    </Canvas>
  )
}

// ── CRUNCH — upper body curls up off the floor ────────────────────────────────
// Pivot point for upper body rotation: lower back ≈ (52, 103)
// Canvas centre = (75, 75); pivot offset dx = -(75-52)=-23, dy = -(75-103)=28
function CrunchAnimation({ size }: { size: number }) {
  const p = usePingPong(700)
  const curl = p.interpolate({ inputRange: [0,1], outputRange: ['0deg', '-38deg'] })
  return (
    <Canvas size={size}>
      {/* Lower body stays flat */}
      <HTorso />
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={22} angle="10deg"  />   {/* thigh */}
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={22} angle="-10deg" />
      <HLimb pivotX={H_HIP_X + 20} pivotY={H_Y} length={20} angle="60deg"  /> {/* shin */}
      <HLimb pivotX={H_HIP_X + 20} pivotY={H_Y} length={20} angle="-60deg" />
      {/* Upper body curls up */}
      <Animated.View
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: W,
          transform: [
            { translateX: -23 },
            { translateY: 28 },
            { rotate: curl as any },
            { translateX: 23 },
            { translateY: -28 },
          ] as any,
        }}
      >
        <HHead />
        <HNeck />
        {/* Upper torso partial */}
        <View style={{ position: 'absolute', left: 33, top: H_Y - 2, width: 19, height: 5, borderRadius: 3, backgroundColor: C }} />
      </Animated.View>
    </Canvas>
  )
}

// ── LEG RAISE — legs lift from flat to near-vertical ─────────────────────────
// Pivot at hip (72, 103); canvas centre (75,75); dx=-(75-72)=-3, dy=-(75-103)=28
function LegRaiseAnimation({ size }: { size: number }) {
  const p = usePingPong(900)
  const raise = p.interpolate({ inputRange: [0,1], outputRange: ['0deg', '-80deg'] })
  return (
    <Canvas size={size}>
      <HHead /><HNeck /><HTorso />
      {/* Arms at sides */}
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={22} angle="-15deg" />
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={22} angle="15deg"  />
      {/* Legs raise together */}
      <Animated.View
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: W,
          transform: [
            { translateX: -3 },
            { translateY: 28 },
            { rotate: raise as any },
            { translateX: 3 },
            { translateY: -28 },
          ] as any,
        }}
      >
        <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={36} angle="-6deg"  />
        <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={36} angle="6deg"   />
      </Animated.View>
    </Canvas>
  )
}

// ── FLUTTER KICK — two legs alternate quickly ─────────────────────────────────
function FlutterAnimation({ size }: { size: number }) {
  const pA = usePingPong(280)
  const pB = usePingPong(280, 280)
  const legA = pA.interpolate({ inputRange: [0,1], outputRange: ['-15deg', '-35deg'] })
  const legB = pB.interpolate({ inputRange: [0,1], outputRange: ['-15deg', '-35deg'] })
  return (
    <Canvas size={size}>
      <HHead /><HNeck /><HTorso />
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={22} angle="-15deg" />
      <HLimb pivotX={H_SHOULDER_X} pivotY={H_Y} length={22} angle="15deg"  />
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={36} angle={legA} />
      <HLimb pivotX={H_HIP_X} pivotY={H_Y} length={36} angle={legB} />
    </Canvas>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECT EXERCISE ID → ANIMATION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

type AnimType =
  | 'squat' | 'lunge' | 'deadlift'
  | 'press' | 'curl' | 'row' | 'pullup' | 'dips'
  | 'run' | 'jumpingjack' | 'kick' | 'punch' | 'stretch'
  | 'pushup' | 'plank' | 'crunch' | 'legraise' | 'flutter'

const EXERCISE_ANIM: Record<string, AnimType> = {
  // ── Strength ──
  str_squat:       'squat',
  str_deadlift:    'deadlift',
  str_bench:       'pushup',
  str_ohp:         'press',
  str_row:         'row',
  str_pullup:      'pullup',
  str_lunge:       'lunge',
  str_plank_hold:  'plank',
  str_curl:        'curl',
  str_dips:        'dips',

  // ── Self-defence ──
  sd_jab:          'punch',
  sd_frontkick:    'kick',
  sd_roundhouse:   'kick',
  sd_block:        'punch',
  sd_elbow:        'punch',
  sd_knee:         'kick',
  sd_wrist:        'punch',
  sd_bearhug:      'punch',
  sd_hammer:       'punch',
  sd_fall:         'stretch',

  // ── Cardio ──
  car_jumprope:    'jumpingjack',
  car_highknees:   'run',
  car_burpees:     'run',
  car_boxjump:     'squat',
  car_mountain:    'pushup',
  car_sprint:      'run',
  car_jjack:       'jumpingjack',
  car_shuffle:     'run',

  // ── Flexibility ──
  flex_neck:       'stretch',
  flex_shoulder:   'stretch',
  flex_hipflex:    'stretch',
  flex_hamstring:  'stretch',
  flex_quad:       'stretch',
  flex_spinal:     'stretch',
  flex_childs:     'stretch',
  flex_catcow:     'stretch',

  // ── Core ──
  core_crunch:     'crunch',
  core_bicycle:    'crunch',
  core_legraise:   'legraise',
  core_russian:    'crunch',
  core_plank:      'plank',
  core_sideplank:  'plank',
  core_flutter:    'flutter',
  core_deadbug:    'crunch',
}

function getAnimType(exerciseId: string): AnimType {
  return EXERCISE_ANIM[exerciseId] ?? 'squat'
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface WorkoutAnimationProps {
  exerciseId: string
  size?: number
}

export default function WorkoutAnimation({ exerciseId, size = 150 }: WorkoutAnimationProps) {
  switch (getAnimType(exerciseId)) {
    case 'squat':       return <SquatAnimation       size={size} />
    case 'lunge':       return <LungeAnimation       size={size} />
    case 'deadlift':    return <DeadliftAnimation    size={size} />
    case 'press':       return <PressAnimation       size={size} />
    case 'curl':        return <CurlAnimation        size={size} />
    case 'row':         return <RowAnimation         size={size} />
    case 'pullup':      return <PullupAnimation      size={size} />
    case 'dips':        return <DipsAnimation        size={size} />
    case 'run':         return <RunAnimation         size={size} />
    case 'jumpingjack': return <JumpingJackAnimation size={size} />
    case 'kick':        return <KickAnimation        size={size} />
    case 'punch':       return <PunchAnimation       size={size} />
    case 'stretch':     return <StretchAnimation     size={size} />
    case 'pushup':      return <PushupAnimation      size={size} />
    case 'plank':       return <PlankAnimation       size={size} />
    case 'crunch':      return <CrunchAnimation      size={size} />
    case 'legraise':    return <LegRaiseAnimation    size={size} />
    case 'flutter':     return <FlutterAnimation     size={size} />
    default:            return <SquatAnimation       size={size} />
  }
}
