import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  Keyboard,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { autocomplete } from '../services/s3Service';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (word: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search for a sign...',
  isLoading = false,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listenPulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for loading state
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, pulseAnim]);

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(listenPulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(listenPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      listenPulseAnim.setValue(1);
    }
  }, [isListening, listenPulseAnim]);

  // Update suggestions when value changes
  useEffect(() => {
    if (value.length >= 2) {
      const results = autocomplete(value, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const resolveSpeechLocale = useCallback(async () => {
    const fallbackLocale = 'en-US';

    try {
      const localesResult = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      const availableLocales = [
        ...(localesResult.installedLocales || []),
        ...(localesResult.locales || []),
      ];

      const preferredLocales = ['en-US', 'en-IN', 'en-GB'];
      const preferredMatch = preferredLocales.find((locale) => availableLocales.includes(locale));

      return preferredMatch || availableLocales[0] || fallbackLocale;
    } catch (error) {
      console.warn('Failed to fetch supported locales. Falling back to en-US.', error);
      return fallbackLocale;
    }
  }, []);

  const handleSpeechRecognition = useCallback(async () => {
    if (isListening) {
      // Stop listening
      try {
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      } catch (error) {
        console.log('Stop error:', error);
      }
      return;
    }

    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        Alert.alert(
          'Speech Recognition Unavailable',
          'Speech recognition is not available on this device right now.'
        );
        return;
      }

      // Check and request permissions
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to use speech recognition.',
          [{ text: 'OK' }]
        );
        return;
      }

      const locale = await resolveSpeechLocale();
      console.log('Using locale:', locale);

      // Start listening
      setIsListening(true);
      Keyboard.dismiss();

      ExpoSpeechRecognitionModule.start({
        lang: locale || 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        iosTaskHint: 'dictation',
      });
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
    }
  }, [isListening, resolveSpeechLocale]);

  // Handle speech recognition results
  useEffect(() => {
    const subscription = ExpoSpeechRecognitionModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
      const transcript = event.results?.[0]?.transcript?.trim();
      if (!transcript) {
        return;
      }

      // Update input with transcribed text
      onChangeText(transcript);

      // If final result, submit automatically
      if (event.isFinal) {
        setIsListening(false);
        onSubmit(transcript);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onChangeText, onSubmit]);

  // Handle speech recognition end
  useEffect(() => {
    const startSubscription = ExpoSpeechRecognitionModule.addListener('start', () => {
      setIsListening(true);
    });

    const endSubscription = ExpoSpeechRecognitionModule.addListener('end', () => {
      setIsListening(false);
    });

    return () => {
      startSubscription.remove();
      endSubscription.remove();
    };
  }, []);

  // Handle errors
  useEffect(() => {
    const errorSubscription = ExpoSpeechRecognitionModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech error:', event.error, event.message);
        Alert.alert('Speech Error', event.message || `Error: ${event.error}`);
      } else {
        console.log('Speech recognition stopped:', event.error);
      }
    });

    return () => {
      errorSubscription.remove();
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      Keyboard.dismiss();
      setShowSuggestions(false);
      onSubmit(value.trim());
    }
  }, [value, onSubmit]);

  const handleSuggestionPress = useCallback((word: string) => {
    onChangeText(word);
    Keyboard.dismiss();
    setShowSuggestions(false);
    onSubmit(word);
  }, [onChangeText, onSubmit]);

  const handleClear = useCallback(() => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions]);

  const handleBlur = useCallback(() => {
    // Delay hiding to allow suggestion press to register
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          disabled && styles.inputContainerDisabled,
          { opacity: disabled ? 0.6 : pulseAnim }
        ]}
      >
        {/* Search Vector Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
        </View>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          editable={!disabled && !isListening}
          selectTextOnFocus
        />

        {/* Clear Button */}
        {value.length > 0 && !isListening && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear input"
          >
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}

        {/* Send / Search Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!value.trim() || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!value.trim() || disabled}
          accessibilityLabel="Send search"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          {isLoading ? (
            <Ionicons name="ellipsis-horizontal" size={18} color="#ffffff" />
          ) : (
            <Ionicons name="send" size={16} color="#ffffff" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Autocomplete Suggestions */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons name="search-outline" size={15} color="#64748b" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Dedicated Voice / Microphone Action below search bar */}
      <View style={styles.voiceSection}>
        <Animated.View
          style={[
            styles.micPulseRing,
            isListening && {
              transform: [
                {
                  scale: listenPulseAnim.interpolate({
                    inputRange: [0.5, 1],
                    outputRange: [1.25, 1],
                  }),
                },
              ],
              opacity: listenPulseAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.primaryMicButton,
              isListening && styles.primaryMicButtonActive,
              disabled && styles.primaryMicButtonDisabled,
            ]}
            onPress={handleSpeechRecognition}
            disabled={disabled}
            activeOpacity={0.85}
            accessibilityLabel={isListening ? 'Stop listening' : 'Start speech recognition'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isListening ? 'square' : 'mic'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.voicePromptText, isListening && styles.voicePromptTextActive]}>
          {isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162238',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1.5,
    borderColor: '#243452',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputContainerDisabled: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#f8fafc',
    paddingVertical: Platform.OS === 'ios' ? 6 : 6,
  },
  clearButton: {
    padding: 6,
    marginRight: 6,
  },
  sendButton: {
    backgroundColor: '#22c55e',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0,
    elevation: 0,
  },
  voiceSection: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  micPulseRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryMicButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  primaryMicButtonDisabled: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0,
    elevation: 0,
  },
  voicePromptText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  voicePromptTextActive: {
    color: '#f87171',
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#162238',
    borderRadius: 16,
    maxHeight: 200,
    borderWidth: 1.5,
    borderColor: '#243452',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SearchBar;
