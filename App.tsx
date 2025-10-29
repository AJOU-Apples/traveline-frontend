import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/Auth/LoginScreen';

export default function App() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LoginScreen />
        </SafeAreaView>
    );
}

