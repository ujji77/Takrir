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
  TEXT_BODY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
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
// Icon scales + fades in, then Arabic text slides up

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
      Animated.timing(iconAnim, {
        toValue: 1, duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1, duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
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
        <TakrirIcon width={72} height={96} />
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
// Concentric rings pulse outward from centre in an infinite ripple

function Visual2({ isActive }: VisualProps) {
  const SIZE       = 200;
  const ringScales = useRef([
    new Animated.Value(1),  // inner
    new Animated.Value(1),  // middle
    new Animated.Value(1),  // outer
  ]).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const animRef     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      ringScales.forEach((s) => s.setValue(1));
      iconOpacity.setValue(0);
      return;
    }

    Animated.timing(iconOpacity, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    const makeRingLoop = (scale: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.1, duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1, duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);

    // Inner → middle → outer ripple (300 ms stagger)
    animRef.current = Animated.parallel([
      makeRingLoop(ringScales[0], 0),
      makeRingLoop(ringScales[1], 300),
      makeRingLoop(ringScales[2], 600),
    ]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  const RING_CONFIGS = [
    { size: 100, opacity: 0.28, scale: ringScales[0] },
    { size: 150, opacity: 0.18, scale: ringScales[1] },
    { size: SIZE, opacity: 0.1,  scale: ringScales[2] },
  ];

  return (
    <View style={vis.center}>
      <View style={{ width: SIZE, height: SIZE }}>
        {RING_CONFIGS.map(({ size, opacity, scale }, i) => {
          const offset = (SIZE - size) / 2;
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                top: offset, left: offset,
                width: size, height: size,
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: APP_PRIMARY,
                opacity,
                transform: [{ scale }],
              }}
            />
          );
        })}
        <Animated.View style={{
          position: 'absolute',
          top: (SIZE - 48) / 2,
          left: (SIZE - 36) / 2,
          opacity: iconOpacity,
        }}>
          <TakrirIcon width={36} height={48} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Visual 3: Verse selector — sentence builder appears token by token ────────

const SENTENCE_TOKENS = [
  { type: 'label', text: 'I am learning surah' },
  { type: 'surahPill', text: 'Al-Baqarah' },
  { type: 'label', text: 'verses' },
  { type: 'versePill', text: '2' },
  { type: 'label', text: 'to' },
  { type: 'versePillActive', text: '5' },
] as const;

function Visual3({ isActive }: VisualProps) {
  const anims   = useRef(SENTENCE_TOKENS.map(() => new Animated.Value(0))).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      anims.forEach((a) => a.setValue(0));
      return;
    }
    animRef.current = Animated.stagger(
      90,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1, duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.sentenceWrap}>
        {SENTENCE_TOKENS.map((token, i) => {
          const anim = anims[i];
          const animated = {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          };
          if (token.type === 'label') {
            return (
              <Animated.Text key={i} style={[vis.sentenceLabel, animated]}>
                {token.text}
              </Animated.Text>
            );
          }
          if (token.type === 'surahPill') {
            return (
              <Animated.View key={i} style={[vis.surahPill, animated]}>
                <Text style={vis.pillText}>{token.text}</Text>
              </Animated.View>
            );
          }
          if (token.type === 'versePillActive') {
            return (
              <Animated.View key={i} style={[vis.versePill, { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY }, animated]}>
                <Text style={[vis.pillText, { color: SURFACE }]}>{token.text}</Text>
              </Animated.View>
            );
          }
          return (
            <Animated.View key={i} style={[vis.versePill, animated]}>
              <Text style={vis.pillText}>{token.text}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Visual 4: Playlist — rows slide in from right, staggered ─────────────────

const PLAYLIST_ITEMS = [
  { surah: 'Al-Fatiha',   range: 'Verses 1 – 7', active: true  },
  { surah: 'Al-Baqarah',  range: 'Verse 255',     active: false },
  { surah: 'Al-Ikhlas',   range: 'Verses 1 – 4',  active: false },
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
    animRef.current = Animated.stagger(
      150,
      rowAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1, duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.playlistWrap}>
        {PLAYLIST_ITEMS.map((item, i) => {
          const anim = rowAnims[i];
          return (
            <Animated.View
              key={i}
              style={[
                vis.playlistRow,
                item.active && vis.playlistRowActive,
                {
                  opacity: anim,
                  transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[vis.playlistSurah, item.active && { color: TEXT_PRIMARY }]}>
                  {item.surah}
                </Text>
                <Text style={vis.playlistRange}>{item.range}</Text>
              </View>
              <View style={[vis.playCircle, item.active && { backgroundColor: APP_PRIMARY }]}>
                <Text style={[vis.playArrow, item.active && { color: SURFACE }]}>{'▶'}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Visual 5: Reciters + live waveform equaliser ─────────────────────────────

const RECITER_IMAGES = [
  { img: require('../assets/reciters/mujawwad.png'), name: 'Abdul Basit', active: false },
  { img: require('../assets/reciters/sudais.png'),   name: 'Al-Sudais',   active: false },
  { img: require('../assets/reciters/mishary.png'),  name: 'Mishary',     active: true  },
  { img: require('../assets/reciters/shuraym.png'),  name: 'Al-Shuraym',  active: false },
];

const WAVE_H   = [10, 22, 14, 30, 18, 34, 20, 12, 28, 24, 16, 32, 18, 12, 26, 20, 24, 14, 22, 16];
const PHASES   = 4;
const PHASE_MS = 200; // ms between phase starts

function Visual5({ isActive }: VisualProps) {
  const avatarAnims = useRef(RECITER_IMAGES.map(() => new Animated.Value(0))).current;
  // 4 phase values drive the waveform bars in groups
  const phaseAnims  = useRef(Array.from({ length: PHASES }, () => new Animated.Value(0))).current;
  const animRef     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      avatarAnims.forEach((a) => a.setValue(0));
      phaseAnims.forEach((a) => a.setValue(0));
      return;
    }

    const avatarEntrance = Animated.stagger(
      100,
      avatarAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1, duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );

    // Waveform: each phase loops with a staggered start delay
    const makePhaseLoop = (anim: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1, duration: 420,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.15, duration: 420,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);

    const waveform = Animated.parallel(
      phaseAnims.map((a, i) => makePhaseLoop(a, i * PHASE_MS)),
    );

    animRef.current = Animated.parallel([avatarEntrance, waveform]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <View style={vis.reciterGrid}>
        {RECITER_IMAGES.map((r, i) => {
          const anim = avatarAnims[i];
          return (
            <Animated.View
              key={i}
              style={[
                vis.reciterItem,
                {
                  opacity: anim,
                  transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) }],
                },
              ]}
            >
              <View style={[vis.reciterAvatar, r.active && vis.reciterAvatarActive]}>
                <Image source={r.img} style={vis.reciterImg} />
              </View>
              <Text style={[vis.reciterName, r.active && { color: TEXT_PRIMARY, fontWeight: '600' }]}>
                {r.name}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ height: 28 }} />
      <View style={vis.waveformRow}>
        {WAVE_H.map((h, i) => (
          <Animated.View
            key={i}
            style={[
              vis.wavebar,
              { height: h },
              i < 9
                ? { backgroundColor: APP_PRIMARY }
                : { backgroundColor: `${APP_PRIMARY}40` },
              {
                transform: [{
                  scaleY: phaseAnims[i % PHASES].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Visual 6: Begin — icon breathes gently ───────────────────────────────────

function Visual6({ isActive }: VisualProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const animRef   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      animRef.current?.stop();
      enterAnim.setValue(0);
      breathAnim.setValue(1);
      return;
    }

    const entrance = Animated.timing(enterAnim, {
      toValue: 1, duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.045, duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1, duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animRef.current = Animated.sequence([entrance, breathe]);
    animRef.current.start();
    return () => { animRef.current?.stop(); };
  }, [isActive]);

  return (
    <View style={vis.center}>
      <Animated.View style={{
        opacity: enterAnim,
        transform: [
          { scale: Animated.multiply(
              enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
              breathAnim,
            )
          },
        ],
      }}>
        <TakrirIcon width={88} height={117} />
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
    fontSize: 52,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  reciterAvatarActive: {
    borderColor: APP_PRIMARY,
    opacity: 1,
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
  const visualH = slideH * 0.56;
  const textH   = slideH * 0.44;

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
        <View style={{ height: textH, paddingHorizontal: 24, paddingTop: 20 }}>
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

      {/* Bottom bar — dots + arrow, or final CTAs */}
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
                <View
                  key={i}
                  style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
                />
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
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 38,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 24,
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
