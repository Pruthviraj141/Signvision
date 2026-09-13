import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarWebView, { AvatarWebViewRef } from '../components/AvatarWebView';
import SearchBar from '../components/SearchBar';
import { lookupWord, getWordCount } from '../services/s3Service';
import CameraTranslateScreen from './CameraTranslateScreen';
import { processSentence, ApiError } from '../services/apiService';
import { Ionicons } from '@expo/vector-icons';
import type { PlaybackStatus, HistoryItem, SignQueueItem } from '../types';

const HISTORY_STORAGE_KEY = '@signvision_history';
const MAX_HISTORY_ITEMS = 20;

const HomeScreen: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Playback queue & sentence processing state
  const [signQueue, setSignQueue] = useState<SignQueueItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [glossTokens, setGlossTokens] = useState<string[]>([]);

  const avatarRef = useRef<AvatarWebViewRef>(null);

  // Refs to access current values in callbacks without stale closures
  const signQueueRef = useRef<SignQueueItem[]>([]);
  const currentQueueIndexRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { signQueueRef.current = signQueue; }, [signQueue]);
  useEffect(() => { currentQueueIndexRef.current = currentQueueIndex; }, [currentQueueIndex]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Handle sign queue playback
  useEffect(() => {
    if (signQueue.length > 0 && currentQueueIndex < signQueue.length && playbackStatus === 'idle' && isAvatarReady) {
      const nextSign = signQueue[currentQueueIndex];
      setCurrentWord(nextSign.word);
      setPlaybackStatus('loading');
      avatarRef.current?.play(nextSign.url, nextSign.word);
    }
  }, [signQueue, currentQueueIndex, playbackStatus, isAvatarReady]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const saveToHistory = async (word: string, found: boolean) => {
    try {
      const newItem: HistoryItem = { word, timestamp: Date.now(), found };
      const filtered = searchHistory.filter(h => h.word !== word);
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      setSearchHistory(updated);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  const resetPlaybackState = () => {
    setSignQueue([]);
    setCurrentQueueIndex(0);
    setGlossTokens([]);
    setErrorMessage(null);
    setSuggestions([]);
  };

  const handleSearch = useCallback(async (input: string) => {
    const query = input.trim();
    if (!query) return;

    resetPlaybackState();

    // Check if input is a single word found in the local sign database
    const words = query.split(/\s+/);
    if (words.length === 1) {
      const result = lookupWord(query);
      if (result.found && result.url) {
        setPlaybackStatus('loading');
        setCurrentWord(result.word);
        saveToHistory(result.word, true);
        avatarRef.current?.play(result.url, result.word);
        return;
      }
    }

    // If multi-word or not found locally, process via backend API
    setIsProcessing(true);
    setPlaybackStatus('loading');

    try {
      const response = await processSentence(query);

      if (!response.success || response.results.length === 0) {
        setPlaybackStatus('error');
        setErrorMessage(response.error || 'Failed to process input');
        saveToHistory(query, false);
        setIsProcessing(false);
        return;
      }

      // Extract gloss tokens and build sign queue
      const result = response.results[0];
      setGlossTokens(result.gloss.gloss);

      // Build queue from signs that were found
      const queue: SignQueueItem[] = result.signs
        .filter(sign => sign.found && sign.s3_url)
        .map(sign => ({
          word: sign.word,
          url: sign.s3_url!,
          matchType: sign.match_type,
        }));

      if (queue.length === 0) {
        setPlaybackStatus('error');
        setErrorMessage('No signs found');
        // Show similar words from first unfound sign, or fallback to local suggestions
        const unfound = result.signs.find(s => !s.found);
        if (unfound?.similar_words && unfound.similar_words.length > 0) {
          setSuggestions(unfound.similar_words);
        } else {
          setSuggestions(lookupWord(query).suggestions || []);
        }
        saveToHistory(query, false);
      } else {
        setSignQueue(queue);
        setCurrentQueueIndex(0);
        setPlaybackStatus('idle'); // Will trigger queue playback via useEffect
        saveToHistory(query, true);
      }
    } catch (error) {
      if (words.length === 1) {
        // Fallback to local lookup result for single words if backend is unavailable
        const localResult = lookupWord(query);
        setPlaybackStatus('error');
        setErrorMessage(`"${query}" not found`);
        setSuggestions(localResult.suggestions || []);
        saveToHistory(query, false);
      } else {
        setPlaybackStatus('error');
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Failed to connect to backend');
        }
        saveToHistory(query, false);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [searchHistory]);

  const handleAvatarReady = useCallback(() => {
    setIsAvatarReady(true);
    setPlaybackStatus('idle');
  }, []);

  const handlePlaying = useCallback((word: string) => {
    console.log('[HomeScreen] handlePlaying:', word);
    setPlaybackStatus('playing');
    setCurrentWord(word);
  }, []);

  const handleFinished = useCallback((word: string) => {
    const queue = signQueueRef.current;
    const currentIndex = currentQueueIndexRef.current;

    console.log('[HomeScreen] handleFinished:', word, 'queue:', queue.length, 'index:', currentIndex);

    if (queue.length > 0) {
      const nextIndex = currentIndex + 1;
      console.log('[HomeScreen] Next index:', nextIndex, 'Queue length:', queue.length);
      if (nextIndex < queue.length) {
        console.log('[HomeScreen] Playing next sign:', queue[nextIndex].word);
        setCurrentQueueIndex(nextIndex);
        setPlaybackStatus('idle');
      } else {
        console.log('[HomeScreen] Queue finished');
        setPlaybackStatus('finished');
        setSignQueue([]);
        setCurrentQueueIndex(0);
      }
    } else {
      setPlaybackStatus('finished');
    }
  }, []);

  const handleError = useCallback((message: string) => {
    setPlaybackStatus('error');
    setErrorMessage(message);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    console.log('[HomeScreen] CWASA raw status:', status);
  }, []);

  const handleStop = useCallback(() => {
    avatarRef.current?.stop();
    setSignQueue([]);
    setCurrentQueueIndex(0);
    setPlaybackStatus('idle');
  }, []);

  const handleHistoryPress = useCallback((item: HistoryItem) => {
    setSearchQuery(item.word);
    handleSearch(item.word);
  }, [handleSearch]);

  const handleSuggestionPress = useCallback((word: string) => {
    setSearchQuery(word);
    handleSearch(word);
  }, [handleSearch]);

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getStatusText = () => {
    if (isProcessing) {
      return 'Processing...';
    }

    if (signQueue.length > 0) {
      return `Playing ${currentQueueIndex + 1}/${signQueue.length}: ${currentWord}`;
    }

    switch (playbackStatus) {
      case 'loading':
        return 'Loading...';
      case 'playing':
        return `Playing: ${currentWord}`;
      case 'finished':
        if (glossTokens.length > 0) {
          return `Finished: ${glossTokens.join(' → ')}`;
        }
        return `Finished: ${currentWord}`;
      case 'error':
        return errorMessage || 'Error';
      default:
        return isAvatarReady ? 'Ready' : 'Initializing...';
    }
  };

  const getStatusColor = () => {
    if (isProcessing) return '#2196F3';
    switch (playbackStatus) {
      case 'playing':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'loading':
        return '#FF9800';
      default:
        return '#888';
    }
  };

  if (isCameraActive) {
    return <CameraTranslateScreen onBack={() => setIsCameraActive(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b111e" />

      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>VaaniMudra</Text>
            {/* <View style={styles.signBadge}>
              <View style={styles.signBadgeDot} />
              <Text style={styles.subtitle}>{getWordCount().toLocaleString()} signs</Text>
            </View> */}
          </View>
          <TouchableOpacity
            style={styles.cameraToggleBtn}
            onPress={() => setIsCameraActive(true)}
            activeOpacity={0.8}
            accessibilityLabel="Sign to English Camera Translate"
            accessibilityRole="button"
          >
            <Ionicons name="videocam-outline" size={17} color="#4ade80" />
            <Text style={styles.cameraToggleText}>Sign → English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GLOSS Preview */}
      {/* {glossTokens.length > 0 && (
        <View style={styles.glossContainer}>
          <Text style={styles.glossLabel}>GLOSS</Text>
          <View style={styles.glossTokens}>
            {glossTokens.map((token, index) => (
              <View
                key={`${token}-${index}`}
                style={[
                  styles.glossToken,
                  index === currentQueueIndex && playbackStatus === 'playing' && styles.glossTokenActive
                ]}
              >
                <Text style={styles.glossTokenText}>{token}</Text>
              </View>
            ))}
          </View>
        </View>
      )} */}

      {/* 3D CWASA Avatar Card */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <AvatarWebView
            ref={avatarRef}
            onReady={handleAvatarReady}
            onPlaying={handlePlaying}
            onFinished={handleFinished}
            onError={handleError}
            onStatusChange={handleStatusChange}
          />
        </View>

        <View style={styles.statusBar}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#38bdf8" style={styles.statusSpinner} />
          ) : (
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          )}
          <Text style={styles.statusText} numberOfLines={1}>{getStatusText()}</Text>
          {(playbackStatus === 'playing' || signQueue.length > 0) && (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
              <Ionicons name="stop" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search & Voice Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
          isLoading={playbackStatus === 'loading' || isProcessing}
          disabled={!isAvatarReady}
          placeholder="Search for a word or sentence..."
        />
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles" size={14} color="#60a5fa" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Did you mean?</Text>
          </View>
          <View style={styles.suggestionChips}>
            {suggestions.map((word) => (
              <TouchableOpacity
                key={word}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(word)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionChipText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Searches */}
      {searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          {/* <View style={styles.historyHeader}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="time-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Recent Searches</Text>
            </View>
            <TouchableOpacity onPress={clearHistory} style={styles.clearBtnRow} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={13} color="#f87171" style={{ marginRight: 4 }} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View> */}

          {/* <FlatList
            data={searchHistory}
            keyExtractor={(item) => `${item.word}-${item.timestamp}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.historyItem,
                  !item.found && styles.historyItemNotFound,
                ]}
                onPress={() => handleHistoryPress(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.historyItemText}>{item.word}</Text>
                {!item.found && (
                  <Ionicons name="alert-circle-outline" size={13} color="#f87171" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.historyList}
          /> */}
        </View>
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b111e',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerTitleRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cameraToggleText: {
    color: '#4ade80',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  avatarContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 8,
    maxHeight: width * 1.15,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111927',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarWrapper: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162238',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusSpinner: {
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 10,
  },
  glossContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  glossLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  glossTokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  glossToken: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  glossTokenActive: {
    backgroundColor: '#22c55e',
    borderColor: '#4ade80',
  },
  glossTokenText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  suggestionChipText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  historyContainer: {
    paddingTop: 6,
    paddingBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  clearBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  clearText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162238',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#243452',
  },
  historyItemNotFound: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  historyItemText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyHistoryText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
