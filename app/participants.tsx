import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    Modal,
    Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useUser } from '../src/context/UserContext';
import type { Member } from '../src/types/member.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ParticipantsScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const { getMembersByPlan, authUser } = useUser();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);

    const loadMembers = useCallback(async () => {
        if (!planId) return;

        try {
            setIsLoading(true);
            const fetchedMembers = await getMembersByPlan(planId);
            setMembers(fetchedMembers);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setIsLoading(false);
        }
    }, [planId, getMembersByPlan]);

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [loadMembers])
    );

    const handleCopyInviteLink = async () => {
        try {
            // TODO: Replace with actual invite link from API
            // For now, generate a simple shareable link
            const inviteLink = `traveline://invite/${planId}`;

            await Clipboard.setStringAsync(inviteLink);

            // Show toast
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy invite link:', error);
        }
    };

    // Get current user's member info to identify owner
    const currentUserMember = members.find(m => m.userId === authUser?.id.toString());
    const isOwner = currentUserMember?.role === 'OWNER';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>참여자 {members.length}</Text>
            </View>

            {/* Members List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>로딩 중...</Text>
                    </View>
                ) : (
                    members.map((member, index) => {
                        const isCurrentUser = member.userId === authUser?.id.toString();
                        const isOwnerMember = member.role === 'OWNER';

                        return (
                            <View key={member.id} style={styles.memberItem}>
                                <View style={styles.memberAvatarContainer}>
                                    <MaterialIcons
                                        name="account-circle"
                                        size={32}
                                        color="#C7C7C7"
                                    />
                                    {isOwnerMember && (
                                        <View style={styles.ownerBadge}>
                                            <MaterialIcons name="star" size={16} color="#088CDA" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.memberName}>
                                    {member.name || member.username}
                                    <Text style={styles.memberNameSuffix}>님</Text>
                                </Text>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Copy Invite Link Button */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyInviteLink}
                >
                    <MaterialIcons name="insert-link" size={24} color="#fff" />
                    <Text style={styles.copyButtonText}>초대 링크 복사</Text>
                </TouchableOpacity>
            </View>

            {/* Toast Notification */}
            <Modal
                visible={showToast}
                transparent
                animationType="fade"
                onRequestClose={() => setShowToast(false)}
            >
                <Pressable style={styles.toastOverlay} onPress={() => setShowToast(false)}>
                    <View style={styles.toastContainer}>
                        <MaterialIcons name="check-circle-outline" size={16} color="#fff" />
                        <Text style={styles.toastText}>초대 링크가 복사되었습니다.</Text>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
    },
    backButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: '#9E9E9E',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        minHeight: 32,
    },
    memberAvatarContainer: {
        position: 'relative',
        marginRight: 8,
    },
    ownerBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
    },
    memberNameSuffix: {
        color: '#585858',
    },
    bottomSection: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 40,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    },
    copyButton: {
        backgroundColor: '#088CDA',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 57,
        height: 40,
    },
    copyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.2,
        color: '#fff',
    },
    toastOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 100,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginHorizontal: 20,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        letterSpacing: -0.28,
        color: '#fff',
    },
});

