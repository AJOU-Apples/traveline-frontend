import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Pressable} from 'react-native';
import {Text} from 'react-native-paper';
import {useRouter} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {useUser} from '../../src/context/UserContext';
import {useTravelPost} from '../../src/hooks/useTravelPost';

export default function ProfileScreen() {
    const router = useRouter();
    const {authUser, isAuthenticated, logout} = useUser();
    const {getTravelPostByShareCode, isLoading} = useTravelPost();

    const [showShareCodeModal, setShowShareCodeModal] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // 공유 코드로 여행기 조회
    const handleShareCodeSubmit = async () => {
        if (!shareCode.trim()) {
            Alert.alert('알림', '공유 코드를 입력해주세요.');
            return;
        }

        try {
            const post = await getTravelPostByShareCode(shareCode.trim());
            setShowShareCodeModal(false);
            setShareCode('');
            router.push({
                pathname: '/travel-post-detail',
                params: {id: post.id.toString()}
            });
        } catch (error) {
            Alert.alert('오류', '유효하지 않은 공유 코드입니다.');
        }
    };

    const handleLogout = () => {
        setShowSettingsMenu(false);
        Alert.alert(
            '로그아웃',
            '로그아웃 하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/login');
                        } catch (error) {
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.title}>내 정보</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => setShowSettingsMenu(true)}
                >
                    <MaterialIcons name="settings" size={24} color="#000"/>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {isAuthenticated && authUser ? (
                    <>
                        {/* 프로필 카드 */}
                        <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
                            <View style={styles.avatarContainer}>
                                <MaterialIcons name="person" size={50} color="#BDBDBD"/>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.nickname}>{authUser.username}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 메뉴 카드들 */}
                        <View style={styles.menuCardContainer}>
                            {/* 저장된 여행기 (좋아요한 여행기) */}
                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => router.push('/liked-travel-posts')}
                            >
                                <MaterialIcons name="favorite-border" size={24} color="#000"/>
                                <View style={styles.menuCardTextRow}>
                                    <Text style={styles.menuCardText}>저장된 여행기</Text>
                                    <MaterialIcons name="chevron-right" size={20} color="#999"/>
                                </View>
                            </TouchableOpacity>

                            {/* 내 여행기 */}
                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => router.push('/my-travel-posts')}
                            >
                                <MaterialIcons name="menu-book" size={24} color="#000"/>
                                <View style={styles.menuCardTextRow}>
                                    <Text style={styles.menuCardText}>내 여행기</Text>
                                    <MaterialIcons name="chevron-right" size={20} color="#999"/>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* 공유 코드로 여행기 보기 */}
                        <TouchableOpacity
                            style={styles.shareCodeButton}
                            onPress={() => setShowShareCodeModal(true)}
                        >
                            <MaterialIcons name="link" size={20} color="#007AFF"/>
                            <Text style={styles.shareCodeButtonText}>공유 코드로 여행기 보기</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#999"/>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* 게스트 모드 */}
                        <View style={styles.guestCard}>
                            <MaterialIcons name="person-outline" size={60} color="#999"/>
                            <Text style={styles.guestText}>게스트 모드</Text>
                            <Text style={styles.guestSubtext}>로그인하여 더 많은 기능을 이용하세요</Text>
                        </View>

                        {/* 로그인 버튼 */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.loginButtonText}>로그인</Text>
                        </TouchableOpacity>

                        {/* 게스트용 메뉴 카드들 */}
                        <View style={styles.guestMenuCardContainer}>
                            {/* 여행기 둘러보기 */}
                            <TouchableOpacity
                                style={styles.guestMenuCard}
                                onPress={() => router.push('/travel-posts')}
                            >
                                <MaterialIcons name="explore" size={24} color="#007AFF"/>
                                <Text style={styles.guestMenuCardText}>여행기 둘러보기</Text>
                            </TouchableOpacity>

                            {/* 공유 코드로 여행기 보기 */}
                            <TouchableOpacity
                                style={styles.guestMenuCard}
                                onPress={() => setShowShareCodeModal(true)}
                            >
                                <MaterialIcons name="link" size={24} color="#007AFF"/>
                                <Text style={styles.guestMenuCardText}>공유 코드 입력</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* 설정 메뉴 모달 */}
            <Modal
                visible={showSettingsMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettingsMenu(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowSettingsMenu(false)}
                >
                    <Pressable style={styles.settingsMenuContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.settingsMenuTitle}>설정</Text>

                        {/* 여행기 둘러보기 */}
                        <TouchableOpacity
                            style={styles.settingsMenuItem}
                            onPress={() => {
                                setShowSettingsMenu(false);
                                router.push('/travel-posts');
                            }}
                        >
                            <MaterialIcons name="explore" size={20} color="#007AFF"/>
                            <Text style={styles.settingsMenuItemText}>여행기 둘러보기</Text>
                        </TouchableOpacity>

                        {/* 로그아웃 */}
                        {isAuthenticated && (
                            <TouchableOpacity
                                style={styles.settingsMenuItem}
                                onPress={handleLogout}
                            >
                                <MaterialIcons name="logout" size={20} color="#FF3B30"/>
                                <Text style={[styles.settingsMenuItemText, {color: '#FF3B30'}]}>로그아웃</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.settingsCloseButton}
                            onPress={() => setShowSettingsMenu(false)}
                        >
                            <Text style={styles.settingsCloseButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* 공유 코드 입력 모달 */}
            <Modal
                visible={showShareCodeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShareCodeModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowShareCodeModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>공유 코드 입력</Text>
                        <Text style={styles.modalSubtitle}>공유받은 여행기 코드를 입력해주세요</Text>
                        <TextInput
                            style={styles.shareCodeInput}
                            value={shareCode}
                            onChangeText={setShareCode}
                            placeholder="공유 코드 입력"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowShareCodeModal(false);
                                    setShareCode('');
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmButton, isLoading && styles.modalConfirmButtonDisabled]}
                                onPress={handleShareCodeSubmit}
                                disabled={isLoading}
                            >
                                <Text style={styles.modalConfirmButtonText}>
                                    {isLoading ? '확인 중...' : '확인'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    settingsButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    nickname: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    editProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editProfileText: {
        fontSize: 14,
        color: '#999',
    },
    menuCardContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    menuCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    menuCardTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    menuCardText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    shareCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    shareCodeButtonText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
        marginLeft: 8,
    },
    guestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    guestText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    guestSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    guestMenuCardContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    guestMenuCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        gap: 8,
    },
    guestMenuCardText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#007AFF',
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    shareCodeInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalCancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    modalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    modalConfirmButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    modalConfirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    modalConfirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // 설정 메뉴 모달 스타일
    settingsMenuContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 340,
    },
    settingsMenuTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 20,
        textAlign: 'center',
    },
    settingsMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingsMenuItemText: {
        fontSize: 16,
        color: '#007AFF',
        marginLeft: 12,
        fontWeight: '500',
    },
    settingsCloseButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    settingsCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});
