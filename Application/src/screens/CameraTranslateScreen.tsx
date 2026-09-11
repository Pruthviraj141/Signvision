import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { translateVideoClip } from '../services/apiService';
import HandLandmarkOverlay from '../components/HandLandmarkOverlay';

interface CameraTranslateScreenProps {
  onBack: () => void;
}

export default function CameraTranslateScreen({ onBack }: CameraTranslateScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [webPermissionGranted, setWebPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");

  // Animations
  const recordScale = useRef(new Animated.Value(1)).current;

  // Native refs
  const cameraRef = useRef<CameraView>(null);

  // Web refs
  const videoRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const [webStream, setWebStream] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically request Web camera permission
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facing === "front" ? "user" : "environment" }, 
          audio: false 
        })
          .then((stream) => {
            setWebPermissionGranted(true);
            setWebStream(stream);
          })
          .catch((err) => {
            console.error('Camera access denied on web:', err);
            setErrorMsg('Camera access is required.');
          });

        return () => {
          setWebStream((prevStream: any) => {
            if (prevStream) prevStream.getTracks().forEach((track: any) => track.stop());
            return null;
          });
        };
      } else {
        setErrorMsg('Camera API not supported in this browser.');
      }
    }
  }, [facing]);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current && webStream) {
      videoRef.current.srcObject = webStream;
    }
  }, [webStream, webPermissionGranted]);

  const hasPermission = Platform.OS === 'web' ? webPermissionGranted : permission?.granted;

  if (!permission && Platform.OS !== 'web') {
    return <View style={styles.centerContainer} />;
  }

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.promptText}>Camera permission is required.</Text>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantText}>Grant Permission</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        {errorMsg && <Text style={styles.promptText}>{errorMsg}</Text>}
      </View>
    );
  }

  const toggleCamera = () => {
    if (isRecording || isProcessing) return;
    setFacing(current => current === "front" ? "back" : "front");
  };

  const handlePress = () => {
    if (isProcessing) return;
    if (isRecording) {
      Animated.spring(recordScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      stopRecording();
    } else {
      Animated.spring(recordScale, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
      startRecording();
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setTranslation(null);
    setErrorMsg(null);

    timerRef.current = setTimeout(() => stopRecording(), 7500);

    if (Platform.OS === 'web') {
      if (!webStream) {
        setIsRecording(false);
        setErrorMsg('No camera stream found.');
        return;
      }

      let mimeType = 'video/webm';
      try {
        const MediaRecorder = (window as any).MediaRecorder;
        if (MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

        const mediaRecorder = new MediaRecorder(webStream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        webChunksRef.current = [];

        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) webChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(webChunksRef.current, { type: mimeType });
          processVideo(blob);
        };

        mediaRecorder.start();
      } catch (err: any) {
        setIsRecording(false);
        setErrorMsg("Failed to start MediaRecorder on web.");
      }
    } else {
      if (!cameraRef.current) return;
      try {
        const data = await cameraRef.current.recordAsync({ maxDuration: 8 });
        setIsRecording(false);
        if (data && data.uri) processVideo(data.uri);
      } catch (e: any) {
        setIsRecording(false);
        setErrorMsg("Failed to record native video.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isRecording) return;

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } else {
      if (cameraRef.current) cameraRef.current.stopRecording();
    }
    setIsRecording(false);
  };

  const processVideo = async (videoData: string | Blob) => {
    setIsProcessing(true);
    try {
      const response = await translateVideoClip(videoData);
      setTranslation(response.translation);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to process ISL video.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setTranslation(null);
    setErrorMsg(null);
    setIsProcessing(false);
  }

  const isComplete = translation || errorMsg;

  return (
    <View style={styles.container}>
      {/* 1. Camera Canvas (Bottom Layer) */}
      <View style={styles.cameraContainerPlaceholder}>
        <View style={styles.cameraWrapper}>
          {Platform.OS === 'web' ? (
            <video
              ref={videoRef} autoPlay playsInline muted
              style={StyleSheet.flatten([styles.camera, { objectFit: 'contain' }] as any)}
            />
          ) : (
            <CameraView style={styles.camera} ref={cameraRef} facing={facing} zoom={0} mode="video" />
          )}
        </View>
      </View>

      {/* 2. Visual Overlays (Middle Layer) */}
      <View style={styles.overlay}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onBack}>
            <Text style={styles.closeText}>← Sign {'=>'} English</Text>
          </TouchableOpacity>
          <View style={[styles.statusDot, isRecording && styles.statusDotRecording]} />
        </View>

        {/* Hand Landmark Tracker (Simulated Visual Effect only runs when scanning) */}
        {!isComplete && !isProcessing && (
          <HandLandmarkOverlay isActive={true} />
        )}

        {/* 3. Action Layer (Top Layer) */}
        <View style={styles.contentWrapper}>
          <View style={styles.spacer} />

          <View style={styles.footerControls}>
            {/* If finished translating: Result Card */}
            {isComplete ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultCardLabel}>SIGN {translation && !translation.includes('UNCLEAR') ? 'DETECTED' : 'UNRECOGNIZED'}</Text>

                {translation && !translation.includes('UNCLEAR') ? (
                  <>
                    <Text style={styles.resultCardTranslation}>“{translation}”</Text>
                    <Text style={styles.resultCardSubtitle}>
                      You may be trying to say something like this.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.resultCardTranslation}>Unclear Sign Sequence</Text>
                    <Text style={styles.resultCardSubtitle}>
                      {errorMsg || "We couldn't understand that sign sequence. Try signing again with a little more space and clearer movement."}
                    </Text>
                  </>
                )}

                <TouchableOpacity style={styles.signAgainBtn} onPress={resetState}>
                  <Text style={styles.signAgainText}>Sign Again</Text>
                </TouchableOpacity>
              </View>
            ) : isProcessing ? (
              /* Processing UI */
              <View style={styles.processingUI}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingTitle}>Analyzing your sign...</Text>
                <Text style={styles.processingSubtitle}>Understanding the gesture sequence</Text>
              </View>
            ) : (
              /* Normal Recording UI */
              <View style={styles.recordingUI}>
                <Text style={styles.guideText}>
                  {isRecording ? "Listening sequence..." : "Sign naturally"}
                </Text>

                <View style={styles.recordRow}>
                  <View style={styles.sideButtonFallback} />

                  <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.8}
                    style={styles.recordButtonContainer}
                  >
                    <Animated.View style={[styles.recordOuterRing, isRecording && styles.recordOuterRingActive, { transform: [{ scale: recordScale }] }]}>
                      <View style={[styles.recordInnerCircle, isRecording && { borderRadius: 8, width: 30, height: 30 }]} />
                    </Animated.View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.flipBtn, isRecording && {opacity: 0.5}]} 
                    onPress={toggleCamera} 
                    disabled={isRecording}
                  >
                    <View style={styles.flipBtnCircle}>
                      <Text style={styles.flipBtnText}>FLIP</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.holdText}>{isRecording ? "TAP TO STOP" : "TAP TO SIGN"}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraWrapper: { width: '100%', aspectRatio: Platform.OS === 'web' ? 16/9 : 3/4, overflow: 'hidden', borderRadius: Platform.OS === 'web' ? 0 : 24, backgroundColor: '#000' },
  camera: { flex: 1, width: '100%', height: '100%' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: { flex: 1 }, // Pushes controls to bottom

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 25,
    zIndex: 20,
  },
  closeBtn: {
    backgroundColor: 'rgba(20, 20, 30, 0.65)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  statusDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)'
  },
  statusDotRecording: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },

  footerControls: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    zIndex: 20,
  },

  // State: Recording Normal
  recordingUI: { alignItems: 'center' },
  guideText: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  recordOuterRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  recordOuterRingActive: {
    borderColor: 'rgba(244, 67, 54, 0.8)',
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  recordInnerCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff',
  },
  
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 40, marginBottom: 16 },
  recordButtonContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sideButtonFallback: { width: 48, height: 48 },
  flipBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  flipBtnCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  flipBtnText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  holdText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },

  // State: Processing
  processingUI: {
    backgroundColor: 'rgba(15, 15, 30, 0.85)',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  processingTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  processingSubtitle: { color: '#888', fontSize: 14, marginTop: 8 },

  // State: Result Card
  resultCard: {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultCardLabel: { color: '#4CAF50', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  resultCardTranslation: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  resultCardSubtitle: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  signAgainBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  signAgainText: { color: '#000', fontSize: 16, fontWeight: '700' },

  // Permissions Center
  centerContainer: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center' },
  promptText: { color: '#fff', fontSize: 16, marginBottom: 20 },
  grantBtn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginBottom: 15 },
  grantText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 12 },
  backText: { color: '#888' },
});
