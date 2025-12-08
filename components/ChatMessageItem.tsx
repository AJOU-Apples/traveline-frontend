import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import type { ChatMessageDto } from '../src/types/chat.types';
import { getFullImageUrl } from '../src/utils/travelPlanApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_MESSAGE_WIDTH = SCREEN_WIDTH * 0.6;

interface ChatMessageItemProps {
    message: ChatMessageDto;
    isOwnMessage: boolean;
    showAvatar: boolean;
    showTime: boolean;
}

// 시간 포맷팅 함수
const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const timeString = `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;

    if (messageDate.getTime() === today.getTime()) {
        return timeString;
    } else if (messageDate.getTime() === yesterday.getTime()) {
        return `어제 ${timeString}`;
    } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} ${timeString}`;
    }
};

export default function ChatMessageItem({ message, isOwnMessage, showAvatar, showTime }: ChatMessageItemProps) {
    return (
        <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
            {!isOwnMessage && (
                <View style={styles.leftColumn}>
                    {showAvatar && (
                        <View style={styles.leftSection}>
                            <View style={styles.avatarContainer}>
                                {message.user.profileImageUrl ? (
                                    <Image
                                        source={{ uri: getFullImageUrl(message.user.profileImageUrl) }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <MaterialIcons name="person" size={16} color="#fff" />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.userName}>{message.user.name || message.user.username}</Text>
                        </View>
                    )}
                    <View style={[styles.messageContent, styles.otherMessageContent]}>
                        <View style={styles.bubbleWrapper}>
                            <View style={[styles.messageBubble, styles.otherMessageBubble]}>
                                <Text style={styles.otherMessageText}>
                                    {message.message}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {isOwnMessage && (
                <View style={styles.rightColumn}>
                    {showAvatar && (
                        <View style={styles.rightSection}>
                            <Text style={styles.userName}>{message.user.name || message.user.username}</Text>
                            <View style={styles.avatarContainer}>
                                {message.user.profileImageUrl ? (
                                    <Image
                                        source={{ uri: getFullImageUrl(message.user.profileImageUrl) }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <MaterialIcons name="person" size={12} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                    <View style={[styles.messageContent, styles.ownMessageContent]}>
                        <View style={styles.bubbleWrapper}>
                            <View style={[styles.messageBubble, styles.ownMessageBubble]}>
                                <Text style={styles.ownMessageText}>
                                    {message.message}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 30,
        alignItems: 'flex-end',
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    leftColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginRight: 12,
    },
    rightColumn: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    avatarContainer: {
        alignSelf: 'flex-end',
    },
    avatar: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#C7C7C7',
    },
    avatarPlaceholder: {
        width: 16,
        height: 16,
        borderRadius: 6,
        backgroundColor: '#C7C7C7',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    messageContent: {
        maxWidth: MAX_MESSAGE_WIDTH,
        minWidth: 0,
        flexShrink: 1,
        alignSelf: 'flex-start',
    },
    ownMessageContent: {
        alignItems: 'flex-end',
        alignSelf: 'flex-end',
    },
    otherMessageContent: {
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: -0.15,
        color: '#000',
    },
    bubbleWrapper: {
        position: 'relative',
    },
    messageBubble: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        minWidth: 0,
        maxWidth: MAX_MESSAGE_WIDTH,
    },
    ownMessageBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    otherMessageBubble: {
        backgroundColor: '#088CDA',
    },
    messageText: {
        fontSize: 20,
        lineHeight: 20,
        letterSpacing: -0.2,
        fontWeight: '700',
    },
    ownMessageText: {
        color: '#000',
        fontSize: 16,
    },
    otherMessageText: {
        color: '#fff',
        fontSize: 16,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    ownTimeText: {
        color: '#9E9E9E',
    },
    otherTimeText: {
        color: '#9E9E9E',
    },
});

