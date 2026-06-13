// =====================================================
// sabitler/yaziStilleri.js
// Uygulamada kullanılan tekrar eden tipografi stilleri.
// =====================================================

import { StyleSheet } from 'react-native';
import RENKLER from './renkler';

const YAZI_STILLERI = StyleSheet.create({
  baslik1: {
    fontSize: 26,
    fontWeight: '700',
    color: RENKLER.gri800,
  },
  baslik2: {
    fontSize: 20,
    fontWeight: '600',
    color: RENKLER.gri800,
  },
  govde: {
    fontSize: 16,
    fontWeight: '400',
    color: RENKLER.gri600,
  },
  kucuk: {
    fontSize: 13,
    fontWeight: '400',
    color: RENKLER.gri400,
  },
});

export default YAZI_STILLERI;
