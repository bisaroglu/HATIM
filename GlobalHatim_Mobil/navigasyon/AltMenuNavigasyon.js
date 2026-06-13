// =====================================================
// navigasyon/AltMenuNavigasyon.js
// Ekranın altındaki Bottom Tab Navigation yapısı.
// Yeni ekran eklemek istersen buraya bir Tab.Screen daha ekle.
// =====================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Ekranlar
import AnaSayfa from '../ekranlar/AnaSayfa';
import HaftalikTakvim from '../ekranlar/HaftalikTakvim';
import YapayZekaAsistan from '../ekranlar/YapayZekaAsistan';
import Profil from '../ekranlar/Profil';

import RENKLER from '../sabitler/renkler';

// Bottom Tab navigator'ı oluştur
const Tab = createBottomTabNavigator();

export default function AltMenuNavigasyon() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Her tab için doğru ikonu seç
        tabBarIcon: ({ focused, color, size }) => {
          let ikonAdi;

          if (route.name === 'AnaSayfa') {
            ikonAdi = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HaftalikTakvim') {
            ikonAdi = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'YapayZekaAsistan') {
            ikonAdi = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Profil') {
            ikonAdi = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={ikonAdi} size={size} color={color} />;
        },

        // Renk ayarları — ekran görüntüsündeki gibi gold aktif, soluk pasif
        tabBarActiveTintColor: '#c5a059',    // gold — aktif sekme
        tabBarInactiveTintColor: '#5a5f6e',  // koyu gri — pasif sekmeler

        // Tab bar genel stili
        tabBarStyle: {
          // Tasarım: koyu siyah arka plan (ekran görüntüsündeki dark bottom nav)
          backgroundColor: '#0e0f11',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 12,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 1,
        },

        // Üst başlık (header) gösterme — her ekran kendi başlığını yönetir
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="AnaSayfa"
        component={AnaSayfa}
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen
        name="HaftalikTakvim"
        component={HaftalikTakvim}
        options={{ tabBarLabel: 'Takvim' }}
      />
      <Tab.Screen
        name="YapayZekaAsistan"
        component={YapayZekaAsistan}
        options={{ tabBarLabel: 'Asistan' }}
      />
      <Tab.Screen
        name="Profil"
        component={Profil}
        options={{ tabBarLabel: 'Profilim' }}
      />
    </Tab.Navigator>
  );
}
