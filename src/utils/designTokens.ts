/**
 * Design System Configuration
 * Centralized design tokens for the Robo Advisor app
 */

// Color Palette based on design system
export const colors = {
  gray: {
    50: '#f6f6f6',
    100: '#e7e7e7',
    200: '#d1d1d1',
    300: '#b0b0b0',
    400: '#888888',
    500: '#66666d',
    600: '#5d5d5d',
    700: '#414141',
    800: '#454545',
    900: '#3d3d3d',
    950: '#171717',
  },
  primary: {
    50: '#fef6fe',
    100: '#daefeb',
    200: '#b8fad8',
    300: '#80f5b9',
    400: '#4e2964',
    500: '#ad678',
    600: '#917AFE',
    700: '#0f684c',
    800: '#12639a',
    900: '#115635',
    950: '#03301c',
  },
  error: {
    50: '#fff0f0',
    100: '#ffdddd',
    200: '#ffc1c1',
    300: '#ffb698',
    400: '#ff5a5a',
    500: '#f72727',
    600: '#fb0707',
    700: '#d40101',
    800: '#ae6068',
    900: '#900c0c',
    950: '#3d0000',
  },
  warning: {
    50: '#fffcea',
    100: '#fff4c4',
    200: '#ffe885',
    300: '#ffd545',
    400: '#ffc21a',
    500: '#ffa000',
    600: '#e37700',
    700: '#bc5101',
    800: '#983e08',
    900: '#7d340a',
    950: '#3d1500',
  },
  info: {
    50: '#eef8ff',
    100: '#dcf1ff',
    200: '#b2e4ff',
    300: '#d6d1ff',
    400: '#209fff',
    500: '#00a0ff',
    600: '#007dfd',
    700: '#0064a4',
    800: '#005595',
    900: '#00467a',
    950: '#00213d',
  },
  success: {
    50: '#eefff3',
    100: '#d8f1e5',
    200: '#b4fecc',
    300: '#79f1c5',
    400: '#38f076',
    500: '#0ed954',
    600: '#05b441',
    700: '#08d837',
    800: '#0ccf30',
    900: '#0c5b29',
    950: '#003b17',
  },
};

// Spacing Scale (in pixels)
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
};

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  h5: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  h6: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  bodyLg: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  labelSm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  captionSm: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },
};

// Shadow
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
};

// Icon Sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

// Gradients
export const gradients = {
  primary: ['#0ea5e9', '#8b5cf6'],
  success: ['#22c55e', '#10b981'],
  warning: ['#f59e0b', '#f97316'],
  error: ['#ef4444', '#dc2626'],
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
  gradients,
};
