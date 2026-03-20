import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius, STATUS_COLOR } from '../../lib/theme';
import api from '../../lib/api';

const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

export default function StaffChecklists() {
  const navigation = useNavigation();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/checklists/my');
      setData(r.data.data);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingScreen />;

  const todayList = data?.today || [];
  const pending   = data?.pending || [];
  const overdueList = pending.filter(p => p.scheduled_date !== new Date().toISOString().slice(0, 10));
  const done      = todayList.filter(c => c.status === 'completed').length;

  const CheckCard = ({ item, showDate }) => {
    const sc = STATUS_COLOR[item.status] || { bg: '#f1f5f9', text: '#475569' };
    const itemDone  = Number(item.completed_items) || 0;
    const itemTotal = Number(item.total_items)     || 0;
    const pct = itemTotal > 0 ? Math.round((itemDone / itemTotal) * 100) : 0;
    return (
      <TouchableOpacity
        style={[styles.card, item.status === 'completed' && styles.cardDone]}
        onPress={() => navigation.navigate('ExecuteChecklist', { scheduleId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.template_title}</Text>
            {showDate && (
              <Text style={styles.cardDate}>
                {new Date(item.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${pct}%`,
              backgroundColor: pct === 100 ? Colors.success : Colors.primary
            }]} />
          </View>
          <Text style={styles.progressTxt}>{itemDone}/{itemTotal}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      data={[]}
      ListHeaderComponent={
        <View>
          {/* Date banner */}
          <View style={styles.dateBanner}>
            <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
            <Text style={styles.dateText}>{today}</Text>
          </View>
          {todayList.length > 0 && (
            <View style={styles.progressSummary}>
              <Text style={styles.summaryText}>{done}/{todayList.length} completed today</Text>
              <View style={styles.summaryBar}>
                <View style={[styles.summaryFill, {
                  width: `${todayList.length > 0 ? Math.round((done / todayList.length) * 100) : 0}%`
                }]} />
              </View>
            </View>
          )}

          <Text style={styles.section}>📋 Today&apos;s Tasks</Text>
          {todayList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No checklists assigned today</Text>
            </View>
          ) : (
            todayList.map(item => <CheckCard key={item.id} item={item} />)
          )}

          {overdueList.length > 0 && (
            <>
              <Text style={[styles.section, { color: Colors.danger }]}>⚠️ Overdue</Text>
              {overdueList.map(item => <CheckCard key={item.id} item={item} showDate />)}
            </>
          )}
        </View>
      }
      renderItem={null}
      ListEmptyComponent={null}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  dateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dark, borderRadius: Radius.lg,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  dateText: { color: '#94a3b8', fontSize: Fonts.sm, fontWeight: '500' },
  progressSummary: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  summaryText: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.textMuted, marginBottom: 8 },
  summaryBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  summaryFill: { height: 8, borderRadius: 4, backgroundColor: Colors.success },
  section: { fontSize: Fonts.md, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: Fonts.base, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardDone: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  cardTitle: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text },
  cardDate: { fontSize: Fonts.sm, color: Colors.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressTxt: { fontSize: Fonts.sm, color: Colors.textMuted },
});
