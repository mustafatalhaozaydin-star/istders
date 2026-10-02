import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Keyboard, Platform, ActivityIndicator } from 'react-native';

const API_KEY = "AQ.Ab8RN6IIHRsfs2wq_Ce6tIv9HyszvhC9yieZJVCGnaK4apUWEA";

const INITIAL_PROGRAM = [
  { id: '1', gun: 'Pazartesi', saat: '08:40-10:30', ders: 'İST167-02 Bilgisayar Prog. Giriş', yer: 'Lab 4' },
  { id: '2', gun: 'Pazartesi', saat: '10:40-12:30', ders: 'İST155-02 İstatistiğe Giriş I', yer: 'Derslik 1' },
  { id: '3', gun: 'Pazartesi', saat: '13:40-16:00', ders: 'SEC414.01 Markalaşma ve İtibar Yön.', yer: 'Beytepe Hukuk B2' },
  { id: '4', gun: 'Salı', saat: '09:40-12:30', ders: 'İST167-02 Bilgisayar Prog. Giriş', yer: 'Lab 4' },
  { id: '5', gun: 'Salı', saat: '12:40-14:30', ders: 'TKD103-18 Türk Dili I', yer: 'ONLINE' },
  { id: '6', gun: 'Çarşamba', saat: '08:40-11:30', ders: 'MAT121-02 Matematik I', yer: 'Derslik 1' },
  { id: '7', gun: 'Perşembe', saat: '11:40-13:30', ders: 'İST165-02 Olasılık I', yer: 'Derslik 2' },
  { id: '8', gun: 'Perşembe', saat: '13:40-15:30', ders: 'MAT121-02 Matematik I', yer: 'Derslik 1' },
  { id: '9', gun: 'Cuma', saat: '10:40-12:30', ders: 'İST165-02 Olasılık I', yer: 'Derslik 2' },
  { id: '10', gun: 'Cuma', saat: '13:40-15:30', ders: 'İST155-02 İstatistiğe Giriş I', yer: 'Lab 1' },
];

export default function App() {
  const [tab, setTab] = useState('program'); 
  const [gorevler, setGorevler] = useState([]);
  const [kaynaklar, setKaynaklar] = useState([]);
  const [notlar, setNotlar] = useState({});
  const [sinavlar, setSinavlar] = useState([]); 
  
  const [yeniGorev, setYeniGorev] = useState('');
  const [sinavAdi, setSinavAdi] = useState('');
  const [sinavTarihi, setSinavTarihi] = useState('');
  const [seciliDersNotu, setSeciliDersNotu] = useState(null);
  const [aktifNot, setAktifNot] = useState('');
  
  const [mesajlar, setMesajlar] = useState([{ role: 'model', text: 'Merhaba! Asistanın hazır.' }]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const scrollViewRef = useRef();

  const gorevEkle = () => {
    if (!yeniGorev.trim()) return;
    setGorevler([...gorevler, { id: Date.now().toString(), text: yeniGorev, tamamlandi: false }]);
    setYeniGorev(''); Keyboard.dismiss();
  };
  const gorevTamamla = (id) => {
    setGorevler(gorevler.map(g => g.id === id ? { ...g, tamamlandi: !g.tamamlandi } : g));
  };
  const gorevSil = (id) => {
    setGorevler(gorevler.filter(g => g.id !== id));
  };

  const sinavEkle = () => {
    if (!sinavAdi.trim() || !sinavTarihi.trim()) return;
    setSinavlar([...sinavlar, { id: Date.now().toString(), ad: sinavAdi, tarih: sinavTarihi }]);
    setSinavAdi(''); setSinavTarihi(''); Keyboard.dismiss();
  };
  const sinavSil = (id) => {
    setSinavlar(sinavlar.filter(s => s.id !== id));
  };
  const gunHesapla = (hedefTarih) => {
    const bugun = new Date();
    const hedef = new Date(hedefTarih);
    return Math.ceil((hedef.getTime() - bugun.getTime()) / (1000 * 3600 * 24));
  };

  const kaynakEkleWeb = () => {
    setKaynaklar([...kaynaklar, { id: Date.now().toString(), name: "Örnek Ders Kitabı.pdf" }]);
  };
  const kaynakSil = (id) => {
    setKaynaklar(kaynaklar.filter(k => k.id !== id));
  };

  const notAc = (dersAdi) => { setSeciliDersNotu(dersAdi); setAktifNot(notlar[dersAdi] || ''); };
  const notKaydet = () => {
    setNotlar({ ...notlar, [seciliDersNotu]: aktifNot });
    setSeciliDersNotu(null);
  };

  const mesajiGonder = async () => {
    if (!yeniMesaj.trim()) return;
    const kullaniciMetni = yeniMesaj;
    const geciciMesajlar = [...mesajlar, { role: 'user', text: kullaniciMetni }];
    
    setMesajlar(geciciMesajlar);
    setYeniMesaj('');
    setAiYukleniyor(true);
    Keyboard.dismiss();

    try {
      const sohbetGecmisi = geciciMesajlar.map(m => `${m.role === 'user' ? 'Öğrenci' : 'Asistan'}: ${m.text}`).join('\n');
      const sistemMesaji = `Sen Hacettepe İstatistik öğrencisinin asistanısın. Minimalist ve akıllısın.
      Programı: ${JSON.stringify(INITIAL_PROGRAM)}
      Görevleri: ${JSON.stringify(gorevler)}
      Sınavları: ${JSON.stringify(sinavlar)}
      Notları: ${JSON.stringify(notlar)}
      Sohbet Geçmişi: ${sohbetGecmisi}
      Öğrenci Sorusu: ${kullaniciMetni}`;

      // Model adı Google'ın önerdiği gemini-3.8-flash olarak güncellendi
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sistemMesaji }] }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setMesajlar(prev => [...prev, { role: 'model', text: `API Hatası: ${data.error.message}` }]);
        return;
      }

      const aiYanitMetni = data.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
      setMesajlar(prev => [...prev, { role: 'model', text: aiYanitMetni }]);
    } catch (error) {
      setMesajlar(prev => [...prev, { role: 'model', text: 'Bağlantı hatası oluştu.' }]);
    } finally {
      setAiYukleniyor(false);
    }
  };

  const hafizayiTemizle = () => {
    setMesajlar([{ role: 'model', text: 'Hafıza temizlendi!' }]);
  };

  if (seciliDersNotu) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={notKaydet}><Text style={styles.headerBtn}>← Kaydet & Dön</Text></TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{seciliDersNotu}</Text>
        </View>
        <TextInput style={styles.noteInput} multiline autoFocus placeholder="Notlar..." placeholderTextColor="#666" value={aktifNot} onChangeText={setAktifNot} />
      </SafeAreaView>
    );
  }

  const benzersizDersler = [...new Set(INITIAL_PROGRAM.map(item => item.ders))];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.mainTitle}>Hacettepe İstatistik</Text>
      
      <View style={{ height: 50, marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {['program', 'notlar', 'gorevler', 'sinavlar', 'kaynaklar', 'asistan'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.activeTab]}>
              <Text style={[styles.tabText, tab === t && styles.activeTabText]}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {tab === 'program' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map(gun => {
              const gunDersleri = INITIAL_PROGRAM.filter(d => d.gun === gun);
              if (gunDersleri.length === 0) return null;
              return (
                <View key={gun} style={styles.gunGroup}>
                  <Text style={styles.gunTitle}>{gun.toUpperCase()}</Text>
                  {gunDersleri.map(d => (
                    <View key={d.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.timeText}>{d.saat}</Text>
                        <Text style={[styles.yerBadge, d.yer === 'ONLINE' && styles.yerOnline]}>{d.yer}</Text>
                      </View>
                      <Text style={styles.dersText}>{d.ders}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}

        {tab === 'notlar' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {benzersizDersler.map((dersAdi, index) => (
              <TouchableOpacity key={index} style={styles.actionCard} onPress={() => notAc(dersAdi)}>
                <Text style={styles.dersText}>{dersAdi}</Text>
                <Text style={styles.actionIcon}>✎</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {tab === 'gorevler' && (
          <View style={{ flex: 1 }}>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Görev ekle..." placeholderTextColor="#666" value={yeniGorev} onChangeText={setYeniGorev} />
              <TouchableOpacity style={styles.addBtn} onPress={gorevEkle}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {gorevler.length === 0 && <Text style={styles.emptyText}>Görev yok.</Text>}
              {gorevler.map(g => (
                <View key={g.id} style={styles.actionCard}>
                  <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => gorevTamamla(g.id)}>
                    <View style={[styles.checkbox, g.tamamlandi && styles.checkboxChecked]} />
                    <Text style={[styles.taskText, g.tamamlandi && styles.taskTextDone]}>{g.text}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => gorevSil(g.id)}><Text style={styles.deleteText}>Sil</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {tab === 'sinavlar' && (
          <View style={{ flex: 1 }}>
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, { flex: 2, marginRight: 5 }]} placeholder="Sınav Adı" placeholderTextColor="#666" value={sinavAdi} onChangeText={setSinavAdi} />
              <TextInput style={[styles.input, { flex: 1.5 }]} placeholder="YYYY-AA-GG" placeholderTextColor="#666" value={sinavTarihi} onChangeText={setSinavTarihi} />
              <TouchableOpacity style={styles.addBtn} onPress={sinavEkle}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sinavlar.length === 0 && <Text style={styles.emptyText}>Sınav yok.</Text>}
              {sinavlar.map(s => {
                const kalan = gunHesapla(s.tarih);
                const isAcil = kalan >= 0 && kalan <= 7;
                return (
                  <View key={s.id} style={[styles.actionCard, isAcil && { borderLeftWidth: 4, borderLeftColor: '#CF6679' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dersText}>{s.ad}</Text>
                      <Text style={styles.timeText}>{s.tarih}</Text>
                    </View>
                    <View style={styles.kalanBadge}>
                      <Text style={[styles.kalanText, isAcil && { color: '#CF6679', fontWeight: 'bold' }]}>{kalan < 0 ? 'Geçti' : `${kalan} Gün`}</Text>
                    </View>
                    <TouchableOpacity onPress={() => sinavSil(s.id)}><Text style={styles.deleteText}>Sil</Text></TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {tab === 'kaynaklar' && (
           <View style={{ flex: 1 }}>
             <TouchableOpacity style={styles.uploadBtn} onPress={kaynakEkleWeb}><Text style={styles.uploadBtnText}>+ Örnek Kaynak Ekle</Text></TouchableOpacity>
             <ScrollView showsVerticalScrollIndicator={false}>
               {kaynaklar.map(k => (
                 <View key={k.id} style={styles.actionCard}>
                   <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}><Text style={styles.pdfIcon}>📄</Text><Text style={styles.pdfText} numberOfLines={1}>{k.name}</Text></View>
                   <TouchableOpacity onPress={() => kaynakSil(k.id)}><Text style={styles.deleteText}>Sil</Text></TouchableOpacity>
                 </View>
               ))}
             </ScrollView>
           </View>
        )}

        {tab === 'asistan' && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
               <TouchableOpacity onPress={hafizayiTemizle}><Text style={styles.clearMemoryText}>Hafızayı Temizle</Text></TouchableOpacity>
            </View>
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {mesajlar.map((m, i) => (
                <View key={i} style={[styles.chatBubble, m.role === 'user' ? styles.chatUser : styles.chatModel]}>
                  <Text style={styles.chatText}>{m.text}</Text>
                </View>
              ))}
              {aiYukleniyor && <ActivityIndicator size="small" color="#FFB74D" style={{ marginVertical: 10 }} />}
            </ScrollView>
            <View style={[styles.inputContainer, { marginTop: 10, marginBottom: 5 }]}>
              <TextInput style={styles.input} placeholder="Asistana yaz..." placeholderTextColor="#666" value={yeniMesaj} onChangeText={setYeniMesaj} />
              <TouchableOpacity style={styles.addBtn} onPress={mesajiGonder}><Text style={styles.addBtnText}>↑</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 20 },
  mainTitle: { fontSize: 26, fontWeight: '800', marginHorizontal: 20, marginTop: 10, marginBottom: 15, color: '#FFFFFF', letterSpacing: 0.5 },
  tabContainer: { paddingHorizontal: 15, alignItems: 'center' },
  tab: { paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#1E1E1E' },
  activeTab: { backgroundColor: '#FFB74D' },
  tabText: { color: '#888888', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#121212' },
  content: { flex: 1, paddingHorizontal: 20 },
  gunGroup: { marginBottom: 25 },
  gunTitle: { fontSize: 14, fontWeight: '700', color: '#FFB74D', marginBottom: 10, letterSpacing: 1.5 },
  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  timeText: { color: '#AAAAAA', fontSize: 13, fontWeight: '500' },
  yerBadge: { backgroundColor: '#2C2C2C', color: '#E0E0E0', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  yerOnline: { backgroundColor: '#FF9800', color: '#121212', fontWeight: 'bold' },
  dersText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', flex: 1 },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1E1E1E', color: '#FFFFFF', padding: 15, borderRadius: 12, fontSize: 15 },
  addBtn: { backgroundColor: '#FFB74D', justifyContent: 'center', alignItems: 'center', width: 55, borderRadius: 12, marginLeft: 10 },
  addBtnText: { color: '#121212', fontSize: 24, fontWeight: 'bold' },
  actionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 12 },
  actionIcon: { color: '#FFB74D', fontSize: 18 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#555', marginRight: 15 },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  taskText: { color: '#E0E0E0', fontSize: 16, flex: 1 },
  taskTextDone: { color: '#666', textDecorationLine: 'line-through' },
  kalanBadge: { marginRight: 15, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#2C2C2C', borderRadius: 8 },
  kalanText: { color: '#E0E0E0', fontSize: 14, fontWeight: '600' },
  uploadBtn: { backgroundColor: '#2C2C2C', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  uploadBtnText: { color: '#FFB74D', fontSize: 16, fontWeight: '600' },
  pdfIcon: { fontSize: 20, marginRight: 12 },
  pdfText: { color: '#FFFFFF', fontSize: 15, flex: 1, marginRight: 10 },
  deleteText: { color: '#CF6679', fontSize: 13, fontWeight: '600', padding: 5 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E' },
  headerBtn: { color: '#FFB74D', fontSize: 16, fontWeight: '600', marginRight: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flex: 1 },
  noteInput: { flex: 1, padding: 20, fontSize: 16, color: '#E0E0E0', textAlignVertical: 'top', lineHeight: 24 },
  chatBubble: { padding: 15, borderRadius: 15, marginBottom: 12, maxWidth: '85%' },
  chatUser: { backgroundColor: '#4CAF50', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  chatModel: { backgroundColor: '#2C2C2C', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  chatText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  clearMemoryText: { color: '#888', fontSize: 12, textDecorationLine: 'underline' }
});