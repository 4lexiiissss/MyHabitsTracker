import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Go up two levels: (tabs) -> app -> root
import { HabitProvider } from '../../context/HabitContext'; 



export default function TabLayout() {
  return (
    /* Wrap the tabs to ensure every tab has access to the data */
    <HabitProvider>
      <Tabs screenOptions={{ tabBarActiveTintColor: '#5856D6', headerStyle: { backgroundColor: '#F2F2F7' } }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Manage',
            tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
          }}
        />
      </Tabs>
    </HabitProvider>
  );
}