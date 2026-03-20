import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function MonitorDetail({ route }) {
  const { scheduleId } = route.params;
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/checklists/schedules/${scheduleId}`)
      .then(r => setSchedule(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scheduleId]);

  if (loading) return <LoadingScreen />;
  if (!schedule) return null;

  const items = schedule.items || [];
  const done  = items.filter(i => i.is_completed).length;
  const pct   = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>{schedule.template_title}</Text>
        <View style={styles.row}>
          <StatusBadge status={schedule.status} />
          <Text style={styles.date}>{new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <Text style={styles.assignee}>👤 {schedule.assigned_to_name || 'Unassigned'}</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? Colors.success : Colors.info }]} />
          </View>
          <Text style={styles.progressTxt}>{done}/{items.length}</Text>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Checklist Items</Text>
      {items.map((item, idx) => (
        <View key={item.id} style={[styles.item, item.is_completed && styles.itemDone]}>
          <View style={[styles.itemCheck, { backgroundColor: item.is_completed ? Colors.success : Colors.border }]}>
            {item.is_completed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <View style={styles.itemBody}>
            <Text style={[styles.itemNum]}>#{idx + 1}</Text>
            <Text style={[styles.itemText, item.is_completed && styles.itemTextDone]}>{item.item_text}</Text>
            {item.remark && <Text style={styles.remark}>💬 {item.remark}</Text>}
            {item.photo_url && <Text style={styles.photo}>📷 Photo attached</Text>}
            {item.completed_at && (
              <Text style={styles.time}>✅ {new Date(item.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            )}
          </View>
        </View>
      ))}

      {schedule.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.notesLabel}>Submission Notes</Text>
          <Text style={styles.notes}>{schedule.notes}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: Fonts.lg, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  date: { fontSize: Fonts.sm, color: Colors.textMuted },
  assignee: { fontSize: Fonts.sm, color: Colors.textMuted, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressTxt: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.text },
  sectionLabel: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  itemDone: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  itemCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  itemBody: { flex: 1 },
  itemNum: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  itemText: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text },
  itemTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  remark: { fontSize: Fonts.sm, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  photo: { fontSize: Fonts.sm, color: Colors.info, marginTop: 4 },
  time: { fontSize: 11, color: Colors.success, marginTop: 4 },
  notesCard: { marginTop: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  notesLabel: { fontSize: Fonts.sm, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  notes: { fontSize: Fonts.base, color: '#78350f' },
});
