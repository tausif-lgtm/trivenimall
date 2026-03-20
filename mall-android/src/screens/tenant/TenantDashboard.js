import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader, StatusBadge } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function TenantDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/dashboard/tenant');
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
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>🏪 Tenant</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('NewTicket')} activeOpacity={0.8}>
          <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.danger} />
          </View>
          <Text style={styles.actionLabel}>Raise Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Tickets')} activeOpacity={0.8}>
          <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="list-outline" size={24} color={Colors.info} />
          </View>
          <Text style={styles.actionLabel}>My Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
          <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="notifications-outline" size={24} color="#7c3aed" />
          </View>
          <Text style={styles.actionLabel}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="person-outline" size={24} color={Colors.success} />
          </View>
          <Text style={styles.actionLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Ticket Stats */}
      <SectionHeader title="My Tickets" />
      <View style={styles.statsRow}>
        <StatCard icon="🎫" value={t.total      || 0} label="Total"    color={Colors.info} />
        <StatCard icon="🔴" value={t.open       || 0} label="Open"     color={Colors.warning} />
        <StatCard icon="⚡" value={t.in_progress|| 0} label="Active"   color="#8b5cf6" />
        <StatCard icon="✅" value={t.resolved   || 0} label="Done"     color={Colors.success} />
      </View>

      {/* Recent tickets */}
      <SectionHeader title="Recent Tickets" action="View All" onAction={() => navigation.navigate('Tickets')} />
      {(data?.recentTickets || []).length === 0 ? (
        <Card><Text style={{ color: Colors.textMuted, textAlign: 'center' }}>No tickets raised yet.</Text></Card>
      ) : (
        (data?.recentTickets || []).slice(0, 4).map(ticket => (
          <Card key={ticket.id} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} style={styles.ticketCard}>
            <View style={styles.ticketRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
                <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
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
    backgroundColor: Colors.dark, borderRadius: Radius.xl, padding: 18, marginBottom: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerInfo: { flex: 1 },
  greeting: { color: '#94a3b8', fontSize: 13 },
  name: { color: '#fff', fontSize: 17, fontWeight: '700' },
  role: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  bellBtn: { padding: 8, backgroundColor: '#334155', borderRadius: Radius.full },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.card,
    borderRadius: Radius.lg, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.text },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  ticketCard: { marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketNum: { fontSize: 11, color: Colors.textLight, fontFamily: 'monospace', marginBottom: 2 },
  ticketTitle: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.text },
});
