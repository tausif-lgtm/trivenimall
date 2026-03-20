import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const CATEGORIES = ['Electrical', 'Plumbing', 'HVAC', 'Cleaning', 'Security', 'Lift/Escalator', 'Parking', 'General', 'IT/Telecom', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_STYLE = {
  low:    { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  medium: { bg: '#fefce8', text: '#854d0e', border: '#fde68a' },
  high:   { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  urgent: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
};

export default function NewTicket() {
  const navigation = useNavigation();
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [priority,    setPriority]    = useState('medium');
  const [location,    setLocation]    = useState('');
  const [catOpen,     setCatOpen]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }
    if (!category)     { Alert.alert('Validation', 'Please select a category.'); return; }

    setSubmitting(true);
    try {
      await api.post('/tickets', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: location.trim() || undefined,
      });
      Alert.alert('Ticket Raised!', 'Your ticket has been submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit ticket.');
    }
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief description of the issue"
          placeholderTextColor={Colors.textLight}
          maxLength={200}
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity style={styles.select} onPress={() => setCatOpen(v => !v)}>
          <Text style={category ? styles.selectVal : styles.selectPlaceholder}>
            {category || 'Select category'}
          </Text>
          <Ionicons name={catOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textLight} />
        </TouchableOpacity>
        {catOpen && (
          <View style={styles.dropdown}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={styles.dropItem}
                onPress={() => { setCategory(c); setCatOpen(false); }}>
                <Text style={[styles.dropText, category === c && styles.dropTextActive]}>{c}</Text>
                {category === c && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map(p => {
            const ps = PRIORITY_STYLE[p];
            return (
              <TouchableOpacity
                key={p}
                style={[styles.priorityChip, { backgroundColor: ps.bg, borderColor: priority === p ? ps.text : ps.border }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityText, { color: ps.text }, priority === p && { fontWeight: '800' }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Floor, shop number, area (optional)"
          placeholderTextColor={Colors.textLight}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Raise Ticket</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: Fonts.base, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  select: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border,
  },
  selectVal: { fontSize: Fonts.base, color: Colors.text, fontWeight: '600' },
  selectPlaceholder: { fontSize: Fonts.base, color: Colors.textLight },
  dropdown: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginTop: 4,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dropText: { fontSize: Fonts.base, color: Colors.text },
  dropTextActive: { color: Colors.primary, fontWeight: '700' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 1.5,
  },
  priorityText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 15, marginTop: 24,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: Fonts.base },
});
