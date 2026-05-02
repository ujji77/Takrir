import { useRef, useState, useCallback, useEffect } from 'react';
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
    headline: 'Listen and learn on the go.',
    body: 'Build playlists around any portion of the Quran and take them wherever life takes you.',
    isFinal: false,
  },
  {
    id: '5',
    headline: 'Connect your heart with beautiful recitations.',
    body: 'Choose from world-class reciters, each bringing a unique voice to the words of Allah.',
    isFinal: false,
  },
  {
    id: '6',
    headline: 'Begin your recitation.',
    body: '',
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
        <TakrirIcon width={80} height={107} />
      </Animated.View>
      <View style={{ height: 28 }} />
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
  const SIZE       = 220;
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
    { size: 110, opacity: 0.28, scale: ringScales[0] },
    { size: 165, opacity: 0.18, scale: ringScales[1] },
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
          top: (SIZE - 52) / 2, left: (SIZE - 40) / 2,
          opacity: iconOpacity,
        }}>
          <TakrirIcon width={40} height={52} />
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

const GRID_NUMS = [1, 2, 3, 4, 5, 6, 7];

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
      // From-verse selection: highlight 1 → 2
      at(() => { setGridMode('from'); setHighlighted(1); showGrid(); }, startDelay);
      at(() => setHighlighted(2), startDelay + 300);
      at(() => setFromVerse(2),   startDelay + 520);
      at(() => hideGrid(),        startDelay + 780);

      // To-verse selection: highlight 7 → 6 → 5
      at(() => { setGridMode('to'); setHighlighted(7); showGrid(); }, startDelay + 1080);
      at(() => setHighlighted(6), startDelay + 1330);
      at(() => setHighlighted(5), startDelay + 1580);
      at(() => setToVerse(5),     startDelay + 1800);
      at(() => hideGrid(),        startDelay + 2060);

      // Reset + loop
      at(() => {
        setFromVerse(null);
        setToVerse(null);
        setHighlighted(null);
        setGridMode(null);
        runCycle(0);
      }, startDelay + 3600);
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
          <View style={vis.miniGridRow}>
            {GRID_NUMS.map((n) => (
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

// ─── Visual 4: Playlist — rows slide in from right, staggered ─────────────────

const PLAYLIST_ITEMS = [
  { surah: 'Al-Fatiha',  range: 'Verses 1 – 7', active: true  },
  { surah: 'Al-Baqarah', range: 'Verse 255',     active: false },
  { surah: 'Al-Ikhlas',  range: 'Verses 1 – 4',  active: false },
];

function Visual4({ isActive }: VisualProps) {
  const rowAnims = useRef(PLAYLIST_ITEMS.map(() => new Animated.Value(0))).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      rowAnims.forEach((a) => a.setValue(0));
      return;
    }
    animRef.current = Animated.stagger(150, rowAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ));
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.playlistWrap}>
        {PLAYLIST_ITEMS.map((item, i) => (
          <Animated.View key={i} style={[
            vis.playlistRow,
            item.active && vis.playlistRowActive,
            {
              opacity: rowAnims[i],
              transform: [{ translateX: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}>
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

// ─── Visual 5: Reciters cycling + live waveform per reciter ───────────────────

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

function Visual5({ isActive }: VisualProps) {
  // 0 = invisible, 0.6 = entered+inactive, 1.0 = entered+active
  const avatarAnims  = useRef(RECITER_IMAGES.map((_, i) => new Animated.Value(0))).current;
  const waveOpacity  = useRef(new Animated.Value(1)).current;
  const phaseAnims   = useRef(Array.from({ length: PHASES }, () => new Animated.Value(0))).current;
  const waveAnimRef  = useRef<Animated.CompositeAnimation | null>(null);
  const cycleRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef    = useRef(INITIAL_RECITER);

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

    // Avatar entrance: stagger in to inactive (0.6) or active (1.0) level
    const entrance = Animated.stagger(100, avatarAnims.map((a, i) =>
      Animated.timing(a, {
        toValue: i === INITIAL_RECITER ? 1.0 : 0.6,
        duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      })
    ));
    entrance.start();

    // Waveform equaliser: 4-phase scaleY loop
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

    // Cycle through reciters
    cycleRef.current = setInterval(() => {
      const current = activeRef.current;
      const next    = (current + 1) % RECITER_IMAGES.length;

      // Transition avatar highlights
      Animated.parallel([
        Animated.timing(avatarAnims[current], { toValue: 0.6, duration: 400, useNativeDriver: true }),
        Animated.timing(avatarAnims[next],    { toValue: 1.0, duration: 400, useNativeDriver: true }),
      ]).start();

      // Crossfade waveform to new pattern
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

  const waveH = WAVEFORMS[activeReciter];

  return (
    <View style={vis.center}>
      <View style={vis.reciterGrid}>
        {RECITER_IMAGES.map((r, i) => {
          const anim = avatarAnims[i];
          const isActiveR = i === activeReciter;
          return (
            <Animated.View key={i} style={[vis.reciterItem, {
              opacity:   anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.5, 1] }),
              transform: [{ scale: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.78, 0.9, 1.0] }) }],
            }]}>
              <View style={[vis.reciterAvatar, isActiveR && vis.reciterAvatarActive]}>
                <Image source={r.img} style={vis.reciterImg} />
              </View>
              <Text style={[vis.reciterName, isActiveR && { color: TEXT_PRIMARY, fontWeight: '600' }]}>
                {r.name}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ height: 28 }} />
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

const VISUALS = [Visual1, Visual2, Visual3, Visual4, Visual5, Visual6];

// ─── Visual styles ────────────────────────────────────────────────────────────

const vis = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arabicWord: {
    fontSize: 56,
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
    width: SW - 64,
    gap: 10,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_FROSTED,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: `${APP_PRIMARY}40`,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  playlistRowActive: {
    borderColor: APP_PRIMARY,
    backgroundColor: `${APP_PRIMARY}08`,
  },
  playlistSurah: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  playlistRange: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${APP_PRIMARY}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playArrow: {
    fontSize: 11,
    color: APP_PRIMARY,
    marginLeft: 2,
  },

  // Reciters grid (slide 5)
  reciterGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  reciterItem: {
    alignItems: 'center',
    gap: 8,
  },
  reciterAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reciterAvatarActive: {
    borderColor: APP_PRIMARY,
  },
  reciterImg: {
    width: '100%',
    height: '100%',
  },
  reciterName: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: 'center',
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
  // Bigger visual area — text sits lower, closer to the dots
  const visualH = slideH * 0.65;
  const textH   = slideH * 0.35;

  const markSeen = () =>
    SecureStore.setItemAsync(ONBOARDING_KEY, 'true').catch(() => null);

  const handleNext = () => {
    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const handleSignIn = async () => {
    await markSeen();
    router.replace('/');
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
    <View style={[styles.container, { paddingTop: topPad }]}>
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
        {isLast ? (
          isModal ? (
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={[styles.doneBtnText, f600]}>Done</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.finalCtaWrap}>
              <TouchableOpacity onPress={handleSignIn} hitSlop={10} activeOpacity={0.7}>
                <Text style={[styles.signInText, f600]}>Sign in</Text>
              </TouchableOpacity>
              <View style={{ height: 8 }} />
              <TouchableOpacity onPress={handleGuest} hitSlop={10} activeOpacity={0.7}>
                <Text style={[styles.guestText, f400]}>Continue as guest</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.navRow}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]} />
              ))}
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.arrowText}>{'→'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ece3',
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

  finalCtaWrap: {
    alignItems: 'center',
  },
  signInText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    textDecorationLine: 'underline',
  },
  guestText: {
    fontSize: 16,
    color: '#222222',
    textDecorationLine: 'underline',
  },

  doneBtn: {
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingVertical: 14,
    backgroundColor: '#111111',
    borderRadius: 28,
  },
  doneBtnText: {
    fontSize: 16,
    color: '#ffffff',
  },
});
