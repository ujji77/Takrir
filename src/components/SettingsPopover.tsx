import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecitations } from '../hooks/useRecitations';
import {
  useSettingsStore,
  QURAN_FONTS,
  FONT_SCALES,
  PLAYBACK_RATES,
  SUPPORTED_RECITATION_IDS,
  type QuranFont,
  type FontScale,
} from '../store/settings';
import {
  APP_PRIMARY,
  APP_PRIMARY_ACTIVE,
  SURFACE,
  OVERLAY,
  BORDER,
  HANDLE,
  TEXT_BODY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_PLACEHOLDER,
} from '../theme';

const FONT_LABELS: Record<QuranFont, string> = {
  text_uthmani: 'Uthmani',
  text_indopak: 'Indo-Pak',
};

function cycleNext<T>(arr: readonly T[], current: T): T {
  const idx = arr.indexOf(current);
  return arr[(idx + 1) % arr.length];
}

interface SettingRowProps {
  label: string;
  value: string;
  onPress: () => void;
}

function SettingRow({ label, value, onPress }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        <Text style={styles.rowValueText}>{value}</Text>
        <Text style={styles.rowChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsPopover({ visible, onClose }: Props) {
  const [showReciterList, setShowReciterList] = useState(false);
  const { data: recitations } = useRecitations();

  const recitationId = useSettingsStore((s) => s.recitationId);
  const quranFont = useSettingsStore((s) => s.quranFont);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const playbackRate = useSettingsStore((s) => s.playbackRate);
  const enableAutoScrolling = useSettingsStore((s) => s.enableAutoScrolling);
  const showArabic = useSettingsStore((s) => s.showArabic);
  const showTranslation = useSettingsStore((s) => s.showTranslation);

  const setRecitation = useSettingsStore((s) => s.setRecitation);
  const setQuranFont = useSettingsStore((s) => s.setQuranFont);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const setPlaybackRate = useSettingsStore((s) => s.setPlaybackRate);
  const setEnableAutoScrolling = useSettingsStore((s) => s.setEnableAutoScrolling);
  const setShowArabic = useSettingsStore((s) => s.setShowArabic);
  const setShowTranslation = useSettingsStore((s) => s.setShowTranslation);

  const currentRecitation = recitations?.find((r) => r.id === recitationId);
  const reciterLabel = currentRecitation
    ? `${currentRecitation.reciter_name}${currentRecitation.style ? ` · ${currentRecitation.style}` : ''}`
    : `ID ${recitationId}`;

  const rateLabel = `${playbackRate}×`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {showReciterList ? (
          <>
            <TouchableOpacity style={styles.backRow} onPress={() => setShowReciterList(false)}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <FlatList
              data={recitations?.filter((r) => (SUPPORTED_RECITATION_IDS as readonly number[]).includes(r.id))}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, item.id === recitationId && styles.rowActive]}
                  onPress={() => {
                    setRecitation(item.id);
                    setShowReciterList(false);
                  }}
                >
                  <Text style={[styles.rowLabel, item.id === recitationId && styles.rowLabelActive]}>
                    {item.reciter_name}
                  </Text>
                  {item.style && (
                    <Text style={styles.rowValueText}>{item.style}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          <>
            <SettingRow
              label="Reciter"
              value={reciterLabel}
              onPress={() => setShowReciterList(true)}
            />
            <SettingRow
              label="Arabic Text"
              value={showArabic ? 'Shown' : 'Hidden'}
              onPress={() => setShowArabic(!showArabic)}
            />
            <SettingRow
              label="Translation"
              value={showTranslation ? 'Shown' : 'Hidden'}
              onPress={() => setShowTranslation(!showTranslation)}
            />
            <SettingRow
              label="Font"
              value={FONT_LABELS[quranFont]}
              onPress={() => setQuranFont(cycleNext(QURAN_FONTS, quranFont))}
            />
            <SettingRow
              label="Text Size"
              value={fontScale}
              onPress={() => setFontScale(cycleNext(FONT_SCALES, fontScale) as FontScale)}
            />
            <SettingRow
              label="Speed"
              value={rateLabel}
              onPress={() => setPlaybackRate(cycleNext(PLAYBACK_RATES, playbackRate as typeof PLAYBACK_RATES[number]))}
            />
            <SettingRow
              label="Auto-Scroll"
              value={enableAutoScrolling ? 'On' : 'Off'}
              onPress={() => setEnableAutoScrolling(!enableAutoScrolling)}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY,
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: HANDLE,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  title: { fontSize: 17, fontWeight: '600' },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 16, color: APP_PRIMARY, fontWeight: '500' },
  backRow: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  backText: { fontSize: 16, color: APP_PRIMARY },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowActive: { backgroundColor: APP_PRIMARY_ACTIVE },
  rowLabel: { fontSize: 16, color: TEXT_BODY },
  rowLabelActive: { fontWeight: '600', color: APP_PRIMARY },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValueText: { fontSize: 15, color: TEXT_SECONDARY },
  rowChevron: { fontSize: 18, color: TEXT_PLACEHOLDER },
});
