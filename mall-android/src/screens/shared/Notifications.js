import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const NOTIF_ICON = {
  ticket_created:  { icon: 'ticket-outline',         color: Colors.info },
  ticket_updated:  { icon: 'refresh-circle-outline', color: Colors.warning },
  ticket_assigned: { icon: 'person-add-outline',     color: '#8b5cf6' },
  ticket_resolved: { icon: 'checkmark-circle-outline', color: Colors.success },
  checklist_due:   { icon: 'clipboard-outline',      color: '#f97316' },
  checklist_submitted: { icon: 'checkbox-outline',   color: Colors.success },
  reply:           { icon: 'chatbubble-outline',     color: Colors.primary },
};

export default function Notifications() {
  const navigation = useNavigation();
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/notifications');
      setNotifs(r.data.data || []);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const handlePress = (notif) => {
    markRead(notif.id);
    if (notif.ticket_id) {
      navigation.navigate('TicketDetail', { ticketId: notif.ticket_id });
    }
  };

  if (loading) return <LoadingScreen />;

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <View style={styles.root}>
      {unread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
          <Text style={styles.markAllText}>Mark all as read ({unread})</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifs}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />}
        renderItem={({ item }) => {
          const ni = NOTIF_ICON[item.type] || { icon: 'notifications-outline', color: Colors.textMuted };
          return (
            <TouchableOpacity
              style={[styles.notif, !item.is_read && styles.notifUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: ni.color + '20' }]}>
                <Ionicons name={ni.icon} size={20} color={ni.color} />
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !item.is_read && styles.bold]} numberOfLines={2}>
                  {item.title || item.message}
                </Text>
                {item.title && item.message && (
                  <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                )}
                <Text style={styles.notifTime}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!item.is_read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  markAllText: { fontSize: Fonts.sm, color: Colors.primary, fontWeight: '600' },
  list: { padding: 12 },
  notif: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  notifUnread: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: Fonts.base, color: Colors.text, lineHeight: 20 },
  bold: { fontWeight: '700' },
  notifMsg: { fontSize: Fonts.sm, color: Colors.textMuted, marginTop: 2 },
  notifTime: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
});
