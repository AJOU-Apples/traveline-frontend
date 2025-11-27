import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

interface ChatInputProps {
    onSend: (message: string) => Promise<void>;
    isSending?: boolean;
    maxLength?: number;
}

const MAX_MESSAGE_LENGTH = 1000;

export default function ChatInput({ onSend, isSending = false, maxLength = MAX_MESSAGE_LENGTH }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSend = useCallback(async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isSending) return;

        try {
            await onSend(trimmedMessage);
            setMessage('');
            Keyboard.dismiss();
        } catch (error) {
            console.error('Failed to send message:', error);
            // 에러는 상위 컴포넌트에서 처리
        }
    }, [message, isSending, onSend]);

    // React Native에서는 키보드 이벤트가 다르게 동작하므로
    // onSubmitEditing을 사용하거나 별도 처리 필요

    const remainingChars = maxLength - message.length;
    const isNearLimit = remainingChars < 100;

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="메시지를 입력하세요..."
                    placeholderTextColor="#9E9E9E"
                    multiline
                    maxLength={maxLength}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={!isSending}
                    blurOnSubmit={false}
                />
                {isNearLimit && (
                    <Text style={styles.charCount}>{remainingChars}</Text>
                )}
            </View>
            <TouchableOpacity
                style={[styles.sendButton, (!message.trim() || isSending) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || isSending}
            >
                {isSending ? (
                    <Text style={styles.sendButtonText}>전송중...</Text>
                ) : (
                    <Text style={styles.sendButtonText}>보내기</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginRight: 8,
        minHeight: 40,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: '#088CDA',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        maxHeight: 80,
        padding: 0,
        fontWeight: '600',
    },
    charCount: {
        fontSize: 10,
        color: '#9E9E9E',
        marginLeft: 8,
        alignSelf: 'center',
    },
    sendButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 40,
    },
    sendButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    sendButtonText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
});

