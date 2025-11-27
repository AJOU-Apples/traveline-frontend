import React, { useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useChat } from '../src/hooks/useChat';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import type { ChatMessageDto } from '../src/types/chat.types';

interface ChatRoomProps {
    travelPlanId: string;
    currentUserId?: number;
    enabled?: boolean;
}

export default function ChatRoom({ travelPlanId, currentUserId, enabled = true }: ChatRoomProps) {
    const {
        messages,
        isLoading,
        hasMore,
        isSending,
        wsStatus,
        sendMessage,
        loadMoreMessages,
        reconnect,
    } = useChat({
        travelPlanId,
        enabled,
        onMessageReceived: (message: ChatMessageDto) => {
            // 새 메시지 수신 시 처리 (필요시)
            console.log('New message received:', message);
        },
    });

    const handleSend = useCallback(async (message: string) => {
        try {
            await sendMessage(message);
        } catch (error: any) {
            console.error('Failed to send message:', error);
            throw error; // 상위 컴포넌트에서 에러 처리
        }
    }, [sendMessage]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            loadMoreMessages();
        }
    }, [isLoading, hasMore, loadMoreMessages]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ChatMessageList
                messages={messages}
                currentUserId={currentUserId}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
            />

            <ChatInput
                onSend={handleSend}
                isSending={isSending}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

