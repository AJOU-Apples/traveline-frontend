import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import ChatMessageItem from './ChatMessageItem';
import type { ChatMessageDto } from '../src/types/chat.types';

interface ChatMessageListProps {
    messages: ChatMessageDto[];
    currentUserId?: number;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onMessageReceived?: (message: ChatMessageDto) => void;
}

export default function ChatMessageList({
    messages,
    currentUserId,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    onMessageReceived,
}: ChatMessageListProps) {
    const flatListRef = useRef<FlatList>(null);
    const shouldScrollToEndRef = useRef(true);

    // 새 메시지 수신 시 스크롤 처리
    useEffect(() => {
        // 메시지가 추가될 때마다 최신 메시지로 스크롤
        if (messages.length > 0 && shouldScrollToEndRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    // 메시지 그룹핑: 같은 사용자의 연속 메시지는 프로필 이미지 한 번만 표시
    const shouldShowAvatar = (index: number): boolean => {
        if (index === 0) return true;
        const currentMessage = messages[index];
        const previousMessage = messages[index - 1];
        
        // 다른 사용자이거나 5분 이상 차이나면 프로필 표시
        if (currentMessage.user.id !== previousMessage.user.id) return true;
        
        const currentTime = new Date(currentMessage.createdAt).getTime();
        const previousTime = new Date(previousMessage.createdAt).getTime();
        const timeDiff = currentTime - previousTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        return timeDiff > fiveMinutes;
    };

    // 시간 표시 여부 결정
    const shouldShowTime = (index: number): boolean => {
        if (index === messages.length - 1) return true; // 마지막 메시지는 항상 시간 표시
        
        const currentMessage = messages[index];
        const nextMessage = messages[index + 1];
        
        // 다음 메시지와 5분 이상 차이나면 시간 표시
        const currentTime = new Date(currentMessage.createdAt).getTime();
        const nextTime = new Date(nextMessage.createdAt).getTime();
        const timeDiff = nextTime - currentTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        return timeDiff > fiveMinutes;
    };

    const renderMessage = ({ item, index }: { item: ChatMessageDto; index: number }) => {
        const isOwnMessage = currentUserId ? item.user.id === currentUserId : false;
        const showAvatar = shouldShowAvatar(index);
        const showTime = shouldShowTime(index);

        return (
            <ChatMessageItem
                message={item}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                showTime={showTime}
            />
        );
    };

    const handleScroll = (event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isNearTop = contentOffset.y < 100;
        
        // 상단에 가까우면 과거 메시지 로드
        if (isNearTop && hasMore && !isLoading && onLoadMore) {
            shouldScrollToEndRef.current = false;
            onLoadMore();
        }
        
        // 하단에 가까우면 자동 스크롤 활성화
        const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
        if (isNearBottom) {
            shouldScrollToEndRef.current = true;
        }
    };

    const renderFooter = () => {
        if (!isLoading) return null;
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#088CDA" />
                <Text style={styles.loadingText}>메시지를 불러오는 중...</Text>
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 메시지가 없습니다</Text>
                <Text style={styles.emptySubtext}>첫 메시지를 보내보세요!</Text>
            </View>
        );
    };

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id}-${item.createdAt}-${index}`}
            onScroll={handleScroll}
            onContentSizeChange={() => {
                if (shouldScrollToEndRef.current) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }
            }}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            inverted={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    listContent: {
        paddingVertical: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#C7C7C7',
    },
});

