import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Trip } from '../src/context/UserContext';
import { Feather } from '@expo/vector-icons';

type Props = { trip: Trip; width?: number };

export const TravelCard: React.FC<Props> = ({ trip, width }) => {
  return (
    <View style={[styles.card, width ? { width } : undefined]}>
      <ImageBackground source={{ uri: trip.image }} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.labelContainer}>
          <Feather name="users" size={16} color="#fff" />
          <Text style={styles.team}>{trip.teamName}</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  image: {
    width: '100%',
    height: 264,
    justifyContent: 'flex-start',
    padding: 16,
  },
  imageStyle: {
    borderRadius: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  team: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});

export default TravelCard;
