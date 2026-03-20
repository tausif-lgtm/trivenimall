import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader, StatusBadge, EmptyState } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [data,       setData]       = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [dashRes, clRes] = await Promise.all([
        api.get('/dashboard/staff'),
        api.get('/checklists/my'),
      ]);
      setData(dashRes.data.data);
      setChecklists(clRes.data.data?.today || []);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const t = data?.tickets || {};
  const pendingCl = checklists.filter(c => c.status !== 'completed' && c.status !== 'missed').length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          {user?.specialty && <Text style={styles.specialty}>🏷️ {user.specialty}</Text>}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Checklist alert */}
      {pendingCl > 0 && (
        <TouchableOpacity
          style={styles.clAlert}
          onPress={() => navigation.navigate('Checklists')}
          activeOpacity={0.85}
        >
          <Ionicons name="checkbox-outline" size={20} color="#fff" />
          <Text style={styles.clAlertText}>
            {pendingCl} checklist{pendingCl > 1 ? 's' : ''} pending today
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Ticket Stats */}
      <SectionHeader title="My Tickets" />
      <View style={styles.statsRow}>
        <StatCard icon="📋" value={t.total      || 0} label="Assigned" color={Colors.info} />
        <StatCard icon="🔴" value={t.open       || 0} label="Open"     color={Colors.warning} />
        <StatCard icon="⚡" value={t.in_progress|| 0} label="Active"   color="#8b5cf6" />
        <StatCard icon="✅" value={t.resolved   || 0} label="Done"     color={Colors.success} />
      </View>

      {/* Today's checklists */}
      <SectionHeader title="Today's Checklists" action="View All" onAction={() => navigation.navigate('Checklists')} />
      {checklists.length === 0 ? (
        <Card><Text style={{ color: Colors.textMuted, textAlign: 'center' }}>No checklists assigned today.</Text></Card>
      ) : (
        checklists.slice(0, 3).map(cl => {
          const done  = Number(cl.completed_items) || 0;
          const total = Number(cl.total_items)     || 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Card key={cl.id} onPress={() => navigation.navigate('ExecuteChecklist', { scheduleId: cl.id })} style={styles.clCard}>
              <View style={styles.clTop}>
                <Text style={styles.clTitle} numberOfLines={1}>{cl.template_title}</Text>
                <View style={[styles.clStatus, {
                  backgroundColor: cl.status === 'completed' ? '#dcfce7' : cl.status === 'in_progress' ? '#dbeafe' : '#fef9c3'
                }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: cl.status === 'completed' ? '#166534' : cl.status === 'in_progress' ? '#1e40af' : '#854d0e', textTransform: 'capitalize' }}>
                    {cl.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.clProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? Colors.success : Colors.primary }]} />
                </View>
                <Text style={styles.progressTxt}>{done}/{total}</Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Recent tickets */}
      <SectionHeader title="Recent Tickets" action="View All" onAction={() => navigation.navigate('Tickets')} />
      {(data?.recentTickets || []).slice(0, 3).map(ticket => (
        <Card key={ticket.id} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} style={styles.ticketCard}>
          <View style={styles.ticketRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
              <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
            </View>
            <StatusBadge status={ticket.status} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: 18, marginBottom: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerInfo: { flex: 1 },
  greeting: { color: '#94a3b8', fontSize: 13 },
  name: { color: '#fff', fontSize: 17, fontWeight: '700' },
  specialty: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  bellBtn: { padding: 8, backgroundColor: '#334155', borderRadius: Radius.full },
  clAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f97316', borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 16,
  },
  clAlertText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: Fonts.base },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  clCard: { marginBottom: 10 },
  clTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  clTitle: { flex: 1, fontSize: Fonts.base, fontWeight: '700', color: Colors.text, marginRight: 8 },
  clStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  clProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressTxt: { fontSize: Fonts.sm, color: Colors.textMuted, width: 32, textAlign: 'right' },
  ticketCard: { marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketNum: { fontSize: 11, color: Colors.textLight, fontFamily: 'monospace', marginBottom: 2 },
  ticketTitle: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.text },
});
