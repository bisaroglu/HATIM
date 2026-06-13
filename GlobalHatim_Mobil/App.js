// =====================================================
// App.js — Uygulamanın giriş noktası
// React Navigation'ın NavigationContainer'ı burada sarmalanır.
// Yeni bir genel context veya provider eklemek istersen buraya ekle.
// =====================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import AltMenuNavigasyon from './navigasyon/AltMenuNavigasyon';

export default function App() {
  return (
    // NavigationContainer: tüm navigasyon işlemlerini saran ana kapsayıcı
    <NavigationContainer>
      {/* Üst durum çubuğu rengi — yeşil tema ile uyumlu */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Alt menü navigasyonu — 3 ana ekranı yönetir */}
      <AltMenuNavigasyon />
    </NavigationContainer>
  );
}
