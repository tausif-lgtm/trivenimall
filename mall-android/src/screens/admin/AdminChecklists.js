import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card, EmptyState, LoadingScreen, StatCard, SectionHeader } from '../../components';
import { Colors, Fonts, Radius, STATUS_COLOR } from '../../lib/theme';
import api from '../../lib/api';
import Toast from 'react-native-toast-message';

const FREQ_COLOR = { daily: '#3b82f6', weekly: '#a855f7', monthly: '#f97316' };
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminChecklists() {
  const navigation = useNavigation();
  const [tab,         setTab]        = useState('templates');
  const [templates,   setTemplates]  = useState([]);
  const [monitoring,  setMonitoring] = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [refreshing,  setRefreshing] = useState(false);
  const [generating,  setGenerating] = useState(false);

  useFocusEffect(useCallback(() => {
    if (tab === 'templates') loadTemplates();
    else loadMonitoring();
  }, [tab]));

  const loadTemplates = async () => {
    try { const r = await api.get('/checklists/templates'); setTemplates(r.data.data || []); }
    catch {}
    setLoading(false); setRefreshing(false);
  };

  const loadMonitoring = async () => {
    try { const r = await api.get(`/checklists/monitoring?date=${today()}`); setMonitoring(r.data.data); }
    catch {}
    setLoading(false); setRefreshing(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/checklists/generate', { date: today() });
      Toast.show({ type: 'success', text1: r.data.message });
      loadMonitoring();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Failed to generate.' });
    }
    setGenerating(false);
  };

  const toggleActive = async (tmpl) => {
    try {
      await api.put(`/checklists/templates/${tmpl.id}`, { is_active: tmpl.is_active ? 0 : 1 });
      setTemplates(ts => ts.map(t => t.id === tmpl.id ? { ...t, is_active: t.is_active ? 0 : 1 } : t));
    } catch {}
  };

  const deleteTemplate = (id, title) => {
    Alert.alert('Delete Template', `Delete "${title}"? All related schedules will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/checklists/templates/${id}`); loadTemplates(); }
        catch { Toast.show({ type: 'error', text1: 'Delete failed.' }); }
      }},
    ]);
  };

  const stats = monitoring?.stats || {};
  const schedules = monitoring?.schedules || [];
  const byStaff = monitoring?.byStaff || [];

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.root}>
      {/* Tab selector */}
      <View style={styles.tabRow}>
        {[['templates','Templates'],['monitor','Monitoring']].map(([id, label]) => (
          <TouchableOpacity key={id} onPress={() => setTab(id)}
            style={[styles.tabBtn, tab === id && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, tab === id && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <FlatList
          data={templates}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTemplates(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState icon="✅" title="No checklists yet" subtitle="Create your first checklist template." />}
          renderItem={({ item: t }) => (
            <Card style={[styles.tmplCard, !t.is_active && { opacity: 0.55 }]}>
              <View style={styles.tmplHeader}>
                <View style={[styles.freqBadge, { backgroundColor: (FREQ_COLOR[t.frequency] || '#64748b') + '20' }]}>
                  <Text style={[styles.freqText, { color: FREQ_COLOR[t.frequency] || '#64748b' }]}>
                    {t.frequency}
                  </Text>
                </View>
                <View style={styles.tmplActions}>
                  <TouchableOpacity onPress={() => toggleActive(t)} style={[styles.actionBtn, { backgroundColor: t.is_active ? '#dcfce7' : '#f1f5f9' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.is_active ? '#166534' : '#475569' }}>
                      {t.is_active ? 'Active' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTemplate(t.id, t.title)} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.tmplTitle}>{t.title}</Text>
              {t.description ? <Text style={styles.tmplDesc} numberOfLines={1}>{t.description}</Text> : null}
              <View style={styles.tmplMeta}>
                <Text style={styles.metaChip}>📋 {t.item_count} items</Text>
                <Text style={styles.metaChip}>
                  {t.assign_type === 'staff' ? `👤 ${t.assigned_staff_name || 'Unassigned'}` : `🏷️ ${t.assigned_role || '—'}`}
                </Text>
              </View>
            </Card>
          )}
        />
      )}

      {/* MONITORING */}
      {tab === 'monitor' && (
        <FlatList
          data={schedules}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMonitoring(); }} tintColor={Colors.primary} />}
          ListHeaderComponent={() => (
            <View>
              {/* Generate button */}
              <TouchableOpacity onPress={handleGenerate} disabled={generating} style={styles.generateBtn} activeOpacity={0.8}>
                <Ionicons name={generating ? 'reload' : 'refresh-circle-outline'} size={18} color="#fff" />
                <Text style={styles.generateBtnText}>{generating ? 'Generating...' : 'Generate Today\'s Schedules'}</Text>
              </TouchableOpacity>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatCard icon="📋" value={stats.total     || 0} label="Total"     color={Colors.info} />
                <StatCard icon="✅" value={stats.completed || 0} label="Done"      color={Colors.success} />
                <StatCard icon="⏳" value={stats.pending   || 0} label="Pending"   color={Colors.warning} />
                <StatCard icon="❌" value={stats.missed    || 0} label="Missed"    color={Colors.danger} />
              </View>

              {/* Staff performance */}
              {byStaff.length > 0 && (
                <Card style={{ marginBottom: 12 }}>
                  <SectionHeader title="Staff Performance" />
                  {byStaff.map(s => {
                    const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                    return (
                      <View key={s.staff_id} style={styles.staffRow}>
                        <Text style={styles.staffName} numberOfLines={1}>{s.staff_name}</Text>
                        <View style={styles.progressWrap}>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {
                              width: `${pct}%`,
                              backgroundColor: pct === 100 ? Colors.success : Colors.info,
                            }]} />
                          </View>
                          <Text style={styles.progressPct}>{pct}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              )}

              <SectionHeader title={`All Schedules — ${today()}`} />
              {schedules.length === 0 && (
                <EmptyState icon="📅" title="No schedules" subtitle="Tap 'Generate Today's Schedules' above." />
              )}
            </View>
          )}
          renderItem={({ item: s }) => {
            const sc = STATUS_COLOR[s.status] || { bg: '#f1f5f9', text: '#475569' };
            return (
              <TouchableOpacity
                style={styles.schedCard}
                onPress={() => navigation.navigate('MonitorDetail', { scheduleId: s.id })}
                activeOpacity={0.75}
              >
                <View style={styles.schedHeader}>
                  <Text style={styles.schedTitle} numberOfLines={1}>{s.template_title}</Text>
                  <View style={[styles.schedStatus, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.schedStatusText, { color: sc.text }]}>{s.status.replace('_',' ')}</Text>
                  </View>
                </View>
                <View style={styles.schedMeta}>
                  <Text style={styles.schedMetaText}>👤 {s.assigned_to_name || 'Unassigned'}</Text>
                  <Text style={styles.schedMetaText}>
                    {s.completed_items || 0}/{s.total_items || 0} done
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.card,
    margin: 12, borderRadius: Radius.md, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.textMuted },
  tabBtnTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 32 },
  tmplCard: { marginBottom: 12 },
  tmplHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  freqBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  freqText: { fontSize: Fonts.sm, fontWeight: '700', textTransform: 'capitalize' },
  tmplActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
  tmplTitle: { fontSize: Fonts.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  tmplDesc: { fontSize: Fonts.sm, color: Colors.textMuted, marginBottom: 8 },
  tmplMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaChip: { fontSize: Fonts.sm, color: Colors.textMuted, fontWeight: '500' },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 13, marginBottom: 16,
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: Fonts.base },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  staffRow: { marginBottom: 10 },
  staffName: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.text, marginBottom: 4, width: '40%' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontSize: Fonts.sm, color: Colors.textMuted, width: 30 },
  schedCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  schedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  schedTitle: { flex: 1, fontSize: Fonts.base, fontWeight: '600', color: Colors.text, marginRight: 8 },
  schedStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  schedStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  schedMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  schedMetaText: { fontSize: Fonts.sm, color: Colors.textMuted },
});
