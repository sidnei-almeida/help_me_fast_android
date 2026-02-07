import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { METABOLIC_PHASES, getCurrentPhase } from '../utils/metabolicPhases';

const SIZE = 280;
const VB = 280;
const STROKE_W = 22;
const R = VB / 2 - STROKE_W / 2 - 4;
const CX = VB / 2;
const CY = VB / 2;
const ARC_START_DEG = 225;
const ARC_SPAN_DEG = 270;
const ARC_START_RAD = (ARC_START_DEG - 90) * (Math.PI / 180);
const ARC_SPAN_RAD = ARC_SPAN_DEG * (Math.PI / 180);
const PATH_LENGTH = R * ARC_SPAN_RAD;

const TRACK_COLOR = '#E8ECF0';
const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;

const PHASE_DESCRIPTIONS: Record<string, string> = {
  Anabolic: 'Digestion phase. Energy from your last meal.',
  Catabolic: 'Insulin normalizing. Glycogen in use.',
  'Fat Burning': 'Low insulin. Fat burning and focus.',
  Ketosis: 'Ketones, autophagy, mental clarity.',
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg >= 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

export interface MetabolicWheelProps {
  elapsedSeconds: number;
  goalSeconds: number;
  userPhoto: string | null | undefined;
  timerText?: string;
  idleText?: string;
  isActive?: boolean;
  onPhaseDetailsPress?: () => void;
}

export function MetabolicWheel({
  elapsedSeconds,
  goalSeconds,
  userPhoto,
  timerText,
  idleText,
  isActive = false,
  onPhaseDetailsPress,
}: MetabolicWheelProps) {
  const [showStageCard, setShowStageCard] = useState(false);

  const goalHours = goalSeconds / 3600;
  const currentHours = elapsedSeconds / 3600;
  const progress = goalSeconds > 0 ? Math.min(elapsedSeconds / goalSeconds, 1) : 0;
  // Remaining ratio: 1 at start (full arc), 0 at end (empty). Arc drains as time passes.
  const remainingRatio = 1 - progress;

  // Knob position: when active = current progress; when idle = start of arc (0)
  const knobProgress = isActive ? progress : 0;
  const knobAngleDeg = ARC_START_DEG + knobProgress * ARC_SPAN_DEG;
  const knobRad = (knobAngleDeg - 90) * (Math.PI / 180);
  const knobX = CX + R * Math.cos(knobRad);
  const knobY = CY + R * Math.sin(knobRad);

  const trackPath = useMemo(
    () => arcPath(CX, CY, R, ARC_START_DEG, ARC_START_DEG + ARC_SPAN_DEG),
    []
  );

  // When active: gradient shows REMAINING time (full → empty). When inactive: no fill (handled below).
  const progressDashLength = remainingRatio * PATH_LENGTH;
  const progressGapLength = PATH_LENGTH - progressDashLength;

  const dividerHours = useMemo(() => {
    if (goalHours <= 0) return [];
    const hours: number[] = [];
    METABOLIC_PHASES.forEach((p) => {
      if (p.startHours > 0 && p.startHours < goalHours) hours.push(p.startHours);
    });
    return [...new Set(hours)].sort((a, b) => a - b);
  }, [goalHours]);

  const dividerLines = useMemo(() => {
    if (goalHours <= 0 || dividerHours.length === 0) return [];
    const innerR = R - STROKE_W / 2 - 2;
    const outerR = R + STROKE_W / 2 + 2;
    return dividerHours.map((h) => {
      const angleDeg = ARC_START_DEG + (h / goalHours) * ARC_SPAN_DEG;
      const innerP = polar(CX, CY, innerR, angleDeg);
      const outerP = polar(CX, CY, outerR, angleDeg);
      return { x1: innerP.x, y1: innerP.y, x2: outerP.x, y2: outerP.y };
    });
  }, [dividerHours, goalHours]);

  const currentPhase = getCurrentPhase(isActive ? currentHours : 0);
  const phaseDescription = PHASE_DESCRIPTIONS[currentPhase.name] ?? currentPhase.name;

  const handleArcPress = () => setShowStageCard((v) => !v);

  const knobSize = 40;
  const knobLeft = knobX - knobSize / 2;
  const knobTop = knobY - knobSize / 2;

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.wheelContainer} onPress={handleArcPress}>
        <Svg viewBox={`0 0 ${VB} ${VB}`} width={SIZE} height={SIZE} style={styles.svg} pointerEvents="none">
          <Defs>
            <LinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
              <Stop offset="0%" stopColor={BRAND_GRADIENT[0]} />
              <Stop offset="100%" stopColor={BRAND_GRADIENT[1]} />
            </LinearGradient>
          </Defs>
          {/* Layer 1: Track */}
          <Path
            d={trackPath}
            fill="none"
            stroke={TRACK_COLOR}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
          />
          {/* Layer 2: Progress with gradient — only when fasting; full at start, drains as time passes */}
          {isActive && goalSeconds > 0 && (
            <Path
              d={trackPath}
              fill="none"
              stroke="url(#brandGrad)"
              strokeWidth={STROKE_W}
              strokeLinecap="round"
              strokeDasharray={`${progressDashLength} ${progressGapLength}`}
              strokeDashoffset={0}
              opacity={1}
            />
          )}
          {/* Layer 3: Phase dividers — white lines cutting the arc at 4h, 16h, 24h, etc. */}
          {dividerLines.map((line, i) => (
            <Line
              key={`div-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
        </Svg>

        {/* Layer 4: Avatar knob on arc — always visible; at start when idle, moves when fasting */}
        <View
          style={[
            styles.knob,
            {
              left: knobLeft,
              top: knobTop,
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
            },
          ]}
          pointerEvents="none"
        >
          {userPhoto ? (
            <Image
              source={{ uri: userPhoto }}
              style={styles.knobImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.knobPlaceholder} />
          )}
        </View>

        {/* Center: timer text + phase badge */}
        <View style={styles.centerContent} pointerEvents="none">
          <Text style={styles.timerText}>
            {isActive && timerText ? timerText : idleText || timerText || 'Select duration'}
          </Text>
          {isActive && (
            <ExpoLinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.phasePill}
            >
              <Text style={styles.phasePillText}>{currentPhase.name}</Text>
            </ExpoLinearGradient>
          )}
        </View>
      </Pressable>

      {/* Stage info card — only when user taps the arc area */}
      {showStageCard && (
        <View style={styles.stageCard}>
          <View style={[styles.stageIcon, { backgroundColor: currentPhase.color + '20' }]}>
            <Text style={[styles.stageIconText, { color: currentPhase.color }]}>
              {currentPhase.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.stageTextWrap}>
            <Text style={styles.stageTitle}>{currentPhase.name}</Text>
            <Text style={styles.stageDesc}>{phaseDescription}</Text>
          </View>
          {onPhaseDetailsPress && (
            <Text style={styles.stageDetailsLink} onPress={onPhaseDetailsPress}>
              Phase details
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  wheelContainer: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  knob: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#FFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  knobImage: {
    width: '100%',
    height: '100%',
  },
  knobPlaceholder: {
    flex: 1,
    backgroundColor: '#E17055',
    width: '100%',
    height: '100%',
  },
  centerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.5,
  },
  phasePill: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  phasePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageCard: {
    width: '100%',
    maxWidth: 320,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  stageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stageIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  stageTextWrap: { flex: 1 },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  stageDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  stageDetailsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E17055',
    marginLeft: 8,
  },
});
