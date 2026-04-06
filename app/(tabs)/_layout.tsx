import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#636366',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#3A3A3C',
          borderTopWidth: 0.5,
          ...Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, color, fontWeight: focused ? '700' : '400' }}>
              {focused ? '●' : '○'}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, color }}>◈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, color, fontWeight: focused ? '700' : '400' }}>≡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20, color }}>
              {focused ? '◉' : '◎'}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}