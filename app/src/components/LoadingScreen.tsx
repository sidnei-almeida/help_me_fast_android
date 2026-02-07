import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Platform, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '../styles/theme';

const LOGO = require('../../assets/logo.png');
const BACKGROUND = '#F2F2F7';
const GRADIENT_GRAY = '#636E72';
const GRADIENT_ORANGE = '#FF9966';

export function LoadingScreen() {
  const breathe = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 280,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [containerOpacity, textOpacity]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathe, {
            toValue: 1.06,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathe, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [breathe, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            transform: [{ scale: breathe }],
            opacity,
          },
        ]}
      >
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.maskedWrap, { opacity: textOpacity }]}>
        <MaskedView
          maskElement={
            <View style={styles.maskWrap}>
              <Text style={styles.maskText}>Loading</Text>
            </View>
          }
          style={StyleSheet.absoluteFill}
        >
          <LinearGradient
            colors={[GRADIENT_GRAY, GRADIENT_ORANGE, GRADIENT_GRAY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  logoWrap: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  logo: {
    width: 80,
    height: 80,
  },
  maskWrap: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.12 * 15,
    textTransform: 'uppercase',
  },
  maskedWrap: {
    height: 28,
    minWidth: 100,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
