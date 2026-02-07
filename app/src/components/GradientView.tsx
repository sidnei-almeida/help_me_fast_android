import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { theme } from '../styles/theme';

const GRADIENT_ID = 'hmf-brand-gradient';

/**
 * Brand gradient: 135deg, #FF9966 → #FF5E62 (same as desktop app).
 * Use as button background or inside MaskedView for gradient text.
 */
export function GradientView({
  style,
  children,
  ...viewProps
}: { style?: ViewStyle; children?: React.ReactNode } & Omit<React.ComponentProps<typeof View>, 'style'>) {
  return (
    <View style={[styles.wrapper, style]} {...viewProps}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient
            id={GRADIENT_ID}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor={theme.colors.gradient.start} />
            <Stop offset="1" stopColor={theme.colors.gradient.end} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${GRADIENT_ID})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
});
