import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const ROLE_COLOR = {
  admin:    { bg: '#fee2e2', text: '#991b1b' },
  staff:    { bg: '#dbeafe', text: '#1e40af' },
  helpdesk: { bg: '#cffafe', text: '#155e75' },
  security: { bg: '#fef9c3', text: '#854d0e' },
  tenant:   { bg: '#f3e8ff', text: '#6b21a8' },
  customer: { bg: '#dcfce7', text: '#166534' },
};

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      const r = await api.get('/users', { params });
      setUsers(r.data.data || []);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, [filterRole]));

  const deleteUser = (u) => {
    Alert.alert('Delete User', `Delete "${u.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/users/${u.id}`); load(); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed.'); }
      }},
    ]);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search users..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Role filter chips */}
      <View style={styles.chipRow}>
        {['', 'admin', 'staff', 'helpdesk', 'security', 'tenant', 'customer'].map(r => (
          <TouchableOpacity key={r} onPress={() => setFilterRole(r)}
            style={[styles.chip, filterRole === r && styles.chipActive]}>
            <Text style={[styles.chipText, filterRole === r && styles.chipTextActive]}>
              {r || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="👥" title="No users found" />}
        renderItem={({ item: u }) => {
          const rc = ROLE_COLOR[u.role] || { bg: '#f1f5f9', text: '#475569' };
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{u.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                    <Text style={[styles.roleText, { color: rc.text }]}>{u.role}</Text>
                  </View>
                </View>
                <Text style={styles.email}>{u.email}</Text>
                {u.specialty ? (
                  <Text style={styles.specialty}>🏷️ {u.specialty}</Text>
                ) : null}
                {u.mobile ? (
                  <Text style={styles.mobile}>📱 {u.mobile}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => deleteUser(u)} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, margin: 12, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: Fonts.base, color: Colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 4 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  email: { fontSize: Fonts.sm, color: Colors.textMuted, marginBottom: 2 },
  specialty: { fontSize: 12, color: Colors.textLight },
  mobile: { fontSize: 12, color: Colors.textLight },
  delBtn: { padding: 6 },
});
