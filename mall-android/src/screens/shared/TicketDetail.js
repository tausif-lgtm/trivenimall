import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBadge, PriorityBadge, LoadingScreen, Divider } from '../../components';
import { Colors, Fonts, Radius, STATUS_COLOR, PRIORITY_COLOR } from '../../lib/theme';
import { useAuth } from '../../context/AuthContext';
import api, { API_BASE } from '../../lib/api';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

// Derive base server URL (strip /api) for attachment URLs
const SERVER_BASE = API_BASE.replace('/api', '');

export default function TicketDetail({ route, navigation }) {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const [ticket,     setTicket]     = useState(null);
  const [replies,    setReplies]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reply,      setReply]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [attachment, setAttachment] = useState(null); // { uri, name, type }
  const scrollRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get(`/tickets/${ticketId}`);
      setTicket(r.data.data);
      setReplies(r.data.data.updates || []);
    } catch {
      Alert.alert('Error', 'Failed to load ticket.');
      navigation.goBack();
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, [ticketId]));

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Allow photo access to attach images.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets.length > 0) {
      const asset = res.assets[0];
      const name = asset.uri.split('/').pop();
      setAttachment({ uri: asset.uri, name, type: 'image/jpeg' });
    }
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.length > 0) {
      const asset = res.assets[0];
      setAttachment({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
    }
  };

  const sendReply = async () => {
    if (!reply.trim() && !attachment) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (reply.trim()) formData.append('message', reply.trim());
      else formData.append('message', '📎 Attachment');
      if (attachment) {
        formData.append('attachment', { uri: attachment.uri, name: attachment.name, type: attachment.type });
      }
      await api.post(`/tickets/${ticketId}/updates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReply('');
      setAttachment(null);
      load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send reply.');
    }
    setSending(false);
  };

  const updateStatus = async (newStatus) => {
    setStatusOpen(false);
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      setTicket(prev => ({ ...prev, status: newStatus }));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update status.');
    }
  };

  const openAttachment = (filename) => {
    const url = `${SERVER_BASE}/uploads/${filename}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open attachment.'));
  };

  if (loading) return <LoadingScreen />;
  if (!ticket) return null;

  const sc = STATUS_COLOR[ticket.status]    || { bg: '#f1f5f9', text: '#475569' };
  const pc = PRIORITY_COLOR[ticket.priority] || { bg: '#f1f5f9', text: '#475569' };
  const canChangeStatus = ['admin', 'helpdesk', 'staff'].includes(user?.role);
  const canSend = ticket.status !== 'closed';
  const isImageFile = (name) => name && /\.(jpg|jpeg|png|gif)$/i.test(name);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.root}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>

          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.ticketMeta}>
              <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
              <Text style={styles.date}>
                {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.title}>{ticket.title}</Text>

            <View style={styles.badgeRow}>
              <TouchableOpacity
                onPress={() => canChangeStatus && setStatusOpen(v => !v)}
                style={[styles.statusBadge, { backgroundColor: sc.bg }]}
                activeOpacity={canChangeStatus ? 0.7 : 1}
              >
                <Text style={[styles.statusText, { color: sc.text }]}>{ticket.status.replace('_', ' ')}</Text>
                {canChangeStatus && <Ionicons name="chevron-down" size={12} color={sc.text} />}
              </TouchableOpacity>
              <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                <Text style={[styles.priorityText, { color: pc.text }]}>{ticket.priority}</Text>
              </View>
            </View>

            {statusOpen && (
              <View style={styles.dropdown}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity key={s} style={styles.dropItem} onPress={() => updateStatus(s)}>
                    <Text style={[styles.dropItemText, ticket.status === s && { color: Colors.primary, fontWeight: '700' }]}>
                      {s.replace('_', ' ')}
                    </Text>
                    {ticket.status === s && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="grid-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailVal}>{ticket.category || '—'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Raised by</Text>
              <Text style={styles.detailVal}>{ticket.raised_by_name || '—'}</Text>
            </View>
            {ticket.assigned_to_name && (
              <>
                <Divider />
                <View style={styles.detailRow}>
                  <Ionicons name="person-add-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.detailLabel}>Assigned to</Text>
                  <Text style={styles.detailVal}>{ticket.assigned_to_name}</Text>
                </View>
              </>
            )}
            {ticket.location && (
              <>
                <Divider />
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailVal}>{ticket.location}</Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          {ticket.description && (
            <View style={styles.descCard}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{ticket.description}</Text>
            </View>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <>
              <Text style={styles.repliesLabel}>Conversation ({replies.length})</Text>
              {replies.map(r => {
                const isMe = r.updated_by === user?.id;
                return (
                  <View key={r.id} style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    {!isMe && <Text style={styles.bubbleName}>{r.updater_name}</Text>}
                    {r.message !== '📎 Attachment' && (
                      <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{r.message}</Text>
                    )}
                    {/* Attachment preview */}
                    {r.attachment && (
                      <TouchableOpacity style={styles.attachPreview} onPress={() => openAttachment(r.attachment)}>
                        {isImageFile(r.attachment) ? (
                          <Image
                            source={{ uri: `${SERVER_BASE}/uploads/${r.attachment}` }}
                            style={styles.attachImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.attachFile}>
                            <Ionicons name="document-outline" size={22} color={isMe ? '#fff' : Colors.primary} />
                            <Text style={[styles.attachFileName, isMe && { color: '#fff' }]} numberOfLines={1}>
                              {r.attachment}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.attachTap, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                          Tap to open
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                      {new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Reply bar */}
        {canSend && (
          <View style={styles.replyBar}>
            <View style={styles.inputWrap}>
              {/* Attachment preview strip */}
              {attachment && (
                <View style={styles.attachStrip}>
                  <Ionicons name="attach" size={14} color={Colors.primary} />
                  <Text style={styles.attachStripText} numberOfLines={1}>{attachment.name}</Text>
                  <TouchableOpacity onPress={() => setAttachment(null)}>
                    <Ionicons name="close-circle" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.replyInput}
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Type a reply..."
                  placeholderTextColor={Colors.textLight}
                  multiline
                  maxLength={1000}
                />
                {/* Attach buttons */}
                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                  <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
                  <Ionicons name="document-attach-outline" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, (!reply.trim() && !attachment || sending) && styles.sendBtnDisabled]}
              onPress={sendReply}
              disabled={(!reply.trim() && !attachment) || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 20 },

  headerCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  ticketMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketNum: { fontSize: 12, color: Colors.textLight, fontFamily: 'monospace', fontWeight: '700' },
  date: { fontSize: 11, color: Colors.textLight },
  title: { fontSize: Fonts.lg, fontWeight: '800', color: Colors.text, marginBottom: 12, lineHeight: 24 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  priorityText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  dropdown: {
    marginTop: 10, backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dropItemText: { fontSize: Fonts.base, color: Colors.text, textTransform: 'capitalize' },

  detailCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  detailLabel: { fontSize: Fonts.sm, color: Colors.textMuted, width: 80 },
  detailVal: { flex: 1, fontSize: Fonts.sm, fontWeight: '600', color: Colors.text },

  descCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 10,
  },
  descLabel: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 },
  descText: { fontSize: Fonts.base, color: Colors.text, lineHeight: 22 },

  repliesLabel: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, marginTop: 4 },
  bubble: {
    maxWidth: '82%', borderRadius: Radius.lg, padding: 12, marginBottom: 8,
  },
  bubbleMe: {
    alignSelf: 'flex-end', backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  bubbleName: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 3 },
  bubbleText: { fontSize: Fonts.base, color: Colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: Colors.textLight, marginTop: 4, alignSelf: 'flex-end' },

  attachPreview: { marginTop: 4, marginBottom: 2 },
  attachImage: { width: 180, height: 120, borderRadius: Radius.md, marginBottom: 4 },
  attachFile: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  attachFileName: { flex: 1, fontSize: Fonts.sm, color: Colors.primary, fontWeight: '600' },
  attachTap: { fontSize: 10, color: Colors.textLight },

  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  inputWrap: { flex: 1 },
  attachStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  attachStripText: { flex: 1, fontSize: Fonts.sm, color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 4,
  },
  replyInput: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: Fonts.base, color: Colors.text, maxHeight: 120,
  },
  attachBtn: { padding: 8 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
