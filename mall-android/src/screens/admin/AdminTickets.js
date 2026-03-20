import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBadge, PriorityBadge, EmptyState, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const STATUS_TABS = ['All', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function AdminTickets() {
  const navigation = useNavigation();
  const [tickets,    setTickets]    = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [activeTab,  setActiveTab]  = useState('All');

  const load = async () => {
    try {
      const r = await api.get('/tickets');
      setTickets(r.data.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    let list = tickets;
    if (activeTab !== 'All') list = list.filter(t => t.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.ticket_number?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [tickets, activeTab, search]);

  if (loading) return <LoadingScreen />;

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ticketNum}>{item.ticket_number}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.meta}>
        <View style={styles.metaLeft}>
          <Ionicons name="person-outline" size={13} color={Colors.textLight} />
          <Text style={styles.metaText}>{item.customer_name || item.requester_name || '—'}</Text>
        </View>
        <PriorityBadge priority={item.priority} />
      </View>
      {item.category && (
        <View style={styles.catBadge}>
          <Text style={styles.catText}>{item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tickets..."
          placeholderTextColor={Colors.textLight}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Tabs */}
      <View>
        <FlatList
          data={STATUS_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item)}
              style={[styles.tab, activeTab === item && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        renderItem={renderTicket}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="🎫" title="No tickets found" subtitle="Try a different filter or search." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, margin: 12, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: Fonts.base, color: Colors.text },
  tabs: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: Fonts.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 4 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketNum: { fontSize: Fonts.sm, color: Colors.textLight, fontFamily: 'monospace' },
  title: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Fonts.sm, color: Colors.textMuted },
  catBadge: {
    marginTop: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: Radius.sm, alignSelf: 'flex-start',
  },
  catText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
});
