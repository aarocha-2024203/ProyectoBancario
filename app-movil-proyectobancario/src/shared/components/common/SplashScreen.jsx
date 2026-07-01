// src/shared/components/common/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Image, Animated, StyleSheet,
  Dimensions, Easing,
} from 'react-native';
import { COLORS } from '../../constants/theme.js';

const { width: W, height: H } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // ── Valores animados ───────────────────────────────────────────────────────
  const logoScale    = useRef(new Animated.Value(0.3)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoY        = useRef(new Animated.Value(40)).current;
  const pulse        = useRef(new Animated.Value(1)).current;
  const shimmer      = useRef(new Animated.Value(0)).current;
  const ringScale1   = useRef(new Animated.Value(0)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringScale2   = useRef(new Animated.Value(0)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const exitOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo entra con scale + fade + subida
    const enter = Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out-cubic (similar a spring)
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    // 2. Pulso suave (respiración)
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );

    // 3. Shimmer (brillo que cruza el logo)
    const shimmerAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, easing: (t) => t, useNativeDriver: false }),
        Animated.delay(800),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );

    // 4. Ondas expansivas (rings)
    const ringAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale1,   { toValue: 2.2, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(ringOpacity1, { toValue: 0,   duration: 1400, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale1,   { toValue: 0, duration: 0, useNativeDriver: false }),
          Animated.timing(ringOpacity1, { toValue: 0.35, duration: 0, useNativeDriver: false }),
        ]),
      ])
    );

    const ringAnim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(ringScale2,   { toValue: 2.2, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(ringOpacity2, { toValue: 0,   duration: 1400, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale2,   { toValue: 0, duration: 0, useNativeDriver: false }),
          Animated.timing(ringOpacity2, { toValue: 0.35, duration: 0, useNativeDriver: false }),
        ]),
      ])
    );

    // 5. Barra de progreso
    const barAnim = Animated.timing(barWidth, {
      toValue: W * 0.65,
      duration: 2200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    // Secuencia completa
    enter.start(() => {
      pulseAnim.start();
      shimmerAnim.start();
      ringAnim.start();
      ringAnim2.start();
      barAnim.start();
    });

    // 6. Salida + callback
    const exitTimer = setTimeout(() => {
      pulseAnim.stop();
      shimmerAnim.stop();
      ringAnim.stop();
      ringAnim2.stop();

      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(logoScale, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => onFinish?.());
    }, 2800);

    return () => clearTimeout(exitTimer);
  }, []);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-W, W],
  });

  return (
    <Animated.View style={[s.root, { opacity: exitOpacity }]}>
      {/* Fondo con gradiente radial simulado */}
      <View style={s.bgGlow} />

      {/* Onda expansiva 1 */}
      <Animated.View
        style={[s.ring, {
          transform: [{ scale: ringScale1 }],
          opacity: ringOpacity1,
        }]}
      />
      {/* Onda expansiva 2 */}
      <Animated.View
        style={[s.ring, s.ring2, {
          transform: [{ scale: ringScale2 }],
          opacity: ringOpacity2,
        }]}
      />

      {/* Logo con pulso */}
      <Animated.View
        style={[s.logoWrap, {
          opacity: logoOpacity,
          transform: [
            { scale: Animated.multiply(logoScale, pulse) },
            { translateY: logoY },
          ],
        }]}
      >
        <Image
          source={require('../../../../assets/LogoBancokinal.png')}
          style={s.logo}
          resizeMode="contain"
        />

        {/* Shimmer overlay */}
        <Animated.View
          style={[s.shimmer, { transform: [{ translateX: shimmerX }], pointerEvents: 'none' }]}
        />
      </Animated.View>

      {/* Barra de progreso */}
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, { width: barWidth }]} />
      </View>
    </Animated.View>
  );
}

const LOGO_SIZE = 220;
const RING_SIZE = 160;

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // Glow de fondo
  bgGlow: {
    position: 'absolute',
    width: W * 1.2,
    height: W * 1.2,
    borderRadius: W * 0.6,
    backgroundColor: COLORS.primary,
    opacity: 0.18,
  },

  // Ondas
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  ring2: {
    borderColor: COLORS.primaryLight,
  },

  // Logo
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 60,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE * 0.55,
  },

  // Shimmer
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-20deg' }],
  },

  // Barra de progreso
  barTrack: {
    position: 'absolute',
    bottom: H * 0.12,
    width: W * 0.65,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
});