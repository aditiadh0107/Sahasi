// exerciseNameMap.ts
// Maps our exercise_id → ExerciseDB search name.
// Used by exerciseMediaService to fetch real human GIF animations.

const EXERCISE_DB_NAMES: Record<string, string> = {
  // ── Strength ──────────────────────────────────────────────────────────────
  str_squat:      'barbell back squat',
  str_deadlift:   'deadlift',
  str_bench:      'barbell bench press',
  str_ohp:        'overhead press',
  str_row:        'bent over row',
  str_pullup:     'pull-up',
  str_lunge:      'dumbbell lunge',
  str_plank_hold: 'plank',
  str_curl:       'dumbbell bicep curl',
  str_dips:       'tricep dip',

  // ── Self Defence ──────────────────────────────────────────────────────────
  sd_jab:       'jab cross',
  sd_frontkick: 'front kick',
  sd_roundhouse:'roundhouse kick',
  sd_block:     'side kick',
  sd_elbow:     'elbow strike',
  sd_knee:      'knee raise',
  sd_wrist:     'wrist roller',
  sd_bearhug:   'hip circle',
  sd_hammer:    'dumbbell hammer curl',
  sd_fall:      'roll',

  // ── Cardio ────────────────────────────────────────────────────────────────
  car_jumprope: 'jump rope',
  car_highknees:'high knees',
  car_burpees:  'burpee',
  car_boxjump:  'box jump',
  car_mountain: 'mountain climber',
  car_sprint:   'sprint',
  car_jjack:    'jumping jack',
  car_shuffle:  'lateral shuffle',

  // ── Flexibility ───────────────────────────────────────────────────────────
  flex_neck:      'neck roll',
  flex_shoulder:  'shoulder stretch',
  flex_hipflex:   'hip flexor stretch',
  flex_hamstring: 'hamstring stretch',
  flex_quad:      'quad stretch',
  flex_spinal:    'spinal twist',
  flex_childs:    "child's pose",
  flex_catcow:    'cat cow',

  // ── Core ──────────────────────────────────────────────────────────────────
  core_crunch:   'crunch',
  core_bicycle:  'bicycle crunch',
  core_legraise: 'leg raise',
  core_russian:  'russian twist',
  core_plank:    'plank',
  core_sideplank:'side plank',
  core_flutter:  'flutter kick',
  core_deadbug:  'dead bug',
}

export default EXERCISE_DB_NAMES
