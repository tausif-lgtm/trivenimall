import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Card, StatCard, SectionHeader, StatusBadge, PriorityBadge, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/dashboard/admin');
      setData(r.data.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  const t = data?.tickets || {};
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Good morning,</Text>
          <Text style={styles.name}>{user?.name} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Ticket Stats */}
      <SectionHeader title="Ticket Overview" />
      <View style={styles.statsRow}>
        <StatCard icon="📋" value={t.total     || 0} label="Total"    color={Colors.info} />
        <StatCard icon="🔴" value={t.open      || 0} label="Open"     color={Colors.warning} />
        <StatCard icon="⚡" value={t.in_progress||0} label="Active"   color="#8b5cf6" />
        <StatCard icon="✅" value={t.resolved  || 0} label="Resolved" color={Colors.success} />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" style={{ marginTop: 8 }} />
      <View style={styles.actionsGrid}>
        {[
          { icon: 'ticket-outline',   label: 'All Tickets',   color: Colors.info,    onPress: () => navigation.navigate('Tickets') },
          { icon: 'checkbox-outline', label: 'Checklists',    color: Colors.success, onPress: () => navigation.navigate('Checklists') },
          { icon: 'people-outline',   label: 'Users',         color: '#a855f7',      onPress: () => navigation.navigate('Users') },
          { icon: 'notifications-outline', label: 'Notify',  color: Colors.warning, onPress: () => navigation.navigate('Notifications') },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.actionCard} onPress={a.onPress} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon} size={24} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Tickets */}
      <SectionHeader title="Recent Tickets" action="View All" onAction={() => navigation.navigate('Tickets')} />
      {data?.recentTickets?.length === 0 ? (
        <Card><Text style={{ color: Colors.textMuted, textAlign: 'center' }}>No recent tickets.</Text></Card>
      ) : (
        data?.recentTickets?.slice(0, 5).map(ticket => (
          <Card key={ticket.id} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} style={styles.ticketCard}>
            <View style={styles.ticketTop}>
              <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
              <StatusBadge status={ticket.status} />
            </View>
            <Text style={styles.ticketTitle} numberOfLines={2}>{ticket.title}</Text>
            <View style={styles.ticketMeta}>
              <Text style={styles.metaText}>{ticket.customer_name || ticket.requester_name}</Text>
              <PriorityBadge priority={ticket.priority} />
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
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: 20,
    marginBottom: 20,
  },
  welcome: { color: '#94a3b8', fontSize: Fonts.sm },
  name:    { color: '#fff', fontSize: Fonts.xl, fontWeight: '800', marginTop: 2 },
  date:    { color: '#64748b', fontSize: Fonts.sm, marginTop: 4 },
  bellBtn: { padding: 8, backgroundColor: '#334155', borderRadius: Radius.full },
  statsRow: { flexDirection: 'row', gap: 0, marginBottom: 20 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20,
  },
  actionCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.text },
  ticketCard: { marginBottom: 10 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketNum: { fontSize: Fonts.sm, color: Colors.textLight, fontFamily: 'monospace' },
  ticketTitle: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  ticketMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: Fonts.sm, color: Colors.textMuted },
});
