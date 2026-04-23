import { Platform, TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1:      { fontSize: 28, fontWeight: '700', letterSpacing: Platform.OS === 'ios' ? -0.5 : 0 },
  h2:      { fontSize: 22, fontWeight: '700', letterSpacing: Platform.OS === 'ios' ? -0.3 : 0 },
  h3:      { fontSize: 18, fontWeight: '600' },
  h4:      { fontSize: 16, fontWeight: '600' },
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMd:  { fontSize: 15, fontWeight: '500' },
  small:   { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500' },
  label:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
};
