import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { Accommodation } from '../src/context/UserContext';

type AccommodationCardProps = {
    accommodation: Accommodation;
    onMorePress?: () => void;
    onLikePress?: () => void;
};

export default function AccommodationCard({ accommodation, onMorePress, onLikePress }: AccommodationCardProps) {
    const formatDateRange = (checkIn: string, checkOut: string) => {
        return `${checkIn.replace(/-/g, '.')} - ${checkOut.replace(/-/g, '.')}`;
    };

    const isSelected = accommodation.isSelected || false;
    const isLiked = accommodation.isLiked === true;
    const likeCount = accommodation.likes || 0;

    return (
        <View style={styles.container}>
            <View style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.content}>
                    <View style={styles.nameRow}>
                        {isSelected && (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>selected</Text>
                            </View>
                        )}
                        <Text style={styles.name} numberOfLines={1}>
                            {accommodation.name}
                        </Text>
                    </View>
                    <Text style={styles.address} numberOfLines={2}>
                        {accommodation.address}
                    </Text>
                </View>
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.likes}
                        onPress={onLikePress}
                        disabled={!onLikePress}
                        activeOpacity={onLikePress ? 0.7 : 1}
                    >
                        <Feather
                            name="heart"
                            size={12}
                            color={isLiked ? "#ff4444" : "#585858"}
                            fill={isLiked ? "#ff4444" : "none"}
                        />
                        <Text style={styles.likesText}>좋아요</Text>
                        <Text style={[styles.likesCount, isLiked && styles.likesCountActive]}>
                            {likeCount}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.date}>
                        {formatDateRange(accommodation.checkInDate, accommodation.checkOutDate)}
                    </Text>
                </View>
            </View>
            {onMorePress && (
                <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
                    <Feather name="more-horizontal" size={24} color="#000" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ECECEC',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    cardSelected: {
        borderColor: '#088CDA',
        borderWidth: 2,
        backgroundColor: '#F0F8FF',
    },
    content: {
        gap: 8,
        marginBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedBadge: {
        backgroundColor: '#088CDA',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedBadgeText: {
        fontSize: 10,
        lineHeight: 14,
        color: '#fff',
        fontWeight: '600',
    },
    name: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    address: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    likes: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likesText: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    likesCount: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    likesCountActive: {
        color: '#ff4444',
    },
    date: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    moreButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

