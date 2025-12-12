import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { supabase } from '@/services/supabase';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function ResetPasswordScreen() {
    const insets = useSafeAreaInsets();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            // Success
            router.replace('/');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your new password below.</Text>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={colors.dark.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.form}>
                    <Input
                        label="New Password"
                        placeholder="Enter new password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password-new"
                        activeBorderColor="#fff"
                        inactiveBorderColor="rgba(255,255,255,0.1)"
                        inputStyle={{ color: '#fff' }}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoComplete="password-new"
                        activeBorderColor="#fff"
                        inactiveBorderColor="rgba(255,255,255,0.1)"
                        inputStyle={{ color: '#fff' }}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                    />

                    <Button
                        label="Update Password"
                        onPress={handleResetPassword}
                        loading={loading}
                        fullWidth
                        style={[styles.button, { backgroundColor: '#fff' }]}
                        textStyle={{ color: '#000', fontWeight: '600' }}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        color: '#fff',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: 'rgba(255,255,255,0.6)',
    },
    form: {
        gap: spacing.md,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    errorText: {
        ...typography.bodySmall,
        color: colors.dark.error,
        flex: 1,
    },
    button: {
        marginTop: spacing.sm,
    },
});
