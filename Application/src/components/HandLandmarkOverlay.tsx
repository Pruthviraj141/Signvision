import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface HandLandmarkOverlayProps {
  isActive: boolean;
}

export default function HandLandmarkOverlay({ isActive }: HandLandmarkOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 10, duration: 2000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 150, duration: 2500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      floatAnim.stopAnimation();
      scanAnim.stopAnimation();
      pulseAnim.setValue(0);
      floatAnim.setValue(0);
      scanAnim.setValue(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  const pointPositions = [
    { top: 0, left: 40 }, 
    { top: -20, left: 10 }, 
    { top: -30, left: -20 }, 
    { top: -20, left: -50 }, 
    { top: 0, left: -70 }, 
    { top: 50, left: -10 }, 
    { top: 80, left: 0 }, 
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.trackingBox, { transform: [{ translateY: floatAnim }] }]}>
        
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]} />

        <View style={styles.pointsContainer}>
          {pointPositions.map((pos, i) => (
            <Animated.View
              key={i}
              style={[
                styles.point,
                { transform: [{ translateX: pos.left }, { translateY: pos.top }] },
                { opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }
              ]}
            />
          ))}
          <Animated.View style={[styles.line, { transform: [{ rotate: '45deg' }, { translateY: 20 }] }]} />
          <Animated.View style={[styles.line, { transform: [{ rotate: '-45deg' }, { translateY: 20 }] }]} />
          <Animated.View style={[styles.line, { transform: [{ rotate: '90deg' }, { translateX: -30 }] }]} />
        </View>

        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />

        <Animated.Text style={[styles.trackingText, { opacity: pulseAnim }]}>
          Tracking
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingBox: {
    width: 260,
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
  },
  scanLine: {
    position: 'absolute',
    top: 50,
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  pointsContainer: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  line: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  trackingText: {
    position: 'absolute',
    bottom: -30,
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cornerTopLeft: { position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#4CAF50' },
  cornerTopRight: { position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#4CAF50' },
  cornerBottomLeft: { position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#4CAF50' },
  cornerBottomRight: { position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#4CAF50' },
});
