import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';

type BadgeType = 'available' | 'unavailable' | 'pending' | 'verified' | 'top-rated';

interface BadgeProps {
  type: BadgeType;
  label?: string;
}

const BADGE_CONFIG: Record<BadgeType, { bg: string; text: string; defaultLabel: string }> = {
  available:   { bg: colors.successBg,    text: colors.success,      defaultLabel: 'Available Now' },
  unavailable: { bg: colors.surfaceElevated, text: colors.textDisabled, defaultLabel: 'Not Available' },
  pending:     { bg: colors.warningBg,    text: colors.warning,      defaultLabel: 'Pending Approval' },
  verified:    { bg: colors.primaryLight, text: colors.primaryDark,  defaultLabel: '✓ Verified' },
  'top-rated': { bg: '#FEF9C3',           text: '#CA8A04',           defaultLabel: '★ Top Rated' },
};

export default function Badge({ type, label }: BadgeProps) {
  const config = BADGE_CONFIG[type];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
