import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from 'react-native-paper';
import {Feather} from '@expo/vector-icons';
import {Flight} from '../src/context/UserContext';

type FlightCardProps = {
    flight: Flight;
    onMorePress?: () => void;
};

export default function FlightCard({flight, onMorePress}: FlightCardProps) {
    const fullFlightNumber = `${flight.airline}${flight.flightNumber}`;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.content}>
                    <Text style={styles.flightNumber}>{fullFlightNumber}</Text>
                    <Text style={styles.route}>
                        {flight.departureAirport}({flight.departureAirportCode})
                        → {flight.arrivalAirport}({flight.arrivalAirportCode})
                    </Text>
                    <Text style={styles.time}>
                        {flight.departureTime} - {flight.arrivalTime}
                        {flight.duration && ` (${flight.duration} 소요)`}
                    </Text>
                </View>
                <View style={styles.footer}>
                    <View style={styles.likes}>
                        <Feather name="heart" size={12} color="#585858"/>
                        <Text style={styles.likesText}>좋아요</Text>
                        <Text style={styles.likesCount}>{flight.likes || 0}</Text>
                    </View>
                    <Text style={styles.date}>출발일 {flight.departureDate.replace(/-/g, '.')}</Text>
                </View>
            </View>
            {onMorePress && (
                <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
                    <Feather name="more-horizontal" size={24} color="#000"/>
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
    },
    content: {
        gap: 8,
        marginBottom: 16,
    },
    flightNumber: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
        fontWeight: '800',
        color: '#000',
    },
    route: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.15,
        color: '#585858',
    },
    time: {
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

