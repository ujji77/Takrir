import TrackPlayer, { Event } from 'react-native-track-player';
import { usePlaylistStore } from '../store/playlist';

// Runs in the background to handle lock screen / Control Center remote commands.
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    usePlaylistStore.setState({ isPlaying: true });
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
    usePlaylistStore.setState({ isPlaying: false });
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    const { currentIndex, items, skipTo } = usePlaylistStore.getState();
    if (currentIndex < items.length - 1) skipTo(currentIndex + 1);
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    const { currentIndex, skipTo } = usePlaylistStore.getState();
    if (currentIndex > 0) skipTo(currentIndex - 1);
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    usePlaylistStore.getState().stopAndReset();
  });
}
