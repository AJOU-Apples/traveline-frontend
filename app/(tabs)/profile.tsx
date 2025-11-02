import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Text>프로필 화면 (준비 중)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
