import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
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

// ─── Visual components ────────────────────────────────────────────────────────

function Visual1() {
  return (
    <View style={vis.center}>
      <TakrirIcon width={72} height={96} />
      <View style={{ height: 28 }} />
      <Text style={vis.arabicWord}>تكرير</Text>
      <Text style={vis.arabicSub}>Repetition</Text>
    </View>
  );
}

function Visual2() {
  const SIZE = 200;
  const rings = [
    { size: SIZE, opacity: 0.1 },
    { size: 150, opacity: 0.18 },
    { size: 100, opacity: 0.28 },
  ];
  return (
    <View style={vis.center}>
      <View style={{ width: SIZE, height: SIZE }}>
        {rings.map(({ size, opacity }, i) => {
          const offset = (SIZE - size) / 2;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: offset,
                left: offset,
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: APP_PRIMARY,
                opacity,
              }}
            />
          );
        })}
        <View style={{ position: 'absolute', top: (SIZE - 48) / 2, left: (SIZE - 36) / 2 }}>
          <TakrirIcon width={36} height={48} />
        </View>
      </View>
    </View>
  );
}

function Visual3() {
  return (
    <View style={vis.center}>
      <View style={vis.sentenceWrap}>
        <Text style={vis.sentenceLabel}>I am learning surah</Text>
        <View style={vis.surahPill}>
          <Text style={vis.pillText}>Al-Baqarah</Text>
        </View>
        <Text style={vis.sentenceLabel}>verses</Text>
        <View style={vis.versePill}>
          <Text style={vis.pillText}>2</Text>
        </View>
        <Text style={vis.sentenceLabel}>to</Text>
        <View style={[vis.versePill, { backgroundColor: APP_PRIMARY, borderColor: APP_PRIMARY }]}>
          <Text style={[vis.pillText, { color: SURFACE }]}>5</Text>
        </View>
      </View>
    </View>
  );
}

const PLAYLIST_ITEMS = [
  { surah: 'Al-Fatiha', range: 'Verses 1 – 7', active: true },
  { surah: 'Al-Baqarah', range: 'Verse 255', active: false },
  { surah: 'Al-Ikhlas', range: 'Verses 1 – 4', active: false },
];

function Visual4() {
  return (
    <View style={vis.center}>
      <View style={vis.playlistWrap}>
        {PLAYLIST_ITEMS.map((item, i) => (
          <View key={i} style={[vis.playlistRow, item.active && vis.playlistRowActive]}>
            <View style={{ flex: 1 }}>
              <Text style={[vis.playlistSurah, item.active && { color: TEXT_PRIMARY }]}>
                {item.surah}
              </Text>
              <Text style={vis.playlistRange}>{item.range}</Text>
            </View>
            <View style={[vis.playCircle, item.active && { backgroundColor: APP_PRIMARY }]}>
              <Text style={[vis.playArrow, item.active && { color: SURFACE }]}>{'▶'}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const RECITER_IMAGES = [
  { img: require('../assets/reciters/mujawwad.png'), name: 'Abdul Basit', active: false },
  { img: require('../assets/reciters/sudais.png'),   name: 'Al-Sudais',   active: false },
  { img: require('../assets/reciters/mishary.png'),  name: 'Mishary',     active: true  },
  { img: require('../assets/reciters/shuraym.png'),  name: 'Al-Shuraym',  active: false },
];

const WAVE_H = [10, 22, 14, 30, 18, 34, 20, 12, 28, 24, 16, 32, 18, 12, 26, 20, 24, 14, 22, 16];

function Visual5() {
  return (
    <View style={vis.center}>
      <View style={vis.reciterGrid}>
        {RECITER_IMAGES.map((r, i) => (
          <View key={i} style={vis.reciterItem}>
            <View style={[vis.reciterAvatar, r.active && vis.reciterAvatarActive]}>
              <Image source={r.img} style={vis.reciterImg} />
            </View>
            <Text style={[vis.reciterName, r.active && { color: TEXT_PRIMARY, fontWeight: '600' }]}>
              {r.name}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ height: 28 }} />
      <View style={vis.waveformRow}>
        {WAVE_H.map((h, i) => (
          <View
            key={i}
            style={[
              vis.wavebar,
              { height: h },
              i < 9 ? { backgroundColor: APP_PRIMARY } : { backgroundColor: `${APP_PRIMARY}40` },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function Visual6() {
  return (
    <View style={vis.center}>
      <TakrirIcon width={88} height={117} />
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
  },
  arabicSub: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 10,
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
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { modal } = useLocalSearchParams<{ modal?: string }>();
  const isModal  = modal === 'true';
  const setGuest = useAuthStore((s) => s.setGuest);

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
          <VisualComp />
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

  // Bottom bar
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

  // Final slide CTAs
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

  // Modal done button
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
