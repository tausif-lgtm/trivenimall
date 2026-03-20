import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, STATUS_COLOR, PRIORITY_COLOR, Fonts, Radius } from '../lib/theme';

// ── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>
        {status?.replace('_', ' ')}
      </Text>
    </View>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const p = PRIORITY_COLOR[priority] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }]}>
      <Text style={[styles.badgeText, { color: p.text }]}>{priority}</Text>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, style]} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ title, onPress, loading: isLoading, color, textColor, style, disabled, outline }) {
  const bg = color || Colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        outline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: bg }
          : { backgroundColor: bg },
        (disabled || isLoading) && { opacity: 0.55 },
        style,
      ]}
    >
      {isLoading
        ? <ActivityIndicator color={outline ? bg : (textColor || '#fff')} size="small" />
        : <Text style={[styles.btnText, { color: outline ? bg : (textColor || '#fff') }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
import { TextInput } from 'react-native';
export function Input({ label, ...props }) {
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, props.multiline && { height: 90, textAlignVertical: 'top' }]}
        placeholderTextColor={Colors.textLight}
        {...props}
      />
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon || '📋'}</Text>
      <Text style={styles.emptyTitle}>{title || 'Nothing here'}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Loading Screen ────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ value, label, color, icon }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color || Colors.primary }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: color || Colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: Fonts.md,
    fontWeight: '700',
  },
  inputWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Fonts.base,
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: Fonts.md,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionAction: {
    fontSize: Fonts.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: Fonts.md,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Fonts.sm,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 4,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: Fonts.xl, fontWeight: '800' },
  statLabel: { fontSize: Fonts.sm, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
