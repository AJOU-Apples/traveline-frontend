import React from 'react';
import { View, StyleSheet, ScrollView, FlatList, Dimensions } from 'react-native';
import { Text, FAB, Surface, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../src/context/UserContext';
import TravelCard from '../components/TravelCard';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;
const horizontalCardWidth = 200;

const ddays = (iso: string) => {
    const now = new Date();
    const target = new Date(iso);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

export default function LandingPage() {
    const { username, upcomingTrip, popularTrips, recentTrips } = useUser();
    const d = upcomingTrip ? ddays(upcomingTrip.startDate) : null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text variant="headlineMedium" style={styles.brand}>Traveline</Text>
                    <View style={styles.headerIcons}>
                        <IconButton
                            icon={(props) => <Feather name="search" size={24} color="#000" />}
                            onPress={() => {
                            }}
                            size={24}
                        />
                        <IconButton
                            icon={(props) => <Feather name="bell" size={24} color="#000" />}
                            onPress={() => {
                            }}
                            size={24}
                        />
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>
                        <Text style={styles.primary}>{username}</Text>
                        <Text style={styles.greetingNormal}>님,</Text>
                    </Text>
                    <Text style={styles.greetingText}>설레는 여행이 다가오고 있어요.</Text>
                </View>

                {/* D-day Highlight */}
                {upcomingTrip && (
                    <View style={styles.ddayContainer}>
                        <Text style={styles.ddayText}>
                            {upcomingTrip.destination} 여행, D-{d}
                        </Text>
                    </View>
                )}

                <Surface style={styles.highlightBox} elevation={0}>
                    <View style={styles.highlightHeader}>
                        <Text style={styles.highlightText}>
                            <Text style={styles.primary}>{username}</Text>
                            <Text style={styles.highlightNormal}>님, 떠날 준비되셨나요?</Text>
                        </Text>
                        <Text style={styles.highlightSub}>모두가 주목한 인기 여행이에요.</Text>
                    </View>

                    {/* Popular Trips - 인기 여행 */}
                    <View style={styles.horizontalScrollSection}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.cardList}
                            data={popularTrips}
                            renderItem={({ item }) => <TravelCard trip={item} width={horizontalCardWidth} />}
                            keyExtractor={(item) => item.id}
                        />
                    </View>

                    {/* Latest section - 최신 여행기 */}
                    <Text style={styles.sectionTitle}>최신 여행기</Text>
                    <View style={styles.horizontalScrollSection}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.cardList}
                            data={recentTrips}
                            renderItem={({ item }) => <TravelCard trip={item} width={horizontalCardWidth} />}
                            keyExtractor={(item) => item.id}
                        />
                    </View>
                </Surface>
            </ScrollView>

            <LinearGradient
                colors={['#0BB4FE', '#5FE2BE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fab}
            >
                <View style={styles.fabContent}>
                    <Feather name="plus-circle" size={16} color="#fff" />
                    <Text style={styles.fabText}>새 일정 추가</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scroll: {
        padding: 20,
        paddingTop: 44,
        paddingBottom: 120
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28
    },
    brand: {
        fontWeight: '600',
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#000'
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8
    },
    greetingSection: {
        marginBottom: 24
    },
    greetingText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2
    },
    greetingNormal: {
        color: '#000',
        fontWeight: '400'
    },
    primary: {
        color: '#176ADA',
        fontWeight: '600'
    },
    ddayContainer: {
        alignItems: 'flex-end',
        marginBottom: 16
    },
    ddayText: {
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: -0.3,
        color: '#176ADA',
        fontWeight: '600'
    },
    highlightBox: {
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#fff'
    },
    highlightHeader: {
        marginBottom: 8
    },
    highlightText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2
    },
    highlightNormal: {
        color: '#000',
        fontWeight: '400'
    },
    highlightSub: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        color: '#000',
        fontWeight: '400',
        marginTop: 2
    },
    horizontalScrollSection: {
        width: '100%',
    },
    cardList: {
        paddingVertical: 10,
        paddingHorizontal: 2,
        gap: 8
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
        color: '#000'
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 15,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4
    },
    fabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: -0.2,
        lineHeight: 20
    }
});
