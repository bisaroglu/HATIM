// =====================================================
// ekranlar/YapayZekaAsistan.js — WebView ile AI chat sayfası
// =====================================================
import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { WEB_SAYFALARI } from '../sabitler/webConfig';

export default function YapayZekaAsistan() {
  const webRef = useRef(null);
  const [yukleniyorMu, setYukleniyorMu] = useState(true);
  const [hataVar,      setHataVar]      = useState(false);

  function yenile() {
    setHataVar(false);
    setYukleniyorMu(true);
    webRef.current?.reload();
  }

  if (hataVar) {
    return (
      <SafeAreaView style={stilller.merkezEkran}>
        <Ionicons name="wifi-outline" size={44} color="#c5a059" />
        <Text style={stilller.hataBaslik}>Sunucuya ulaşılamıyor</Text>
        <TouchableOpacity style={stilller.tekrarBtn} onPress={yenile}>
          <Text style={stilller.tekrarYazi}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stilller.kapsayici}>
      {yukleniyorMu && (
        <View style={stilller.yukleniyor}>
          <ActivityIndicator size="large" color="#c5a059" />
        </View>
      )}
      <WebView
        ref={webRef}
        source={{ uri: WEB_SAYFALARI.yapayZeka }}
        style={stilller.webView}
        onLoadStart={() => setYukleniyorMu(true)}
        onLoadEnd={()  => setYukleniyorMu(false)}
        onError={()    => { setYukleniyorMu(false); setHataVar(true); }}
        onHttpError={() => { setYukleniyorMu(false); setHataVar(true); }}
        javaScriptEnabled
        domStorageEnabled
        // Klavye açıkken WebView yukarı kaymasın
        keyboardDisplayRequiresUserAction={false}
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
          document.head.appendChild(meta);
          true;
        `}
      />
    </SafeAreaView>
  );
}

const stilller = StyleSheet.create({
  kapsayici:   { flex: 1, backgroundColor: '#0e0f11' },
  webView:     { flex: 1 },
  yukleniyor:  {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0e0f11', zIndex: 10,
  },
  merkezEkran: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0e0f11', paddingHorizontal: 32, gap: 12,
  },
  hataBaslik: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginTop: 8 },
  tekrarBtn: {
    marginTop: 8, backgroundColor: '#c5a059', borderRadius: 8,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  tekrarYazi: { color: '#412d00', fontWeight: '700', fontSize: 14 },
});
