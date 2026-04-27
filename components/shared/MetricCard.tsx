import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T } from '../../constants/tokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
  subColor?: 'green' | 'grey';
  primary?: boolean;
}

export default function MetricCard({
  label,
  value,
  unit,
  subLabel,
  subColor = 'grey',
  primary = false,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, primary && styles.valuePrimary]}>{value}</Text>
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </View>
      {subLabel && (
        <Text style={[styles.subLabel, subColor === 'green' ? styles.subGreen : styles.subGrey]}>
          {subLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: T.card,
    borderWidth: 1,
    borderColor: T.borderL,
    padding: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: T.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 36,
    fontFamily: 'Inter_800ExtraBold',
    color: T.text1,
    lineHeight: 40,
  },
  valuePrimary: {
    color: T.orange,
  },
  unit: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: T.text2,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  subGreen: { color: T.green },
  subGrey:  { color: T.text3 },
});
