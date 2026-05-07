import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from './theme';

/**
 * Pre-built text style presets. Every entry bakes in FONT_FAMILY so
 * callers never have to think about platform differences.
 *
 * Usage (in a StyleSheet):
 *   label: { ...TYPOGRAPHY.label, color: COLORS.primary }
 *
 * Usage (inline):
 *   <Text style={TYPOGRAPHY.body}>…</Text>
 */
export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    color: COLORS.text,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: COLORS.text,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: COLORS.text,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: COLORS.text,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: COLORS.text,
  },
  bodySemiBold: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: COLORS.text,
  },
  small: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: COLORS.text,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: COLORS.text,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    color: COLORS.text,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
