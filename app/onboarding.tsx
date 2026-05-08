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

// ─── Slide data ───────────────────────────────────────────────────────────────

type Slide = {
  id: string;
  headline: string;
  body: string;
  isFinal: boolean;
};

const SLIDES: Slide[] = [
  {
    id: '1',
    headline: 'What is Takrir?',
    body: 'Takrir (تكرير) is the ancient practice of returning to Quranic verses again and again — until they settle in the heart.',
    isFinal: false,
  },
  {
    id: '2',
    headline: 'Learn the Quran through repetition.',
    body: 'Repeated listening is one of the most powerful paths to memorisation. The heart remembers what the ear revisits.',
    isFinal: false,
  },
  {
    id: '3',
    headline: 'Choose the verses you want to focus on.',
    body: 'Pick any surah and set the exact start and end verse. Work through a single ayah or an entire chapter.',
    isFinal: false,
  },
  {
    id: '4',
    headline: 'Repeat each verse as many times as you need.',
    body: 'Some verses take time to sink in. Set the count, and Takrir handles the rest.',
    isFinal: false,
  },
  {
    id: '5',
    headline: 'Listen and learn on the go.',
    body: 'Build playlists around any portion of the Quran and take them wherever life takes you.',
    isFinal: false,
  },
  {
    id: '6',
    headline: 'Connect your heart with beautiful recitations.',
    body: 'Choose from world-class reciters, each bringing a unique voice to the words of Allah.',
    isFinal: false,
  },
  {
    id: '7',
    headline: 'Your practice starts now.',
    body: 'Pick a surah. Set your verses. Let the repetition do its work.',
    isFinal: true,
  },
];

type VisualProps = { isActive: boolean };

// ─── Visual 1: What is Takrir ─────────────────────────────────────────────────

function Visual1({ isActive }: VisualProps) {
  const iconAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      iconAnim.setValue(0);
      textAnim.setValue(0);
      return;
    }
    animRef.current = Animated.sequence([
      Animated.timing(iconAnim, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{
        opacity: iconAnim,
        transform: [{ scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }],
      }}>
        <TakrirIcon width={108} height={144} />
      </Animated.View>
      <View style={{ height: 20 }} />
      <Animated.View style={{
        opacity: textAnim,
        transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        alignItems: 'center',
      }}>
        <Text style={vis.arabicWord}>تكرير</Text>
        <Text style={vis.arabicSub}>Repetition</Text>
      </Animated.View>
    </View>
  );
}

// ─── Visual 2: Repetition — ripple rings ──────────────────────────────────────

function Visual2({ isActive }: VisualProps) {
  const SIZE       = 290;
  const ringScales = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const animRef     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      ringScales.forEach((s) => s.setValue(1));
      iconOpacity.setValue(0);
      return;
    }
    Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const makeRingLoop = (scale: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1,   duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
      ]);
    animRef.current = Animated.parallel([
      makeRingLoop(ringScales[0], 0),
      makeRingLoop(ringScales[1], 300),
      makeRingLoop(ringScales[2], 600),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  const RING_CONFIGS = [
    { size: 145, opacity: 0.28, scale: ringScales[0] },
    { size: 218, opacity: 0.18, scale: ringScales[1] },
    { size: SIZE, opacity: 0.1,  scale: ringScales[2] },
  ];

  return (
    <View style={vis.center}>
      <View style={{ width: SIZE, height: SIZE }}>
        {RING_CONFIGS.map(({ size, opacity, scale }, i) => {
          const offset = (SIZE - size) / 2;
          return (
            <Animated.View key={i} style={{
              position: 'absolute', top: offset, left: offset,
              width: size, height: size, borderRadius: size / 2,
              borderWidth: 1.5, borderColor: APP_PRIMARY, opacity,
              transform: [{ scale }],
            }} />
          );
        })}
        <Animated.View style={{
          position: 'absolute',
          top: (SIZE - 80) / 2, left: (SIZE - 60) / 2,
          opacity: iconOpacity,
        }}>
          <TakrirIcon width={60} height={80} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Visual 3: Verse selector — tokens appear then verse picker cycles ─────────

const SENTENCE_TOKENS = [
  { type: 'label',           text: 'I am learning surah' },
  { type: 'surahPill',       text: 'Al-Baqarah'          },
  { type: 'label',           text: 'verses'               },
  { type: 'versePillFrom',   text: ''                     },
  { type: 'label',           text: 'to'                   },
  { type: 'versePillTo',     text: ''                     },
] as const;

const GRID_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function Visual3({ isActive }: VisualProps) {
  const tokenAnims = useRef(SENTENCE_TOKENS.map(() => new Animated.Value(0))).current;
  const gridAnim   = useRef(new Animated.Value(0)).current;
  const staggerRef = useRef<Animated.CompositeAnimation | null>(null);
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [fromVerse,  setFromVerse]  = useState<number | null>(null);
  const [toVerse,    setToVerse]    = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [gridMode,   setGridMode]   = useState<'from' | 'to' | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const showGrid  = (cb?: () => void) =>
    Animated.timing(gridAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(cb);
  const hideGrid  = (cb?: () => void) =>
    Animated.timing(gridAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(cb);

  const at = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      staggerRef.current?.stop();
      tokenAnims.forEach((a) => a.setValue(0));
      gridAnim.setValue(0);
      setFromVerse(null);
      setToVerse(null);
      setHighlighted(null);
      setGridMode(null);
      return;
    }

    // Token entrance
    staggerRef.current = Animated.stagger(90, tokenAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    staggerRef.current.start();

    const runCycle = (startDelay: number) => {
      // From-verse selection: highlight 2 → 3
      at(() => { setGridMode('from'); setHighlighted(2); showGrid(); }, startDelay);
      at(() => setHighlighted(3), startDelay + 550);
      at(() => setFromVerse(3),   startDelay + 950);
      at(() => hideGrid(),        startDelay + 1300);

      // To-verse selection: highlight 14 → 13 → 12
      at(() => { setGridMode('to'); setHighlighted(14); showGrid(); }, startDelay + 1900);
      at(() => setHighlighted(13), startDelay + 2450);
      at(() => setHighlighted(12), startDelay + 3000);
      at(() => setToVerse(12),     startDelay + 3400);
      at(() => hideGrid(),         startDelay + 3750);

      // Reset + loop
      at(() => {
        setFromVerse(null);
        setToVerse(null);
        setHighlighted(null);
        setGridMode(null);
        runCycle(0);
      }, startDelay + 5800);
    };

    runCycle(950);
    return () => { clearTimers(); staggerRef.current?.stop(); };
  }, [isActive]);

  const renderToken = (token: typeof SENTENCE_TOKENS[number], i: number) => {
    const anim = tokenAnims[i];
    const animated = {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    };

    if (token.type === 'label') {
      return (
        <Animated.View key={i} style={animated}>
          <Text style={vis.sentenceLabel}>{token.text}</Text>
        </Animated.View>
      );
    }
    if (token.type === 'surahPill') {
      return (
        <Animated.View key={i} style={[vis.surahPill, animated]}>
          <Text style={vis.pillText}>{token.text}</Text>
        </Animated.View>
      );
    }
    if (token.type === 'versePillFrom') {
      const active = fromVerse != null;
      return (
        <Animated.View key={i} style={[vis.versePill, active && { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY }, animated]}>
          <Text style={[vis.pillText, active && { color: SURFACE }]}>{fromVerse != null ? String(fromVerse) : '–'}</Text>
        </Animated.View>
      );
    }
    // versePillTo
    const active = toVerse != null;
    return (
      <Animated.View key={i} style={[vis.versePill, active && { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY }, animated]}>
        <Text style={[vis.pillText, active && { color: SURFACE }]}>{toVerse != null ? String(toVerse) : '–'}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={vis.center}>
      <View style={{ alignItems: 'center' }}>
        <View style={vis.sentenceWrap}>
          {SENTENCE_TOKENS.map((token, i) => renderToken(token, i))}
        </View>

        {/* Mini verse picker grid — always in layout, hidden until active */}
        <Animated.View style={[vis.miniGrid, {
          opacity: gridAnim,
          transform: [{ translateY: gridAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}>
          <Text style={vis.miniGridLabel}>
            {gridMode === 'from' ? 'start verse' : 'end verse'}
          </Text>
          {[GRID_NUMS.slice(0, 7), GRID_NUMS.slice(7)].map((row, ri) => (
            <View key={ri} style={[vis.miniGridRow, ri > 0 && { marginTop: 6 }]}>
              {row.map((n) => (
                <View key={n} style={[vis.gridCell, n === highlighted && vis.gridCellHL]}>
                  <Text style={[vis.gridCellText, n === highlighted && vis.gridCellTextHL]}>{n}</Text>
                </View>
              ))}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Visual 4: Verse repeat — animated repetition counter ────────────────────

const VERSE_ITEMS = [
  { key: '112:1', arabic: 'قُلۡ هُوَ ٱللَّهُ أَحَدٌ',    translation: 'Say: He is Allah, One'              },
  { key: '112:2', arabic: 'ٱللَّهُ ٱلصَّمَدُ',             translation: 'Allah, the Eternal Refuge'          },
  { key: '112:3', arabic: 'لَمۡ يَلِدۡ وَلَمۡ يُولَدۡ',  translation: 'He neither begets nor is born'      },
];

function VisualRepeat({ isActive }: VisualProps) {
  const rowAnims    = useRef(VERSE_ITEMS.map(() => new Animated.Value(0))).current;
  const plusScale   = useRef(new Animated.Value(1)).current;
  const minusScale  = useRef(new Animated.Value(1)).current;
  const countScale  = useRef(new Animated.Value(1)).current;
  const entranceRef = useRef<Animated.CompositeAnimation | null>(null);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [count, setCount] = useState(1);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const at = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timersRef.current.push(t); };

  const tap = (btnScale: Animated.Value, newCount: number) => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.72, duration: 90,  useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 160, useNativeDriver: true }),
    ]).start();
    at(() => {
      setCount(newCount);
      Animated.sequence([
        Animated.timing(countScale, { toValue: 1.4, duration: 90,  useNativeDriver: true }),
        Animated.timing(countScale, { toValue: 1,   duration: 140, useNativeDriver: true }),
      ]).start();
    }, 120);
  };

  useEffect(() => {
    if (!isActive) {
      entranceRef.current?.stop();
      clearTimers();
      rowAnims.forEach((a) => a.setValue(0));
      plusScale.setValue(1);
      minusScale.setValue(1);
      countScale.setValue(1);
      setCount(1);
      return;
    }

    entranceRef.current = Animated.stagger(150, rowAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));

    entranceRef.current.start(() => {
      const runCycle = () => {
        at(() => tap(plusScale,  2), 800);
        at(() => tap(plusScale,  3), 2000);
        at(() => tap(minusScale, 2), 3300);
        at(() => tap(minusScale, 1), 4500);
        at(runCycle, 6200);
      };
      runCycle();
    });

    return () => { entranceRef.current?.stop(); clearTimers(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={{ paddingHorizontal: 24, width: SW }}>
        {VERSE_ITEMS.map((item, i) => {
          const isMid = i === 1;
          return (
            <View key={i}>
              <Animated.View style={[
                vis.plVerseRow,
                {
                  opacity:   rowAnims[i],
                  transform: [{ translateX: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
                },
              ]}>
                <Text style={vis.plVerseNumber}>{item.key}</Text>
                <View style={vis.plVerseContent}>
                  <Text style={vis.plArabicText}>{item.arabic}</Text>
                  <Text style={vis.plTranslationText}>{item.translation}</Text>
                </View>
                <View style={vis.plRepeater}>
                  <Animated.View style={[vis.plRepeaterUp, isMid && { transform: [{ scale: plusScale }] }]}>
                    <Text style={vis.plRepeaterIcon}>+</Text>
                  </Animated.View>
                  <View style={vis.plRepeaterMiddle}>
                    {isMid ? (
                      <Animated.Text style={[vis.plRepeaterCount, { transform: [{ scale: countScale }] }]}>
                        x {count}
                      </Animated.Text>
                    ) : (
                      <Text style={vis.plRepeaterCount}>x 1</Text>
                    )}
                  </View>
                  <Animated.View style={[vis.plRepeaterDown, isMid && { transform: [{ scale: minusScale }] }]}>
                    <Text style={vis.plRepeaterIcon}>−</Text>
                  </Animated.View>
                </View>
              </Animated.View>
              {i < VERSE_ITEMS.length - 1 && <View style={vis.plDivider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Visual 5: Playlist — rows slide in, then cycle active playing item ────────

const PLAYLIST_ITEMS = [
  { surah: 'Al-Fatiha',  range: 'Verses 1 – 7' },
  { surah: 'Al-Baqarah', range: 'Verse 255'     },
  { surah: 'Al-Ikhlas',  range: 'Verses 1 – 4'  },
];

function Visual4({ isActive }: VisualProps) {
  const rowAnims    = useRef(PLAYLIST_ITEMS.map(() => new Animated.Value(0))).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const entranceRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseRef    = useRef<Animated.CompositeAnimation | null>(null);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [playingIndex, setPlayingIndex] = useState(0);
  const [showPause,    setShowPause]    = useState(false);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const at = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timersRef.current.push(t); };

  const startPulse = () => {
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
    pulseRef.current = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.14, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    pulseRef.current.start();
  };

  const runCycle = (index: number) => {
    setPlayingIndex(index);
    setShowPause(false);           // ▶ play icon — item just became active
    at(() => { setShowPause(true);  startPulse(); }, 800);   // ⏸ pause — now "playing"
    at(() =>   setShowPause(false),                  2900);  // ▶ play — about to switch
    at(() =>   runCycle((index + 1) % PLAYLIST_ITEMS.length), 3600); // next item
  };

  useEffect(() => {
    if (!isActive) {
      entranceRef.current?.stop();
      pulseRef.current?.stop();
      clearTimers();
      rowAnims.forEach((a) => a.setValue(0));
      pulseAnim.setValue(1);
      setPlayingIndex(0);
      setShowPause(false);
      return;
    }

    entranceRef.current = Animated.stagger(150, rowAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    entranceRef.current.start(() => runCycle(0));

    return () => {
      entranceRef.current?.stop();
      pulseRef.current?.stop();
      clearTimers();
    };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.playlistWrap}>
        {PLAYLIST_ITEMS.map((item, i) => {
          const isActive = i === playingIndex;
          return (
            <Animated.View key={i} style={[
              vis.playlistRow,
              isActive && vis.playlistRowActive,
              {
                opacity:   rowAnims[i],
                transform: [{ translateX: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={[vis.playlistSurah, isActive && { color: TEXT_PRIMARY }]}>{item.surah}</Text>
                <Text style={vis.playlistRange}>{item.range}</Text>
              </View>
              <Animated.View style={[
                vis.playCircle,
                isActive && { backgroundColor: APP_PRIMARY },
                isActive && showPause && { transform: [{ scale: pulseAnim }] },
              ]}>
                {isActive && showPause ? (
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    <View style={{ width: 3, height: 11, backgroundColor: SURFACE, borderRadius: 1.5 }} />
                    <View style={{ width: 3, height: 11, backgroundColor: SURFACE, borderRadius: 1.5 }} />
                  </View>
                ) : (
                  <Text style={[vis.playArrow, isActive && { color: SURFACE }]}>{'▶'}</Text>
                )}
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const RECITER_IMAGES = [
  { img: require('../assets/reciters/mujawwad.png'), name: 'Abdul Basit' },
  { img: require('../assets/reciters/sudais.png'),   name: 'Al-Sudais'   },
  { img: require('../assets/reciters/mishary.png'),  name: 'Mishary'     },
  { img: require('../assets/reciters/shuraym.png'),  name: 'Al-Shuraym'  },
];

// Different waveform height profiles per reciter
const WAVEFORMS = [
  [20, 12, 30, 16, 24, 8,  32, 18, 14, 28, 22, 34, 10, 26, 20, 16, 28, 12, 22, 30], // Abdul Basit
  [8,  30, 14, 36, 10, 28, 22, 34, 12, 26, 32, 16, 30, 8,  24, 34, 16, 28, 10, 32], // Al-Sudais
  [10, 22, 14, 30, 18, 34, 20, 12, 28, 24, 16, 32, 18, 12, 26, 20, 24, 14, 22, 16], // Mishary
  [24, 10, 34, 16, 28, 8,  32, 20, 14, 30, 22, 12, 34, 18, 26, 10, 30, 24, 12, 28], // Al-Shuraym
];

const INITIAL_RECITER = 2; // Mishary
const PHASES          = 4;
const CYCLE_MS        = 2600;

// Horizontal fanned card layout
const TILT_CARD_W = 116;
const TILT_CARD_H = 155;
// Per-card: horizontal offset from center, vertical jitter, rotation
const CARD_OFFSETS = [
  { x: -118, y:  6, rotate: '-7deg'   },
  { x:  -39, y: -5, rotate: '-2.5deg' },
  { x:   39, y:  5, rotate: '3deg'    },
  { x:  118, y: -6, rotate: '6.5deg'  },
] as const;

// ─── Visual 5: Reciters — horizontal fanned tilted cards + waveform ──────────

function Visual5({ isActive }: VisualProps) {
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
      avatarAnims.forEach((a) => a.setValue(0));
      phaseAnims.forEach((a) => a.setValue(0));
      waveOpacity.setValue(1);
      activeRef.current = INITIAL_RECITER;
      setActiveReciter(INITIAL_RECITER);
      return;
    }

    const entrance = Animated.stagger(120, avatarAnims.map((a, i) =>
      Animated.timing(a, {
        toValue: i === INITIAL_RECITER ? 1.0 : 0.6,
        duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      })
    ));
    entrance.start();

    const makePhaseLoop = (anim: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1,    duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.15, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
      ]);

    waveAnimRef.current = Animated.parallel(phaseAnims.map((a, i) => makePhaseLoop(a, i * 200)));
    waveAnimRef.current.start();

    cycleRef.current = setInterval(() => {
      const current = activeRef.current;
      const next    = (current + 1) % RECITER_IMAGES.length;

      Animated.parallel([
        Animated.timing(avatarAnims[current], { toValue: 0.6, duration: 420, useNativeDriver: true }),
        Animated.timing(avatarAnims[next],    { toValue: 1.0, duration: 420, useNativeDriver: true }),
      ]).start();

      Animated.timing(waveOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setActiveReciter(next);
        activeRef.current = next;
        Animated.timing(waveOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, CYCLE_MS);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      entrance.stop();
      waveAnimRef.current?.stop();
    };
  }, [isActive]);

  // Render active card last so it appears on top (painter's z-order)
  const renderOrder = useMemo(() => {
    const inactive = [0, 1, 2, 3].filter((i) => i !== activeReciter);
    return [...inactive, activeReciter];
  }, [activeReciter]);

  const waveH      = WAVEFORMS[activeReciter];
  const FAN_H      = TILT_CARD_H + 20; // container height with y-jitter headroom
  const cardCenterX = (SW - TILT_CARD_W) / 2; // left edge of a perfectly centered card

  return (
    <View style={vis.center}>
      {/* Horizontal fan: all 4 cards side-by-side with x offsets + tilt */}
      <View style={{ width: SW, height: FAN_H }}>
        {renderOrder.map((i) => {
          const anim = avatarAnims[i];
          const { x, y, rotate } = CARD_OFFSETS[i];
          const isActiveR = i === activeReciter;
          return (
            <Animated.View key={i} style={[
              vis.tiltCard,
              {
                left:          cardCenterX + x,
                top:           10 + y,
                borderColor:   isActiveR ? APP_PRIMARY : 'rgba(255,255,255,0.15)',
                shadowOpacity: isActiveR ? 0.4 : 0.06,
                transform: [
                  { rotate },
                  { scale: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.78, 0.92, 1.0] }) },
                ],
                opacity: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.65, 1] }),
              },
            ]}>
              <Image source={RECITER_IMAGES[i].img} style={vis.tiltCardImg} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.62)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={vis.tiltCardOverlay}
              >
                <Text style={vis.tiltCardName}>{RECITER_IMAGES[i].name}</Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ height: 28 }} />

      {/* Waveform — same crossfade as Visual5 */}
      <Animated.View style={[vis.waveformRow, { opacity: waveOpacity }]}>
        {waveH.map((h, i) => (
          <Animated.View key={i} style={[
            vis.wavebar,
            { height: h },
            i < 9 ? { backgroundColor: APP_PRIMARY } : { backgroundColor: `${APP_PRIMARY}40` },
            { transform: [{ scaleY: phaseAnims[i % PHASES].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] },
          ]} />
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Visual 6: Begin — icon breathes gently ───────────────────────────────────

function Visual6({ isActive }: VisualProps) {
  const enterAnim  = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const animRef    = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      enterAnim.setValue(0);
      breathAnim.setValue(1);
      return;
    }
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1.045, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathAnim, { toValue: 1,     duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animRef.current = Animated.sequence([
      Animated.timing(enterAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      breathe,
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{
        opacity: enterAnim,
        transform: [{
          scale: Animated.multiply(
            enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
            breathAnim,
          ),
        }],
      }}>
        <TakrirIcon width={96} height={128} />
      </Animated.View>
    </View>
  );
}

const VISUALS = [Visual1, Visual2, Visual3, VisualRepeat, Visual4, Visual5, Visual6];

// ─── Visual styles ────────────────────────────────────────────────────────────

const vis = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arabicWord: {
    fontSize: 60,
    color: '#111111',
    fontWeight: '300',
    textAlign: 'center',
  },
  arabicSub: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 10,
    textAlign: 'center',
  },

  // Sentence builder mock (slide 3)
  sentenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  sentenceLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: TEXT_BODY,
  },
  surahPill: {
    backgroundColor: SURFACE_FROSTED,
    borderWidth: 0.5,
    borderColor: APP_PRIMARY,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versePill: {
    backgroundColor: SURFACE_FROSTED,
    borderWidth: 0.5,
    borderColor: APP_PRIMARY,
    borderRadius: 28,
    minWidth: 54,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 20,
    color: TEXT_BODY,
    textAlign: 'center',
  },

  // Mini grid popover (slide 3 verse picker)
  miniGrid: {
    marginTop: 20,
    backgroundColor: SURFACE_SCREEN,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${APP_PRIMARY}50`,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: APP_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  miniGridLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: APP_PRIMARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  miniGridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  gridCellHL: {
    backgroundColor: APP_PRIMARY,
  },
  gridCellText: {
    fontSize: 14,
    fontWeight: '400',
    color: TEXT_MUTED,
  },
  gridCellTextHL: {
    color: SURFACE,
    fontWeight: '700',
  },

  // Playlist mock (slide 4)
  playlistWrap: {
    width: SW - 40,
    gap: 12,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_FROSTED,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: `${APP_PRIMARY}40`,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  playlistRowActive: {
    borderColor: APP_PRIMARY,
    backgroundColor: `${APP_PRIMARY}08`,
  },
  playlistSurah: {
    fontSize: 18,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  playlistRange: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 3,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${APP_PRIMARY}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playArrow: {
    fontSize: 11,
    color: APP_PRIMARY,
    marginLeft: 2,
  },

  // Playlist-matched verse rows (slide 4)
  plVerseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  plVerseNumber: {
    fontSize: 14,
    color: APP_PRIMARY,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 52,
    textAlign: 'center',
  },
  plVerseContent: {
    flex: 1,
    gap: 12,
  },
  plArabicText: {
    fontSize: 18,
    color: TEXT_MUTED,
    textAlign: 'right',
    lineHeight: 36,
  },
  plTranslationText: {
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 22,
  },
  plDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginVertical: 20,
  },
  plRepeater: {
    width: 35,
    alignItems: 'center',
  },
  plRepeaterUp: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  plRepeaterMiddle: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D2D2D2',
    backgroundColor: '#FFFFFFB2',
  },
  plRepeaterDown: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  plRepeaterIcon: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  plRepeaterCount: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Fanned tilted cards (slide 6)
  tiltCard: {
    position: 'absolute',
    width: TILT_CARD_W,
    height: TILT_CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  tiltCardImg: {
    width: '100%',
    height: '100%',
  },
  tiltCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  tiltCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Waveform (slide 5)
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 40,
  },
  wavebar: {
    width: 3,
    borderRadius: 2,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { modal } = useLocalSearchParams<{ modal?: string }>();
  const isModal   = modal === 'true';
  const setGuest  = useAuthStore((s) => s.setGuest);

  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const f400 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_400Regular' }  : {};
  const f600 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_600SemiBold' } : {};
  const f700 = fontsLoaded ? { fontFamily: 'PlusJakartaSans_700Bold' }     : {};

  const isLast  = currentIndex === SLIDES.length - 1;
  const topPad  = insets.top;
  const slideH  = SH - topPad - BOTTOM_BAR_H - insets.bottom;
  const visualH = slideH * 0.75;
  const textH   = slideH * 0.25;

  const markSeen = () =>
    SecureStore.setItemAsync(ONBOARDING_KEY, 'true').catch(() => null);

  const handleNext = () => {
    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const handleGuest = async () => {
    await markSeen();
    setGuest();
    router.replace('/home');
  };

  const handleDone = async () => {
    await markSeen();
    router.back();
  };

  const onMomentumScrollEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setCurrentIndex(idx);
  }, []);

  const renderItem = ({ item, index }: { item: Slide; index: number }) => {
    const VisualComp = VISUALS[index];
    return (
      <View style={{ width: SW, height: slideH }}>
        <View style={{ height: visualH }}>
          <VisualComp isActive={currentIndex === index} />
        </View>
        <View style={{ height: textH, paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={[styles.headline, f700]}>{item.headline}</Text>
          {item.body ? <Text style={[styles.body, f400]}>{item.body}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: '#f5ece3' }]}>
      {isModal && (
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
        style={{ height: slideH }}
      />

      <View style={[styles.bottomBar, { height: BOTTOM_BAR_H + insets.bottom, paddingBottom: insets.bottom }]}>
        <View style={styles.navRow}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
          {isLast ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={isModal ? handleDone : handleGuest}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaBtnText, f600]}>{isModal ? 'Done' : 'Begin'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.arrowBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.arrowText}>{'→'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#333333',
  },

  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 36,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },

  bottomBar: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#111111',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#aaaaaa',
  },
  arrowBtn: {
    width: 60,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 22,
    color: '#ffffff',
  },

  ctaBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 16,
    color: '#ffffff',
  },
});
