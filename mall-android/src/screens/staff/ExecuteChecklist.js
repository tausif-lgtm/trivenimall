import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LoadingScreen } from '../../components';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

export default function ExecuteChecklist({ route, navigation }) {
  const { scheduleId } = route.params;
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notes,    setNotes]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);

  const load = async () => {
    try {
      const r = await api.get(`/checklists/schedules/${scheduleId}`);
      const s = r.data.data;
      setSchedule(s);
      setNotes(s.notes || '');
    } catch {
      Alert.alert('Error', 'Failed to load checklist.');
      navigation.goBack();
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [scheduleId]);

  const isLocked = schedule?.status === 'completed' || schedule?.status === 'missed';

  const toggleItem = async (item) => {
    if (isLocked) return;
    setUpdatingItem(item.id);
    try {
      const newVal = item.is_completed ? 0 : 1;
      await api.patch(`/checklists/schedules/${scheduleId}/items/${item.id}`, {
        is_completed: newVal,
      });
      setSchedule(prev => ({
        ...prev,
        items: prev.items.map(i =>
          i.id === item.id ? { ...i, is_completed: newVal === 1 } : i
        ),
      }));
    } catch {
      Alert.alert('Error', 'Could not update item.');
    }
    setUpdatingItem(null);
  };

  const saveRemark = async (item, remark) => {
    if (isLocked) return;
    try {
      await api.patch(`/checklists/schedules/${scheduleId}/items/${item.id}`, { remark });
      setSchedule(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, remark } : i),
      }));
    } catch {}
  };

  const pickPhoto = async (item) => {
    if (isLocked) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const form  = new FormData();
    form.append('photo', {
      uri:  asset.uri,
      name: `item_${item.id}.jpg`,
      type: 'image/jpeg',
    });

    try {
      setUpdatingItem(item.id);
      await api.patch(
        `/checklists/schedules/${scheduleId}/items/${item.id}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setSchedule(prev => ({
        ...prev,
        items: prev.items.map(i =>
          i.id === item.id ? { ...i, photo_url: asset.uri } : i
        ),
      }));
    } catch {
      Alert.alert('Error', 'Photo upload failed.');
    }
    setUpdatingItem(null);
  };

  const submit = async () => {
    if (isLocked) return;
    const items  = schedule?.items || [];
    const done   = items.filter(i => i.is_completed).length;
    if (done < items.length) {
      Alert.alert(
        'Incomplete Checklist',
        `${items.length - done} item(s) not marked. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/checklists/schedules/${scheduleId}/submit`, { notes });
      Alert.alert('Submitted!', 'Checklist submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Submit failed.');
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingScreen />;
  if (!schedule) return null;

  const items    = schedule.items || [];
  const done     = items.filter(i => i.is_completed).length;
  const pct      = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{schedule.template_title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, {
              backgroundColor: isLocked ? '#dcfce7' : schedule.status === 'in_progress' ? '#dbeafe' : '#fef9c3'
            }]}>
              <Text style={[styles.statusText, {
                color: isLocked ? '#166534' : schedule.status === 'in_progress' ? '#1e40af' : '#854d0e'
              }]}>
                {schedule.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${pct}%`,
                backgroundColor: pct === 100 ? Colors.success : Colors.primary,
              }]} />
            </View>
            <Text style={styles.progressTxt}>{done}/{items.length}</Text>
          </View>
        </View>

        {isLocked && (
          <View style={styles.lockedBanner}>
            <Ionicons name={schedule.status === 'completed' ? 'checkmark-circle' : 'alert-circle'} size={18} color="#fff" />
            <Text style={styles.lockedText}>
              {schedule.status === 'completed' ? 'Checklist completed' : 'This checklist was missed'}
            </Text>
          </View>
        )}

        {/* Items */}
        <Text style={styles.sectionLabel}>Checklist Items</Text>
        {items.map((item, idx) => (
          <ChecklistItem
            key={item.id}
            item={item}
            idx={idx}
            isLocked={isLocked}
            updating={updatingItem === item.id}
            onToggle={() => toggleItem(item)}
            onRemark={(r) => saveRemark(item, r)}
            onPhoto={() => pickPhoto(item)}
          />
        ))}

        {/* Notes */}
        {!isLocked && (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Submission Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes or observations..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {schedule.notes && isLocked && (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Submission Notes</Text>
            <Text style={styles.notesStatic}>{schedule.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit button */}
      {!isLocked && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Submit Checklist</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ChecklistItem({ item, idx, isLocked, updating, onToggle, onRemark, onPhoto }) {
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkText, setRemarkText] = useState(item.remark || '');

  return (
    <View style={[styles.item, item.is_completed && styles.itemDone]}>
      {/* Checkbox row */}
      <TouchableOpacity
        style={styles.itemRow}
        onPress={onToggle}
        disabled={isLocked || updating}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.is_completed && styles.checkboxDone]}>
          {updating
            ? <ActivityIndicator size="small" color="#fff" />
            : item.is_completed && <Ionicons name="checkmark" size={14} color="#fff" />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemNum}>#{idx + 1}</Text>
          <Text style={[styles.itemText, item.is_completed && styles.itemTextDone]}>
            {item.item_text}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      {!isLocked && (
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setRemarkOpen(v => !v)}
          >
            <Ionicons name="chatbubble-outline" size={15} color={remarkText ? Colors.primary : Colors.textLight} />
            <Text style={[styles.actionTxt, remarkText && { color: Colors.primary }]}>Remark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onPhoto}>
            <Ionicons name="camera-outline" size={15} color={item.photo_url ? Colors.primary : Colors.textLight} />
            <Text style={[styles.actionTxt, item.photo_url && { color: Colors.primary }]}>Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Remark input */}
      {remarkOpen && !isLocked && (
        <View style={styles.remarkBox}>
          <TextInput
            style={styles.remarkInput}
            value={remarkText}
            onChangeText={setRemarkText}
            placeholder="Add remark..."
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity
            style={styles.remarkSave}
            onPress={() => { onRemark(remarkText); setRemarkOpen(false); }}
          >
            <Text style={styles.remarkSaveTxt}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Existing remark (read-only or locked) */}
      {item.remark && (isLocked || !remarkOpen) && (
        <Text style={styles.remarkStatic}>💬 {item.remark}</Text>
      )}

      {/* Photo indicator */}
      {item.photo_url && (
        <View style={styles.photoRow}>
          <Ionicons name="image-outline" size={14} color={Colors.info} />
          <Text style={styles.photoTxt}>Photo attached</Text>
        </View>
      )}

      {/* Completion time */}
      {item.completed_at && (
        <Text style={styles.completedAt}>
          ✅ {new Date(item.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 100 },

  headerCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  title: { fontSize: Fonts.lg, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  dateText: { fontSize: Fonts.sm, color: Colors.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressTxt: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.text, width: 36 },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
  },
  lockedText: { color: '#fff', fontWeight: '700', fontSize: Fonts.sm },

  sectionLabel: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },

  item: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  itemDone: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  itemNum: { fontSize: 11, color: Colors.textLight, marginBottom: 1 },
  itemText: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text },
  itemTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },

  itemActions: { flexDirection: 'row', gap: 12, marginTop: 8, paddingLeft: 38 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionTxt: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },

  remarkBox: { marginTop: 8, paddingLeft: 38 },
  remarkInput: {
    backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: 10,
    fontSize: Fonts.sm, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  remarkSave: {
    alignSelf: 'flex-end', marginTop: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.sm,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  remarkSaveTxt: { color: '#fff', fontWeight: '700', fontSize: Fonts.sm },
  remarkStatic: { fontSize: Fonts.sm, color: Colors.textMuted, marginTop: 6, paddingLeft: 38, fontStyle: 'italic' },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 38 },
  photoTxt: { fontSize: 12, color: Colors.info },
  completedAt: { fontSize: 11, color: Colors.success, marginTop: 4, paddingLeft: 38 },

  notesCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14,
    marginTop: 4, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  notesLabel: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 8 },
  notesInput: {
    fontSize: Fonts.base, color: Colors.text, minHeight: 72,
    textAlignVertical: 'top',
  },
  notesStatic: { fontSize: Fonts.base, color: Colors.text },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: Radius.lg,
    paddingVertical: 15,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: Fonts.base },
});
