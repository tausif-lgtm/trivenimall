import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius } from '../lib/theme';
import Toast from 'react-native-toast-message';

const DEMO_CREDS = [
  { label: 'Admin',   email: 'admin@portal.com',    password: 'admin123' },
  { label: 'Staff',   email: 'staff@portal.com',    password: 'admin123' },
  { label: 'Tenant',  email: 'customer@portal.com', password: 'admin123' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const u = await login(email.trim().toLowerCase(), password);
      Toast.show({ type: 'success', text1: `Welcome, ${u.name}!` });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
    }
    setLoading(false);
  };

  const fillDemo = (cred) => { setEmail(cred.email); setPassword(cred.password); setError(''); };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Ionicons name="business" size={42} color="#fff" />
          </View>
          <Text style={styles.appName}>Triveni Mall</Text>
          <Text style={styles.tagline}>Operations Command Centre</Text>
          <Text style={styles.sub}>Alcove Realty · New Kolkata</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to your account</Text>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Demo credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Quick Demo Access</Text>
            <View style={styles.demoRow}>
              {DEMO_CREDS.map(c => (
                <TouchableOpacity key={c.label} onPress={() => fillDemo(c)} style={styles.demoBtn} activeOpacity={0.7}>
                  <Text style={styles.demoBtnText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Triveni Mall · All rights reserved
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 38 },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  sub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: Fonts.sm,
    color: '#b91c1c',
    fontWeight: '500',
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: Fonts.base,
    color: Colors.text,
  },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: Fonts.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  demoLabel: {
    fontSize: Fonts.sm,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  demoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  footer: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 24,
  },
});
