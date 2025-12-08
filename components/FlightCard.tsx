import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { Flight } from '../src/context/UserContext';

type FlightCardProps = {
    flight: Flight;
    onMorePress?: () => void;
    onLikePress?: () => void;
};

export default function FlightCard({ flight, onMorePress, onLikePress }: FlightCardProps) {
    const fullFlightNumber = `${flight.airline}${flight.flightNumber}`;
    const isSelected = flight.isSelected || false;
    const isLiked = flight.isLiked === true;
    const parseDateTime = (value?: string) => {
        if (!value) {
            return { date: undefined as string | undefined, time: undefined as string | undefined };
        }

        if (value.includes('T')) {
            const [datePart, timePartWithZone] = value.split('T');
            const timePart = timePartWithZone.slice(0, 5);
            return { date: datePart, time: timePart };
        }

        return { date: undefined, time: value.slice(0, 5) };
    };

    const addDays = (date: string, days: number) => {
        const [year, month, day] = date.split('-').map(Number);
        if (!year || !month || !day) {
            return date;
        }
        const newDate = new Date(year, month - 1, day);
        newDate.setDate(newDate.getDate() + days);
        const yyyy = newDate.getFullYear();
        const mm = String(newDate.getMonth() + 1).padStart(2, '0');
        const dd = String(newDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatted = (() => {
        const { date: departureDatePart, time: departureTimePart } = parseDateTime(flight.departureTime);
        const { date: arrivalDatePart, time: arrivalTimePart } = parseDateTime(flight.arrivalTime);

        const departureDate = flight.departureDate || departureDatePart;
        const arrivalDate = flight.arrivalDate || arrivalDatePart;
        const departureTimeDisplay = departureTimePart || flight.departureTime;
        const arrivalTimeDisplay = arrivalTimePart || flight.arrivalTime;

        let computedDuration = flight.duration;
        if (!computedDuration && departureTimePart && arrivalTimePart) {
            const baseDepartureDate = departureDate || arrivalDate;
            const resolvedDepartureDate = baseDepartureDate || arrivalDate || '';
            const resolvedArrivalDate = arrivalDate || resolvedDepartureDate;

            if (resolvedDepartureDate) {
                const departureDateTime = new Date(`${resolvedDepartureDate}T${departureTimePart}:00`);
                const arrivalDateCandidate =
                    resolvedArrivalDate ||
                    (departureTimePart > arrivalTimePart ? addDays(resolvedDepartureDate, 1) : resolvedDepartureDate);
                const arrivalDateTime = new Date(`${arrivalDateCandidate}T${arrivalTimePart}:00`);

                if (!Number.isNaN(departureDateTime.getTime()) && !Number.isNaN(arrivalDateTime.getTime())) {
                    let diffMinutes = Math.round((arrivalDateTime.getTime() - departureDateTime.getTime()) / 60000);
                    if (diffMinutes < 0) {
                        diffMinutes += 24 * 60;
                    }
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    computedDuration = `${hours}시간 ${minutes}분`;
                }
            }
        }

        return {
            departureDate,
            arrivalDate,
            departureTime: departureTimeDisplay,
            arrivalTime: arrivalTimeDisplay,
            duration: computedDuration,
            likes: flight.likes ?? 0,
            isLiked,
        };
    })();

    return (
        <View style={styles.container}>
            <View style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.content}>
                    <View style={styles.flightNumberRow}>
                        {isSelected && (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>selected</Text>
                            </View>
                        )}
                        <Text style={styles.flightNumber}>{fullFlightNumber}</Text>
                    </View>
                    <Text style={styles.route}>
                        {flight.departureAirport}({flight.departureAirportCode})
                        → {flight.arrivalAirport}({flight.arrivalAirportCode})
                    </Text>
                    <Text style={styles.time}>
                        {formatted.departureTime} - {formatted.arrivalTime}
                        {formatted.duration && ` (${formatted.duration} 소요)`}
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
                            color={formatted.isLiked ? "#ff4444" : "#585858"}
                            fill={formatted.isLiked ? "#ff4444" : "none"}
                        />
                        <Text style={styles.likesText}>좋아요</Text>
                        <Text style={[styles.likesCount, formatted.isLiked && styles.likesCountActive]}>
                            {formatted.likes}
                        </Text>
                    </TouchableOpacity>
                    {formatted.departureDate ? (
                        <Text style={styles.date}>
                            출발일 {formatted.departureDate.replace(/-/g, '.')}
                        </Text>
                    ) : null}
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
    flightNumberRow: {
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

