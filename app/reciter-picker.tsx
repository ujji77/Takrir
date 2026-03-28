import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecitations } from '../src/hooks/useRecitations';
import { useSettingsStore } from '../src/store/settings';
import type { Recitation } from '../src/types/api';

export default function ReciterPicker() {
  const router = useRouter();
  const { data: recitations, isLoading } = useRecitations();
  const recitationId = useSettingsStore((s) => s.recitationId);
  const setRecitation = useSettingsStore((s) => s.setRecitation);

  const handleSelect = (recitation: Recitation) => {
    setRecitation(recitation.id);
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={recitations}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            backgroundColor: item.id === recitationId ? '#f0f8ff' : '#fff',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: item.id === recitationId ? 'bold' : 'normal' }}>
            {item.reciter_name}
          </Text>
          {item.style && (
            <Text style={{ fontSize: 13, color: '#666' }}>{item.style}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}
