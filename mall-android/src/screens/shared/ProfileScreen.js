import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Fonts, Radius } from '../../lib/theme';
import api from '../../lib/api';

const ROLE_LABEL = {
  admin:    { label: 'Administrator', color: '#dc2626' },
  staff:    { label: 'Staff Member',  color: Colors.primary },
  helpdesk: { label: 'Help Desk',     color: '#0891b2' },
  security: { label: 'Security',      color: '#1d4ed8' },
  tenant:   { label: 'Tenant',        color: '#7c3aed' },
  customer: { label: 'Customer',      color: '#16a34a' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [editing,   setEditing]   = useState(false);
  const [name,      setName]      = useState(user?.name || '');
  const [mobile,    setMobile]    = useState(user?.mobile || '');
  const [password,  setPassword]  = useState('');
  const [saving,    setSaving]    = useState(false);

  const rl = ROLE_LABEL[user?.role] || { label: user?.role, color: Colors.textMuted };

  const save = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name is required.'); return; }
    setSaving(true);
    try {
      const body = { name: name.trim(), mobile: mobile.trim() || undefined };
      if (password) body.password = password;
      await api.patch('/auth/profile', body);
      Alert.alert('Saved', 'Profile updated successfully.');
      setEditing(false);
      setPassword('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* Avatar + name */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: rl.color }]}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: rl.color + '20' }]}>
          <Text style={[styles.roleText, { color: rl.color }]}>{rl.label}</Text>
        </View>
        {user?.specialty && (
          <Text style={styles.specialty}>🏷️ {user.specialty}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoVal}>{user?.email}</Text>
          </View>
        </View>
        {user?.mobile && (
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }]}>
            <Ionicons name="call-outline" size={16} color={Colors.textMuted} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoVal}>{user.mobile}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Edit form */}
      {editing ? (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Edit Profile</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>Mobile</Text>
          <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="Mobile number" placeholderTextColor={Colors.textLight} keyboardType="phone-pad" />

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Leave blank to keep current" placeholderTextColor={Colors.textLight} secureTextEntry />

          <View style={styles.editBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setPassword(''); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.editTrigger} onPress={() => setEditing(true)}>
          <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          <Text style={styles.editTriggerText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Triveni Mall Operations v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.xl, padding: 24, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: Fonts.xl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, marginBottom: 6 },
  roleText: { fontSize: 13, fontWeight: '700' },
  specialty: { fontSize: Fonts.sm, color: Colors.textMuted, marginTop: 4 },

  infoCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  infoVal: { fontSize: Fonts.base, fontWeight: '600', color: Colors.text },

  editTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 12,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  editTriggerText: { fontSize: Fonts.base, fontWeight: '700', color: Colors.primary },

  editCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, marginBottom: 12,
  },
  editTitle: { fontSize: Fonts.base, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  label: { fontSize: Fonts.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: Fonts.base, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textMuted, fontWeight: '600', fontSize: Fonts.base },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: Fonts.base },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: Radius.lg, padding: 14,
    borderWidth: 1.5, borderColor: '#fecaca', marginBottom: 24,
  },
  logoutText: { fontSize: Fonts.base, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textLight },
});
