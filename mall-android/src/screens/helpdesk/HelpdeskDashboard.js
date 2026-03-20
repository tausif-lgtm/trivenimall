import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader, StatusBadge } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function HelpdeskDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/dashboard/helpdesk');
      setData(r.data.data);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const t = data?.tickets || {};

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="headset" size={22} color="#fff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Help Desk 🎧</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Support Agent</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Ticket Stats */}
      <SectionHeader title="Ticket Overview" />
      <View style={styles.statsRow}>
        <StatCard icon="🎫" value={t.total      || 0} label="Total"    color={Colors.info} />
        <StatCard icon="🔴" value={t.open       || 0} label="Open"     color={Colors.warning} />
        <StatCard icon="⚡" value={t.in_progress|| 0} label="Active"   color="#8b5cf6" />
        <StatCard icon="✅" value={t.resolved   || 0} label="Done"     color={Colors.success} />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Tickets')} activeOpacity={0.8}>
          <Ionicons name="list-outline" size={28} color={Colors.primary} />
          <Text style={styles.actionLabel}>All Tickets</Text>
          <Text style={styles.actionSub}>View & manage tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('NewTicket')} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={28} color={Colors.success} />
          <Text style={styles.actionLabel}>New Ticket</Text>
          <Text style={styles.actionSub}>Log a new issue</Text>
        </TouchableOpacity>
      </View>

      {/* Recent tickets */}
      <SectionHeader title="Recent Tickets" action="View All" onAction={() => navigation.navigate('Tickets')} />
      {(data?.recentTickets || []).length === 0 ? (
        <Card><Text style={{ color: Colors.textMuted, textAlign: 'center' }}>No recent tickets.</Text></Card>
      ) : (
        (data?.recentTickets || []).slice(0, 5).map(ticket => (
          <Card key={ticket.id} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} style={styles.ticketCard}>
            <View style={styles.ticketRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
                <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                {ticket.assigned_to_name && (
                  <Text style={styles.assignee}>👤 {ticket.assigned_to_name}</Text>
                )}
              </View>
              <StatusBadge status={ticket.status} />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a2e44', borderRadius: Radius.xl, padding: 18, marginBottom: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0e7490', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  greeting: { color: '#94a3b8', fontSize: 13 },
  name: { color: '#fff', fontSize: 17, fontWeight: '700' },
  role: { color: '#67e8f9', fontSize: 12, marginTop: 2 },
  bellBtn: { padding: 8, backgroundColor: '#164e63', borderRadius: Radius.full },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  actionLabel: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text, marginTop: 8 },
  actionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  ticketCard: { marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketNum: { fontSize: 11, color: Colors.textLight, fontFamily: 'monospace', marginBottom: 2 },
  ticketTitle: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.text },
  assignee: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
