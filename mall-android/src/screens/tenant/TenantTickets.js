import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBadge, PriorityBadge, EmptyState } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'];

export default function TenantTickets() {
  const navigation = useNavigation();
  const [tickets,    setTickets]    = useState([]);
  const [search,     setSearch]     = useState('');
  const [tab,        setTab]        = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/tickets');
      setTickets(r.data.data || []);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = tickets.filter(t => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.ticket_number?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textLight} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search tickets..." placeholderTextColor={Colors.textLight} />
      </View>

      {/* Status tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.tabActive]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item === 'all' ? 'All' : item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="🎫" title="No tickets found" subtitle="Raise a ticket from the dashboard." />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
            activeOpacity={0.75}>
            <View style={styles.top}>
              <Text style={styles.num}>{item.ticket_number}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{item.category || '—'}</Text>
              <PriorityBadge priority={item.priority} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewTicket')} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, margin: 12, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: Fonts.base, color: Colors.text },
  tabRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'capitalize' },
  tabTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 4, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  num: { fontSize: Fonts.sm, color: Colors.textLight, fontFamily: 'monospace' },
  title: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: Fonts.sm, color: Colors.textMuted },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, elevation: 8,
  },
});
