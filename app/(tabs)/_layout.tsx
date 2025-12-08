import React from 'react';
import {Tabs} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {Platform} from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#E0E0E0',
                    height: Platform.OS === 'ios' ? 90 : 72,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
                    paddingTop: 8,
                    paddingHorizontal: 40,
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#176ADA',
                tabBarInactiveTintColor: '#9E9E9E',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'landing',
                    tabBarIcon: ({color, focused}) => (
                        <MaterialIcons name="home" color={color} size={32} style={{marginBottom: -2}}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: '일정',
                    tabBarIcon: ({color, focused}) => (
                        <MaterialIcons name="calendar-today" color={color} size={30} style={{marginBottom: -2}}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({color, focused}) => (
                        <MaterialIcons name="account-circle" color={color} size={32} style={{marginBottom: -2}}/>
                    ),
                }}
            />
        </Tabs>
    );
}

