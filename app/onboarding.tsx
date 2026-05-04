import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient as SvgRadial, Stop, Rect } from 'react-native-svg';
import TakrirIcon from '../assets/takrir-icon-black.svg';
import { useAuthStore } from '../src/store/auth';
import {
  APP_PRIMARY,
  SURFACE,
  SURFACE_FROSTED,
  SURFACE_SCREEN,
  TEXT_BODY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from '../src/theme';

export const ONBOARDING_KEY = 'takrir_has_seen_onboarding';

const { width: SW, height: SH } = Dimensions.get('window');
const BOTTOM_BAR_H = 100;

// ─── Quran data ───────────────────────────────────────────────────────────────

const SURAH_NAMES = [
  'Al-Fatihah','Al-Baqarah',"Ali 'Imran","An-Nisa'","Al-Ma'idah",
  "Al-An'am","Al-A'raf",'Al-Anfal','At-Tawbah','Yunus',
  'Hud','Yusuf',"Ar-Ra'd",'Ibrahim','Al-Hijr',
  'An-Nahl',"Al-Isra'",'Al-Kahf','Maryam','Ta-Ha',
  "Al-Anbiya'",'Al-Hajj',"Al-Mu'minun",'An-Nur','Al-Furqan',
  "Ash-Shu'ara'",'An-Naml','Al-Qasas',"Al-'Ankabut",'Ar-Rum',
  'Luqman','As-Sajdah','Al-Ahzab',"Saba'",'Fatir',
  'Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir',
  'Fussilat','Ash-Shuraa','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah',
  'Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf',
  'Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman',
  "Al-Waqi'ah",'Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah',
  'As-Saf',"Al-Jumu'ah",'Al-Munafiqun','At-Taghabun','At-Talaq',
  'At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah',"Al-Ma'arij",
  'Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah',
  'Al-Insan','Al-Mursalat',"An-Naba'","An-Nazi'at","'Abasa",
  'At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj',
  'At-Tariq',"Al-A'la",'Al-Ghashiyah','Al-Fajr','Al-Balad',
  'Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin',
  "Al-'Alaq",'Al-Qadr','Al-Bayyinah','Az-Zalzalah',"Al-'Adiyat",
  "Al-Qari'ah",'At-Takathur',"Al-'Asr",'Al-Humazah','Al-Fil',
  'Quraysh',"Al-Ma'un",'Al-Kawthar','Al-Kafirun','An-Nasr',
  'Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas',
];

const SURAH_VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,
  123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,
  34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,
  60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,
  28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,
  15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,
  5,4,5,6,
];
const TOTAL_QURAN_VERSES = 6236;

function calcPercentKnown(
  mode: 'juz' | 'surah' | 'none',
  selectedJuz: number[],
  surahFrom: number,
  surahTo: number,
): number {
  if (mode === 'none') return 0;
  if (mode === 'juz') return Math.round((selectedJuz.length / 30) * 100);
  const from  = Math.min(surahFrom, surahTo);
  const to    = Math.max(surahFrom, surahTo);
  const count = SURAH_VERSE_COUNTS.slice(from - 1, to).reduce((a, b) => a + b, 0);
  return Math.round((count / TOTAL_QURAN_VERSES) * 100);
}

// ─── Ring chart constants ─────────────────────────────────────────────────────

const RING_R      = 74;
const RING_STROKE = 14;
const RING_SIZE   = (RING_R + RING_STROKE) * 2 + 8;
const RING_CIRCUM = 2 * Math.PI * RING_R;

// ─── Goals ────────────────────────────────────────────────────────────────────

const GOALS = [
  { id: 'hifz',       label: 'Learning Hifz'                          },
  { id: 'revision',   label: 'Revising lessons'                       },
  { id: 'connection', label: 'Improving my connection with the Quran' },
] as const;

// ─── Slide data ───────────────────────────────────────────────────────────────

type Slide = { id: string; headline: string; body: string; isFinal: boolean };

const SLIDES: Slide[] = [
  { id: '1',  headline: 'What is Takrir?',
    body: 'Takrir (تكرير) is the ancient practice of returning to Quranic verses again and again — until they settle in the heart.',
    isFinal: false },
  { id: '2',  headline: 'Learn the Quran through repetition.',
    body: 'Repeated listening is one of the most powerful paths to memorisation. The heart remembers what the ear revisits.',
    isFinal: false },
  { id: '3',  headline: 'How much Quran do you know?',           body: '', isFinal: false },
  { id: '4',  headline: '',                                       body: '', isFinal: false },
  { id: '5',  headline: '',                                       body: '', isFinal: false },
  { id: '6',  headline: 'What are your goals with Takrir?',      body: '', isFinal: false },
  { id: '7',  headline: '',                                       body: '', isFinal: false },
  { id: '8',  headline: 'Welcome to Takrir.',
    body: 'Built at the Quran.com hackathon to help students learn Hifz through repetition.',
    isFinal: false },
  { id: '9',  headline: 'Choose the verses you want to focus on.',
    body: 'Pick any surah and set the exact start and end verse. Work through a single ayah or an entire chapter.',
    isFinal: false },
  { id: '10', headline: 'Listen and learn on the go.',
    body: 'Build playlists around any portion of the Quran and take them wherever life takes you.',
    isFinal: false },
  { id: '11', headline: 'Connect your heart with beautiful recitations.',
    body: 'Choose from world-class reciters, each bringing a unique voice to the words of Allah.',
    isFinal: false },
  { id: '12', headline: 'Find your reciter.',
    body: 'Each voice brings its own depth to the words of Allah.',
    isFinal: false },
  { id: '13', headline: 'Every voice tells a story.',
    body: 'Let your heart guide you to the recitation that moves you.',
    isFinal: false },
  { id: '14', headline: 'Begin your recitation.', body: '', isFinal: true },
];

type VisualProps = { isActive: boolean };

// ─── Visual 1: What is Takrir ─────────────────────────────────────────────────

function Visual1({ isActive }: VisualProps) {
  const iconAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) { animRef.current?.stop(); iconAnim.setValue(0); textAnim.setValue(0); return; }
    animRef.current = Animated.sequence([
      Animated.timing(iconAnim, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{ opacity: iconAnim, transform: [{ scale: iconAnim.interpolate({ inputRange: [0,1], outputRange: [0.72,1] }) }] }}>
        <TakrirIcon width={80} height={107} />
      </Animated.View>
      <View style={{ height: 28 }} />
      <Animated.View style={{ opacity: textAnim, transform: [{ translateY: textAnim.interpolate({ inputRange: [0,1], outputRange: [14,0] }) }], alignItems: 'center' }}>
        <Text style={vis.arabicWord}>تكرير</Text>
        <Text style={vis.arabicSub}>Repetition</Text>
      </Animated.View>
    </View>
  );
}

// ─── Visual 2: Repetition — ripple rings ──────────────────────────────────────

function Visual2({ isActive }: VisualProps) {
  const SIZE        = 220;
  const ringScales  = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const animRef     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) { animRef.current?.stop(); ringScales.forEach(s => s.setValue(1)); iconOpacity.setValue(0); return; }
    Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const makeLoop = (scale: Animated.Value, delay: number) =>
      Animated.sequence([Animated.delay(delay), Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]))]);
    animRef.current = Animated.parallel([makeLoop(ringScales[0], 0), makeLoop(ringScales[1], 300), makeLoop(ringScales[2], 600)]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  const RINGS = [{ size: 110, opacity: 0.28 }, { size: 165, opacity: 0.18 }, { size: SIZE, opacity: 0.1 }];
  return (
    <View style={vis.center}>
      <View style={{ width: SIZE, height: SIZE }}>
        {RINGS.map(({ size, opacity }, i) => {
          const off = (SIZE - size) / 2;
          return <Animated.View key={i} style={{ position: 'absolute', top: off, left: off, width: size, height: size, borderRadius: size/2, borderWidth: 1.5, borderColor: APP_PRIMARY, opacity, transform: [{ scale: ringScales[i] }] }} />;
        })}
        <Animated.View style={{ position: 'absolute', top: (SIZE-52)/2, left: (SIZE-40)/2, opacity: iconOpacity }}>
          <TakrirIcon width={40} height={52} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Visual 3 (slide 3): Personalisation — Quran knowledge picker ─────────────

type KnowledgeVisualProps = VisualProps & {
  mode: 'juz' | 'surah' | 'none';
  selectedJuz: number[];
  surahFrom: number;
  surahTo: number;
  onChange: (mode: 'juz' | 'surah' | 'none', juz: number[], from: number, to: number) => void;
};

function VisualKnowledge({ isActive, mode, selectedJuz, surahFrom, surahTo, onChange }: KnowledgeVisualProps) {
  const setMode = (m: typeof mode) => onChange(m, selectedJuz, surahFrom, surahTo);

  const toggleJuz = (n: number) => {
    const next = selectedJuz.includes(n) ? selectedJuz.filter(j => j !== n) : [...selectedJuz, n];
    onChange(mode, next, surahFrom, surahTo);
  };

  const clamp = (v: number) => Math.max(1, Math.min(114, v));

  return (
    <View style={vis.center}>
      {/* Mode toggle */}
      <View style={vis.knowToggleRow}>
        {(['juz', 'surah', 'none'] as const).map((m) => (
          <TouchableOpacity key={m} style={[vis.knowToggle, mode === m && vis.knowToggleActive]} onPress={() => setMode(m)} activeOpacity={0.7}>
            <Text style={[vis.knowToggleText, mode === m && vis.knowToggleTextActive]}>
              {m === 'juz' ? 'By Juz' : m === 'surah' ? 'By Surah' : 'None'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />

      {mode === 'juz' && (
        <View style={vis.juzGrid}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
            const sel = selectedJuz.includes(n);
            return (
              <TouchableOpacity key={n} style={[vis.juzCell, sel && vis.juzCellSel]} onPress={() => toggleJuz(n)} activeOpacity={0.7}>
                <Text style={[vis.juzCellText, sel && vis.juzCellTextSel]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {mode === 'surah' && (
        <View style={vis.surahPickerWrap}>
          {[
            { label: 'From surah', value: surahFrom, onDec: () => onChange(mode, selectedJuz, clamp(surahFrom - 1), surahTo), onInc: () => onChange(mode, selectedJuz, clamp(surahFrom + 1), surahTo) },
            { label: 'To surah',   value: surahTo,   onDec: () => onChange(mode, selectedJuz, surahFrom, clamp(surahTo - 1)),   onInc: () => onChange(mode, selectedJuz, surahFrom, clamp(surahTo + 1)) },
          ].map(({ label, value, onDec, onInc }) => (
            <View key={label} style={vis.surahRow}>
              <Text style={vis.surahLabel}>{label}</Text>
              <View style={vis.stepperRow}>
                <TouchableOpacity style={vis.stepBtn} onPress={onDec} activeOpacity={0.7}><Text style={vis.stepBtnText}>−</Text></TouchableOpacity>
                <View style={vis.stepValue}>
                  <Text style={vis.stepValueNum}>{value}</Text>
                  <Text style={vis.stepValueName} numberOfLines={1}>{SURAH_NAMES[value - 1]}</Text>
                </View>
                <TouchableOpacity style={vis.stepBtn} onPress={onInc} activeOpacity={0.7}><Text style={vis.stepBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {mode === 'none' && (
        <View style={vis.noneBox}>
          <Text style={vis.noneText}>Every journey begins{'\n'}with the first verse. ✦</Text>
        </View>
      )}
    </View>
  );
}

// ─── Visual 4 & 5 (slides 4–5): Quran progress ring ─────────────────────────

type RingSlideProps = VisualProps & { percent: number; shouldAnimate: boolean };

function VisualRingSlide({ isActive, percent, shouldAnimate }: RingSlideProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef      = useRef<Animated.CompositeAnimation | null>(null);
  const [offset, setOffset] = useState(RING_CIRCUM);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setOffset(RING_CIRCUM * (1 - value));
    });

    if (!isActive) {
      if (shouldAnimate) { animRef.current?.stop(); progressAnim.setValue(0); setOffset(RING_CIRCUM); }
      return () => progressAnim.removeListener(id);
    }

    if (shouldAnimate) {
      animRef.current = Animated.timing(progressAnim, {
        toValue: percent / 100,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      animRef.current.start();
    } else {
      // Static — jump to final value without animation
      progressAnim.setValue(percent / 100);
      setOffset(RING_CIRCUM * (1 - percent / 100));
    }

    return () => { progressAnim.removeListener(id); animRef.current?.stop(); };
  }, [isActive, percent, shouldAnimate]);

  const isZero = percent === 0;

  return (
    <View style={vis.center}>
      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Track */}
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            stroke={`${APP_PRIMARY}22`} strokeWidth={RING_STROKE} fill="none"
          />
          {/* Progress — rotated so 0% starts at top */}
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            stroke={APP_PRIMARY} strokeWidth={RING_STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUM}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        {/* Center label */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={vis.ringPercent}>{percent}%</Text>
            <Text style={vis.ringLabel}>known</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />

      <Text style={vis.ringMessage} numberOfLines={3}>
        {isZero
          ? 'Every journey begins\nwith the first verse.'
          : `MashaAllah 🤍\nYou know ${percent}% of the Quran.`}
      </Text>
    </View>
  );
}

// ─── Visual 6 (slide 6): Personalisation — Goals ─────────────────────────────

type GoalsVisualProps = VisualProps & { selected: string[]; onChange: (g: string[]) => void };

function VisualGoals({ isActive, selected, onChange }: GoalsVisualProps) {
  const toggleGoal = (id: string) => {
    const next = selected.includes(id) ? selected.filter(g => g !== id) : [...selected, id];
    onChange(next);
  };

  return (
    <View style={vis.center}>
      <View style={vis.goalsList}>
        {GOALS.map((g) => {
          const sel = selected.includes(g.id);
          return (
            <TouchableOpacity key={g.id} style={[vis.goalCard, sel && vis.goalCardSel]} onPress={() => toggleGoal(g.id)} activeOpacity={0.75}>
              <Text style={[vis.goalLabel, sel && vis.goalLabelSel]}>{g.label}</Text>
              {sel && <View style={vis.goalCheck}><Text style={vis.goalCheckText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Visual 7 (slide 7): Dua ─────────────────────────────────────────────────

function VisualDua({ isActive }: VisualProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) { fadeAnim.setValue(0); return; }
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { fadeAnim.stopAnimation(); };
  }, [isActive]);

  return (
    <Animated.View style={[vis.duaWrap, { opacity: fadeAnim }]}>
      <TakrirIcon width={42} height={56} />
      <View style={{ height: 20 }} />
      <Text style={vis.duaTitle}>Dear Student,</Text>
      <Text style={vis.duaDua}>May Allah reward you{'\n'}and accept it from you.</Text>
      <View style={vis.duaDivider} />
      <Text style={vis.hadithText}>
        {'"Recite the Quran and do not be mistaken about these connected pages, for Allah will not punish a heart that preserves the Quran."'}
      </Text>
      <Text style={vis.hadithAttr}>Muṣannaf Ibn Abī Shaybah 34732</Text>
    </Animated.View>
  );
}

// ─── Visual 8 (slide 8): Welcome ─────────────────────────────────────────────

function VisualWelcome({ isActive }: VisualProps) {
  const enterAnim  = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const animRef    = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) { animRef.current?.stop(); enterAnim.setValue(0); breathAnim.setValue(1); return; }
    animRef.current = Animated.sequence([
      Animated.timing(enterAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.04, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{ opacity: enterAnim, transform: [{ scale: Animated.multiply(enterAnim.interpolate({ inputRange: [0,1], outputRange: [0.82,1] }), breathAnim) }] }}>
        <TakrirIcon width={80} height={107} />
      </Animated.View>
    </View>
  );
}

// ─── Visual 9 (slide 9): Verse selector — tokens + picker sim ────────────────

const SENTENCE_TOKENS = [
  { type: 'label',         text: 'I am learning surah' },
  { type: 'surahPill',     text: 'Al-Baqarah'          },
  { type: 'label',         text: 'verses'               },
  { type: 'versePillFrom', text: ''                     },
  { type: 'label',         text: 'to'                   },
  { type: 'versePillTo',   text: ''                     },
] as const;

const GRID_NUMS = [1, 2, 3, 4, 5, 6, 7];

function Visual3({ isActive }: VisualProps) {
  const tokenAnims = useRef(SENTENCE_TOKENS.map(() => new Animated.Value(0))).current;
  const gridAnim   = useRef(new Animated.Value(0)).current;
  const staggerRef = useRef<Animated.CompositeAnimation | null>(null);
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [fromVerse,   setFromVerse]   = useState<number | null>(null);
  const [toVerse,     setToVerse]     = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [gridMode,    setGridMode]    = useState<'from' | 'to' | null>(null);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const showGrid = (cb?: () => void) => Animated.timing(gridAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(cb);
  const hideGrid = (cb?: () => void) => Animated.timing(gridAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(cb);
  const at = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timersRef.current.push(t); };

  useEffect(() => {
    if (!isActive) {
      clearTimers(); staggerRef.current?.stop();
      tokenAnims.forEach(a => a.setValue(0)); gridAnim.setValue(0);
      setFromVerse(null); setToVerse(null); setHighlighted(null); setGridMode(null);
      return;
    }
    staggerRef.current = Animated.stagger(90, tokenAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    staggerRef.current.start();

    const runCycle = (delay: number) => {
      at(() => { setGridMode('from'); setHighlighted(1); showGrid(); }, delay);
      at(() => setHighlighted(2), delay + 300);
      at(() => setFromVerse(2), delay + 520);
      at(() => hideGrid(), delay + 780);
      at(() => { setGridMode('to'); setHighlighted(7); showGrid(); }, delay + 1080);
      at(() => setHighlighted(6), delay + 1330);
      at(() => setHighlighted(5), delay + 1580);
      at(() => setToVerse(5), delay + 1800);
      at(() => hideGrid(), delay + 2060);
      at(() => { setFromVerse(null); setToVerse(null); setHighlighted(null); setGridMode(null); runCycle(0); }, delay + 3600);
    };
    runCycle(950);
    return () => { clearTimers(); staggerRef.current?.stop(); };
  }, [isActive]);

  const renderToken = (token: typeof SENTENCE_TOKENS[number], i: number) => {
    const anim = tokenAnims[i];
    const animated = { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [16,0] }) }] };
    if (token.type === 'label') return <Animated.View key={i} style={animated}><Text style={vis.sentenceLabel}>{token.text}</Text></Animated.View>;
    if (token.type === 'surahPill') return <Animated.View key={i} style={[vis.surahPill, animated]}><Text style={vis.pillText}>{token.text}</Text></Animated.View>;
    const active = token.type === 'versePillFrom' ? fromVerse != null : toVerse != null;
    const val    = token.type === 'versePillFrom' ? fromVerse : toVerse;
    return <Animated.View key={i} style={[vis.versePill, active && { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY }, animated]}><Text style={[vis.pillText, active && { color: SURFACE }]}>{val != null ? String(val) : '–'}</Text></Animated.View>;
  };

  return (
    <View style={vis.center}>
      <View style={{ alignItems: 'center' }}>
        <View style={vis.sentenceWrap}>{SENTENCE_TOKENS.map((t, i) => renderToken(t, i))}</View>
        <Animated.View style={[vis.miniGrid, { opacity: gridAnim, transform: [{ translateY: gridAnim.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
          <Text style={vis.miniGridLabel}>{gridMode === 'from' ? 'start verse' : 'end verse'}</Text>
          <View style={vis.miniGridRow}>
            {GRID_NUMS.map(n => (
              <View key={n} style={[vis.gridCell, n === highlighted && vis.gridCellHL]}>
                <Text style={[vis.gridCellText, n === highlighted && vis.gridCellTextHL]}>{n}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Visual 10 (slide 10): Playlist rows ─────────────────────────────────────

const PLAYLIST_ITEMS = [
  { surah: 'Al-Fatiha',  range: 'Verses 1 – 7', active: true  },
  { surah: 'Al-Baqarah', range: 'Verse 255',     active: false },
  { surah: 'Al-Ikhlas',  range: 'Verses 1 – 4',  active: false },
];

function Visual4({ isActive }: VisualProps) {
  const rowAnims = useRef(PLAYLIST_ITEMS.map(() => new Animated.Value(0))).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) { animRef.current?.stop(); rowAnims.forEach(a => a.setValue(0)); return; }
    animRef.current = Animated.stagger(150, rowAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.playlistWrap}>
        {PLAYLIST_ITEMS.map((item, i) => (
          <Animated.View key={i} style={[vis.playlistRow, item.active && vis.playlistRowActive, { opacity: rowAnims[i], transform: [{ translateX: rowAnims[i].interpolate({ inputRange: [0,1], outputRange: [40,0] }) }] }]}>
            <View style={{ flex: 1 }}>
              <Text style={[vis.playlistSurah, item.active && { color: TEXT_PRIMARY }]}>{item.surah}</Text>
              <Text style={vis.playlistRange}>{item.range}</Text>
            </View>
            <View style={[vis.playCircle, item.active && { backgroundColor: APP_PRIMARY }]}>
              <Text style={[vis.playArrow, item.active && { color: SURFACE }]}>{'▶'}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ─── Visuals 11–13 (slides 11–13): Reciters (circle / card / fan) ─────────────

const RECITER_IMAGES = [
  { img: require('../assets/reciters/mujawwad.png'), name: 'Abdul Basit' },
  { img: require('../assets/reciters/sudais.png'),   name: 'Al-Sudais'   },
  { img: require('../assets/reciters/mishary.png'),  name: 'Mishary'     },
  { img: require('../assets/reciters/shuraym.png'),  name: 'Al-Shuraym'  },
];

const WAVEFORMS = [
  [20,12,30,16,24,8, 32,18,14,28,22,34,10,26,20,16,28,12,22,30],
  [8, 30,14,36,10,28,22,34,12,26,32,16,30,8, 24,34,16,28,10,32],
  [10,22,14,30,18,34,20,12,28,24,16,32,18,12,26,20,24,14,22,16],
  [24,10,34,16,28,8, 32,20,14,30,22,12,34,18,26,10,30,24,12,28],
];

const INITIAL_RECITER = 2;
const PHASES          = 4;
const CYCLE_MS        = 2600;

const TILT_CARD_W = 96;
const TILT_CARD_H = 128;
const CARD_OFFSETS = [
  { x: -118, y:  6, rotate: '-7deg'   },
  { x:  -39, y: -5, rotate: '-2.5deg' },
  { x:   39, y:  5, rotate: '3deg'    },
  { x:  118, y: -6, rotate: '6.5deg'  },
] as const;

function useReciterCycle(isActive: boolean) {
  const avatarAnims = useRef(RECITER_IMAGES.map(() => new Animated.Value(0))).current;
  const waveOpacity = useRef(new Animated.Value(1)).current;
  const phaseAnims  = useRef(Array.from({ length: PHASES }, () => new Animated.Value(0))).current;
  const waveAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const cycleRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef   = useRef(INITIAL_RECITER);
  const [activeReciter, setActiveReciter] = useState(INITIAL_RECITER);

  useEffect(() => {
    if (!isActive) {
      if (cycleRef.current) clearInterval(cycleRef.current);
      waveAnimRef.current?.stop();
      avatarAnims.forEach(a => a.setValue(0));
      phaseAnims.forEach(a => a.setValue(0));
      waveOpacity.setValue(1);
      activeRef.current = INITIAL_RECITER;
      setActiveReciter(INITIAL_RECITER);
      return;
    }
    const entrance = Animated.stagger(100, avatarAnims.map((a, i) =>
      Animated.timing(a, { toValue: i === INITIAL_RECITER ? 1.0 : 0.6, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    entrance.start();

    const makePhaseLoop = (anim: Animated.Value, delay: number) =>
      Animated.sequence([Animated.delay(delay), Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1,    duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.15, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]))]);
    waveAnimRef.current = Animated.parallel(phaseAnims.map((a, i) => makePhaseLoop(a, i * 200)));
    waveAnimRef.current.start();

    cycleRef.current = setInterval(() => {
      const cur  = activeRef.current;
      const next = (cur + 1) % RECITER_IMAGES.length;
      Animated.parallel([
        Animated.timing(avatarAnims[cur],  { toValue: 0.6, duration: 400, useNativeDriver: true }),
        Animated.timing(avatarAnims[next], { toValue: 1.0, duration: 400, useNativeDriver: true }),
      ]).start();
      Animated.timing(waveOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setActiveReciter(next);
        activeRef.current = next;
        Animated.timing(waveOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, CYCLE_MS);

    return () => { if (cycleRef.current) clearInterval(cycleRef.current); entrance.stop(); waveAnimRef.current?.stop(); };
  }, [isActive]);

  return { avatarAnims, waveOpacity, phaseAnims, activeReciter };
}

function WaveformBar({ waveH, phaseAnims, waveOpacity }: { waveH: number[]; phaseAnims: Animated.Value[]; waveOpacity: Animated.Value }) {
  return (
    <Animated.View style={[vis.waveformRow, { opacity: waveOpacity }]}>
      {waveH.map((h, i) => (
        <Animated.View key={i} style={[vis.wavebar, { height: h }, i < 9 ? { backgroundColor: APP_PRIMARY } : { backgroundColor: `${APP_PRIMARY}40` }, { transform: [{ scaleY: phaseAnims[i % PHASES].interpolate({ inputRange: [0,1], outputRange: [0.2,1] }) }] }]} />
      ))}
    </Animated.View>
  );
}

function Visual5({ isActive }: VisualProps) {
  const { avatarAnims, waveOpacity, phaseAnims, activeReciter } = useReciterCycle(isActive);
  return (
    <View style={vis.center}>
      <View style={vis.reciterGrid}>
        {RECITER_IMAGES.map((r, i) => {
          const anim = avatarAnims[i];
          const isActiveR = i === activeReciter;
          return (
            <Animated.View key={i} style={[vis.reciterItem, { opacity: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0,0.5,1] }), transform: [{ scale: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0.78,0.9,1.0] }) }] }]}>
              <View style={[vis.reciterAvatar, isActiveR && vis.reciterAvatarActive]}>
                <Image source={r.img} style={vis.reciterImg} />
              </View>
              <Text style={[vis.reciterName, isActiveR && { color: TEXT_PRIMARY, fontWeight: '600' }]}>{r.name}</Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ height: 28 }} />
      <WaveformBar waveH={WAVEFORMS[activeReciter]} phaseAnims={phaseAnims} waveOpacity={waveOpacity} />
    </View>
  );
}

function Visual5b({ isActive }: VisualProps) {
  const { avatarAnims, waveOpacity, phaseAnims, activeReciter } = useReciterCycle(isActive);
  const cardW = (SW - 64 - 10) / 2;
  const cardH = cardW * 0.68;
  return (
    <View style={vis.center}>
      <View style={vis.cardGrid}>
        {RECITER_IMAGES.map((r, i) => {
          const anim = avatarAnims[i];
          const isActiveR = i === activeReciter;
          return (
            <Animated.View key={i} style={[vis.reciterCard, { width: cardW, height: cardH }, isActiveR && vis.reciterCardActive, { opacity: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0,0.5,1] }), transform: [{ scale: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0.78,0.9,1.0] }) }] }]}>
              <Image source={r.img} style={vis.reciterCardImg} />
              <LinearGradient colors={['transparent','rgba(0,0,0,0.62)']} start={{ x:0,y:0 }} end={{ x:0,y:1 }} style={vis.cardOverlay}>
                <Text style={vis.cardOverlayName}>{r.name}</Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ height: 22 }} />
      <WaveformBar waveH={WAVEFORMS[activeReciter]} phaseAnims={phaseAnims} waveOpacity={waveOpacity} />
    </View>
  );
}

function Visual5c({ isActive }: VisualProps) {
  const { avatarAnims, waveOpacity, phaseAnims, activeReciter } = useReciterCycle(isActive);
  const renderOrder = useMemo(() => {
    const inactive = [0,1,2,3].filter(i => i !== activeReciter);
    return [...inactive, activeReciter];
  }, [activeReciter]);
  const FAN_H       = TILT_CARD_H + 20;
  const cardCenterX = (SW - TILT_CARD_W) / 2;
  return (
    <View style={vis.center}>
      <View style={{ width: SW, height: FAN_H }}>
        {renderOrder.map((i) => {
          const anim = avatarAnims[i];
          const { x, y, rotate } = CARD_OFFSETS[i];
          const isActiveR = i === activeReciter;
          return (
            <Animated.View key={i} style={[vis.tiltCard, { left: cardCenterX + x, top: 10 + y, borderColor: isActiveR ? APP_PRIMARY : 'rgba(255,255,255,0.15)', shadowOpacity: isActiveR ? 0.4 : 0.06, transform: [{ rotate }, { scale: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0.78,0.92,1.0] }) }], opacity: anim.interpolate({ inputRange: [0,0.6,1], outputRange: [0,0.65,1] }) }]}>
              <Image source={RECITER_IMAGES[i].img} style={vis.tiltCardImg} />
              <LinearGradient colors={['transparent','rgba(0,0,0,0.62)']} start={{ x:0,y:0 }} end={{ x:0,y:1 }} style={vis.tiltCardOverlay}>
                <Text style={vis.tiltCardName}>{RECITER_IMAGES[i].name}</Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ height: 28 }} />
      <WaveformBar waveH={WAVEFORMS[activeReciter]} phaseAnims={phaseAnims} waveOpacity={waveOpacity} />
    </View>
  );
}

// ─── Visual 14 (slide 14): Begin ─────────────────────────────────────────────

function Visual6({ isActive }: VisualProps) {
  const enterAnim  = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const animRef    = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) { animRef.current?.stop(); enterAnim.setValue(0); breathAnim.setValue(1); return; }
    animRef.current = Animated.sequence([
      Animated.timing(enterAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.045, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1,     duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{ opacity: enterAnim, transform: [{ scale: Animated.multiply(enterAnim.interpolate({ inputRange: [0,1], outputRange: [0.82,1] }), breathAnim) }] }}>
        <TakrirIcon width={96} height={128} />
      </Animated.View>
    </View>
  );
}

// prettier-ignore
const VISUALS = [
  Visual1, Visual2,
  VisualKnowledge, VisualRingSlide, VisualRingSlide,
  VisualGoals, VisualDua, VisualWelcome,
  Visual3, Visual4, Visual5, Visual5b, Visual5c,
  Visual6,
];

// ─── Visual styles ────────────────────────────────────────────────────────────

const vis = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  arabicWord: { fontSize: 56, color: '#111111', fontWeight: '300', textAlign: 'center' },
  arabicSub:  { fontSize: 13, color: TEXT_SECONDARY, letterSpacing: 3, textTransform: 'uppercase', marginTop: 10, textAlign: 'center' },

  // ── Knowledge picker (slide 3) ─────────────────────────────────────────────
  knowToggleRow:      { flexDirection: 'row', gap: 8 },
  knowToggle:         { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: `${APP_PRIMARY}60`, backgroundColor: 'transparent' },
  knowToggleActive:   { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY },
  knowToggleText:     { fontSize: 14, color: TEXT_SECONDARY, fontWeight: '500' },
  knowToggleTextActive: { color: SURFACE },

  juzGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, justifyContent: 'center' },
  juzCell:        { width: 46, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: `${APP_PRIMARY}12`, borderWidth: 0.5, borderColor: `${APP_PRIMARY}40` },
  juzCellSel:     { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY },
  juzCellText:    { fontSize: 14, fontWeight: '500', color: TEXT_SECONDARY },
  juzCellTextSel: { color: SURFACE, fontWeight: '700' },

  surahPickerWrap: { gap: 16, paddingHorizontal: 24 },
  surahRow:        { gap: 8 },
  surahLabel:      { fontSize: 12, fontWeight: '600', color: APP_PRIMARY, letterSpacing: 0.4, textTransform: 'uppercase' },
  stepperRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: `${APP_PRIMARY}18`, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:     { fontSize: 22, color: APP_PRIMARY, lineHeight: 26 },
  stepValue:       { flex: 1, alignItems: 'center' },
  stepValueNum:    { fontSize: 22, fontWeight: '600', color: TEXT_BODY },
  stepValueName:   { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },

  noneBox:  { alignItems: 'center', paddingHorizontal: 40 },
  noneText: { fontSize: 18, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 28, fontStyle: 'italic' },

  // ── Ring chart (slides 4–5) ───────────────────────────────────────────────
  ringPercent: { fontSize: 32, fontWeight: '700', color: TEXT_BODY, textAlign: 'center' },
  ringLabel:   { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 2 },
  ringMessage: { fontSize: 18, color: TEXT_BODY, textAlign: 'center', lineHeight: 28, paddingHorizontal: 32, fontWeight: '500' },

  // ── Goals (slide 6) ───────────────────────────────────────────────────────
  goalsList: { gap: 12, width: SW - 64 },
  goalCard:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: `${APP_PRIMARY}50`, backgroundColor: `${APP_PRIMARY}08` },
  goalCardSel:    { backgroundColor: `${APP_PRIMARY}18`, borderColor: APP_PRIMARY },
  goalLabel:      { flex: 1, fontSize: 16, color: TEXT_BODY, fontWeight: '500' },
  goalLabelSel:   { color: TEXT_PRIMARY },
  goalCheck:      { width: 24, height: 24, borderRadius: 12, backgroundColor: APP_PRIMARY, alignItems: 'center', justifyContent: 'center' },
  goalCheckText:  { fontSize: 13, color: SURFACE, fontWeight: '700' },

  // ── Dua (slide 7) ─────────────────────────────────────────────────────────
  duaWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  duaTitle:    { fontSize: 22, fontWeight: '600', color: TEXT_PRIMARY, marginTop: 16, textAlign: 'center' },
  duaDua:      { fontSize: 16, color: TEXT_BODY, textAlign: 'center', lineHeight: 26, marginTop: 8, fontStyle: 'italic' },
  duaDivider:  { height: 1, backgroundColor: `${APP_PRIMARY}30`, alignSelf: 'stretch', marginVertical: 20 },
  hadithText:  { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  hadithAttr:  { fontSize: 11, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 8, opacity: 0.7 },

  // ── Sentence builder (slide 9) ────────────────────────────────────────────
  sentenceWrap:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingHorizontal: 32, justifyContent: 'center' },
  sentenceLabel: { fontSize: 20, fontWeight: '500', color: TEXT_BODY },
  surahPill:     { backgroundColor: SURFACE_FROSTED, borderWidth: 0.5, borderColor: APP_PRIMARY, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  versePill:     { backgroundColor: SURFACE_FROSTED, borderWidth: 0.5, borderColor: APP_PRIMARY, borderRadius: 28, minWidth: 54, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  pillText:      { fontSize: 20, color: TEXT_BODY, textAlign: 'center' },
  miniGrid:       { marginTop: 20, backgroundColor: SURFACE_SCREEN, borderRadius: 16, borderWidth: 1, borderColor: `${APP_PRIMARY}50`, paddingVertical: 10, paddingHorizontal: 12, shadowColor: APP_PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, alignItems: 'center' },
  miniGridLabel:  { fontSize: 11, fontWeight: '500', color: APP_PRIMARY, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  miniGridRow:    { flexDirection: 'row', gap: 6 },
  gridCell:       { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  gridCellHL:     { backgroundColor: APP_PRIMARY },
  gridCellText:   { fontSize: 14, fontWeight: '400', color: TEXT_MUTED },
  gridCellTextHL: { color: SURFACE, fontWeight: '700' },

  // ── Playlist (slide 10) ───────────────────────────────────────────────────
  playlistWrap:      { width: SW - 64, gap: 10 },
  playlistRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE_FROSTED, borderRadius: 16, borderWidth: 0.5, borderColor: `${APP_PRIMARY}40`, paddingVertical: 14, paddingHorizontal: 16 },
  playlistRowActive: { borderColor: APP_PRIMARY, backgroundColor: `${APP_PRIMARY}08` },
  playlistSurah:     { fontSize: 16, fontWeight: '500', color: TEXT_SECONDARY },
  playlistRange:     { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  playCircle:        { width: 32, height: 32, borderRadius: 16, backgroundColor: `${APP_PRIMARY}20`, alignItems: 'center', justifyContent: 'center' },
  playArrow:         { fontSize: 11, color: APP_PRIMARY, marginLeft: 2 },

  // ── Reciters circles (slide 11) ───────────────────────────────────────────
  reciterGrid:        { flexDirection: 'row', gap: 24 },
  reciterItem:        { alignItems: 'center', gap: 8 },
  reciterAvatar:      { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  reciterAvatarActive:{ borderColor: APP_PRIMARY },
  reciterImg:         { width: '100%', height: '100%' },
  reciterName:        { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' },

  // ── Reciter cards 2×2 (slide 12) ─────────────────────────────────────────
  cardGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 16 },
  reciterCard:     { borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  reciterCardActive: { borderColor: APP_PRIMARY, shadowColor: APP_PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  reciterCardImg:  { width: '100%', height: '100%' },
  cardOverlay:     { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 22, paddingBottom: 8, paddingHorizontal: 10 },
  cardOverlayName: { fontSize: 12, fontWeight: '600', color: '#ffffff' },

  // ── Tilted fan cards (slide 13) ───────────────────────────────────────────
  tiltCard:        { position: 'absolute', width: TILT_CARD_W, height: TILT_CARD_H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8 },
  tiltCardImg:     { width: '100%', height: '100%' },
  tiltCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 30, paddingBottom: 12, paddingHorizontal: 16 },
  tiltCardName:    { fontSize: 15, fontWeight: '600', color: '#ffffff' },

  // ── Waveform (all reciter slides) ─────────────────────────────────────────
  waveformRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 40 },
  wavebar:     { width: 3, borderRadius: 2 },
});

// ─── Background presets ───────────────────────────────────────────────────────

type BgPreset = { id: string; label: string; swatch: string; containerBg: string };

const BG_PRESETS: BgPreset[] = [
  { id: 'sand',      label: 'Sand',      swatch: '#f5ece3', containerBg: '#f5ece3' },
  { id: 'parchment', label: 'Parchment', swatch: '#f0ead8', containerBg: '#e4cebc' },
  { id: 'dusk',      label: 'Dusk',      swatch: '#e2c49e', containerBg: '#f8ede2' },
  { id: 'ochre',     label: 'Ochre',     swatch: '#e8ce68', containerBg: '#faf4e4' },
  { id: 'dawn',      label: 'Dawn',      swatch: '#e8b8ac', containerBg: '#fde8de' },
  { id: 'mist',      label: 'Mist',      swatch: '#c0b4b0', containerBg: '#d4c8bc' },
];

function BgOverlay({ id }: { id: string }) {
  if (id === 'parchment') return (
    <Svg style={StyleSheet.absoluteFill as any} height="100%" width="100%">
      <Defs><SvgRadial id="bg_p" cx="50%" cy="35%" r="65%"><Stop offset="0%" stopColor="#fdfaf3" /><Stop offset="100%" stopColor="#e4cebc" /></SvgRadial></Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg_p)" />
    </Svg>
  );
  if (id === 'dusk') return <LinearGradient colors={['#f8ede2','#dfc8a8']} start={{ x:0,y:0 }} end={{ x:0,y:1 }} style={StyleSheet.absoluteFill} />;
  if (id === 'ochre') return (
    <>
      <LinearGradient colors={['rgba(245,200,64,0.22)','transparent']} start={{ x:1,y:0 }} end={{ x:0.1,y:0.55 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent','rgba(232,148,40,0.18)']} start={{ x:0.1,y:0.45 }} end={{ x:1,y:1 }} style={StyleSheet.absoluteFill} />
    </>
  );
  if (id === 'dawn') return <LinearGradient colors={['#fde8de','#f5ddd5','#edd0c8']} locations={[0,0.5,1]} start={{ x:0,y:0 }} end={{ x:0,y:1 }} style={StyleSheet.absoluteFill} />;
  if (id === 'mist') return (
    <Svg style={StyleSheet.absoluteFill as any} height="100%" width="100%">
      <Defs><SvgRadial id="bg_m" cx="50%" cy="50%" r="70%"><Stop offset="0%" stopColor="#f5f0ec" /><Stop offset="100%" stopColor="#d4c8bc" /></SvgRadial></Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg_m)" />
    </Svg>
  );
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { modal } = useLocalSearchParams<{ modal?: string }>();
  const isModal   = modal === 'true';
  const setGuest  = useAuthStore((s) => s.setGuest);

  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  // Personalisation state
  const [knowledgeMode, setKnowledgeMode] = useState<'juz' | 'surah' | 'none'>('juz');
  const [selectedJuz,   setSelectedJuz]   = useState<number[]>([]);
  const [surahFrom,     setSurahFrom]     = useState(78);
  const [surahTo,       setSurahTo]       = useState(114);
  const [percentKnown,  setPercentKnown]  = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleKnowledgeChange = useCallback((
    mode: 'juz' | 'surah' | 'none',
    juz: number[],
    from: number,
    to: number,
  ) => {
    setKnowledgeMode(mode);
    setSelectedJuz(juz);
    setSurahFrom(from);
    setSurahTo(to);
    setPercentKnown(calcPercentKnown(mode, juz, from, to));
  }, []);

  // Background picker state
  const [bgId, setBgId]              = useState('sand');
  const [pickerOpen, setPickerOpen]  = useState(false);
  const pickerOpenRef = useRef(false);
  const pickerAnim    = useRef(new Animated.Value(0)).current;
  const activeBg = BG_PRESETS.find(p => p.id === bgId) ?? BG_PRESETS[0];

  const togglePicker = useCallback(() => {
    const opening = !pickerOpenRef.current;
    pickerOpenRef.current = opening;
    setPickerOpen(opening);
    Animated.timing(pickerAnim, { toValue: opening ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const selectBg = useCallback((id: string) => {
    setBgId(id);
    pickerOpenRef.current = false;
    setPickerOpen(false);
    Animated.timing(pickerAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }, []);

  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  const f400 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_400Regular'  } : {};
  const f600 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_600SemiBold' } : {};
  const f700 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_700Bold'     } : {};

  const isLast = currentIndex === SLIDES.length - 1;
  const topPad = insets.top;
  const slideH = SH - topPad - BOTTOM_BAR_H - insets.bottom;
  const visualH = slideH * 0.65;
  const textH   = slideH * 0.35;

  const markSeen = () => SecureStore.setItemAsync(ONBOARDING_KEY, 'true').catch(() => null);

  const handleNext    = () => { const n = currentIndex + 1; listRef.current?.scrollToIndex({ index: n, animated: true }); setCurrentIndex(n); };
  const handleSignIn  = async () => { await markSeen(); router.replace('/'); };
  const handleGuest   = async () => { await markSeen(); setGuest(); router.replace('/home'); };
  const handleDone    = async () => { await markSeen(); router.back(); };

  const onMomentumScrollEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setCurrentIndex(idx);
    pickerOpenRef.current = false;
    setPickerOpen(false);
    pickerAnim.setValue(0);
  }, []);

  const flatListExtraData = useMemo(() => ({
    currentIndex, knowledgeMode, selectedJuz, surahFrom, surahTo, percentKnown, selectedGoals,
  }), [currentIndex, knowledgeMode, selectedJuz, surahFrom, surahTo, percentKnown, selectedGoals]);

  const renderItem = ({ item, index }: { item: Slide; index: number }) => {
    const VisualComp = VISUALS[index] as any;
    const isActive   = currentIndex === index;

    const extraProps: Record<string, unknown> = {};
    switch (item.id) {
      case '3': extraProps.mode = knowledgeMode; extraProps.selectedJuz = selectedJuz; extraProps.surahFrom = surahFrom; extraProps.surahTo = surahTo; extraProps.onChange = handleKnowledgeChange; break;
      case '4': extraProps.percent = percentKnown; extraProps.shouldAnimate = true;  break;
      case '5': extraProps.percent = percentKnown; extraProps.shouldAnimate = false; break;
      case '6': extraProps.selected = selectedGoals; extraProps.onChange = setSelectedGoals; break;
    }

    return (
      <View style={{ width: SW, height: slideH }}>
        <View style={{ height: visualH }}>
          <VisualComp isActive={isActive} {...extraProps} />
        </View>
        <View style={{ height: textH, paddingHorizontal: 24, paddingTop: 16 }}>
          {item.headline ? <Text style={[styles.headline, f700]}>{item.headline}</Text> : null}
          {item.body     ? <Text style={[styles.body, f400]}>{item.body}</Text>         : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: activeBg.containerBg }]}>
      <BgOverlay id={bgId} />

      {/* Background picker */}
      <View style={[styles.bgPickerWrap, { top: insets.top + 12 }]}>
        <TouchableOpacity style={[styles.bgPickerTrigger, { backgroundColor: activeBg.swatch }]} onPress={togglePicker} hitSlop={10} activeOpacity={0.8} />
        <Animated.View pointerEvents={pickerOpen ? 'auto' : 'none'} style={[styles.bgPickerPanel, { opacity: pickerAnim, transform: [{ translateY: pickerAnim.interpolate({ inputRange: [0,1], outputRange: [-6,0] }) }] }]}>
          {BG_PRESETS.map(p => (
            <TouchableOpacity key={p.id} onPress={() => selectBg(p.id)} hitSlop={4} activeOpacity={0.75}>
              <View style={[styles.bgSwatch, { backgroundColor: p.swatch }, p.id === bgId && styles.bgSwatchActive]} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {isModal && (
        <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
        style={{ height: slideH }}
        extraData={flatListExtraData}
      />

      <View style={[styles.bottomBar, { height: BOTTOM_BAR_H + insets.bottom, paddingBottom: insets.bottom }]}>
        {isLast ? (
          isModal ? (
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={[styles.doneBtnText, f600]}>Done</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.finalCtaWrap}>
              <TouchableOpacity onPress={handleSignIn} hitSlop={10} activeOpacity={0.7}><Text style={[styles.signInText, f600]}>Sign in</Text></TouchableOpacity>
              <View style={{ height: 8 }} />
              <TouchableOpacity onPress={handleGuest} hitSlop={10} activeOpacity={0.7}><Text style={[styles.guestText, f400]}>Continue as guest</Text></TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.navRow}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]} />)}
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  bgPickerWrap:    { position: 'absolute', left: 16, zIndex: 10, alignItems: 'flex-start' },
  bgPickerTrigger: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.14)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
  bgPickerPanel:   { marginTop: 8, flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  bgSwatch:        { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  bgSwatchActive:  { borderWidth: 2.5, borderColor: '#555555' },

  closeBtn:     { position: 'absolute', right: 20, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#333333' },

  headline: { fontSize: 28, fontWeight: '700', color: '#111111', lineHeight: 36, marginBottom: 10 },
  body:      { fontSize: 15, color: TEXT_SECONDARY, lineHeight: 22 },

  bottomBar: { justifyContent: 'center', paddingHorizontal: 24 },
  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dotsRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { height: 8, borderRadius: 4 },
  dotActive:   { width: 24, backgroundColor: '#111111' },
  dotInactive: { width: 8,  backgroundColor: '#aaaaaa' },
  arrowBtn:  { width: 60, height: 48, borderRadius: 24, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 22, color: '#ffffff' },

  finalCtaWrap: { alignItems: 'center' },
  signInText:   { fontSize: 18, fontWeight: '600', color: '#222222', textDecorationLine: 'underline' },
  guestText:    { fontSize: 16, color: '#222222', textDecorationLine: 'underline' },
  doneBtn:      { alignSelf: 'center', paddingHorizontal: 48, paddingVertical: 14, backgroundColor: '#111111', borderRadius: 28 },
  doneBtnText:  { fontSize: 16, color: '#ffffff' },
});
