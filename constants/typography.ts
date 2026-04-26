import { TextStyle } from 'react-native';

// Inter — closest open-source equivalent to SF Pro / Claude's font
// Loaded in app/_layout.tsx via @expo-google-fonts/inter
export const typography: Record<string, TextStyle> = {
  h1:      { fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  h2:      { fontSize: 22, fontFamily: 'Inter_700Bold',      letterSpacing: -0.3 },
  h3:      { fontSize: 18, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2 },
  h4:      { fontSize: 16, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.1 },
  body:    { fontSize: 15, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMd:  { fontSize: 15, fontFamily: 'Inter_500Medium' },
  small:   { fontSize: 13, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  caption: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  label:   { fontSize: 11, fontFamily: 'Inter_600SemiBold',  textTransform: 'uppercase', letterSpacing: 0.6 },
};
