// location screen - map with safe/unsafe zones using leaflet via webview
import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useProfile } from '@/contexts/ProfileContext'
import { buildApiUrl, getFetchOptions } from '@/constants/api'

const DEFAULT_LOCATION = { coords: { latitude: 27.7172, longitude: 85.3240, accuracy: 0, altitude: 0, altitudeAccuracy: 0, heading: 0, speed: 0 }, timestamp: 0 }

export default function LocationScreen() {
  const { profile } = useProfile()
  const router = useRouter()
  const userId = profile.id

  const webViewRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [location, setLocation] = useState<any>(DEFAULT_LOCATION)
  const [zones, setZones] = useState<any[]>([])

  const [isAddingZone, setIsAddingZone] = useState(false)
  const [zoneType, setZoneType] = useState('safe')
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [zoneName, setZoneName] = useState('')
  const [zoneDescription, setZoneDescription] = useState('')
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showZonesList, setShowZonesList] = useState(false)

  // load saved zones from backend
  const loadZones = async () => {
    if (!userId) return
    try {
      const res = await fetch(buildApiUrl(`/api/zones/${userId}`))
      if (!res.ok) throw new Error('Failed to load zones')
      const data = await res.json()
      // map database fields to what we use in component
      const mapped = []
      for (let i = 0; i < data.length; i++) {
        const z = data[i]
        mapped.push({
          id: z.zone_id,
          user_id: z.user_id || userId,
          type: z.zone_type,
          latitude: parseFloat(z.latitude),
          longitude: parseFloat(z.longitude),
          name: z.zone_name,
          description: z.description || '',
          radius: z.radius || 1000,
          created_at: z.created_at,
        })
      }
      setZones(mapped)
    } catch (error) {
      console.log('zones load error:', error)
      Alert.alert('Error', 'Could not load saved zones.')
    }
  }

  useEffect(() => {
    loadZones()
  }, [userId])

  // send message to leaflet map
  const sendToMap = (payload: any) => {
    if (!webViewRef.current || !mapReady) return
    webViewRef.current.postMessage(JSON.stringify(payload))
  }

  // center map on user location when ready
  useEffect(() => {
    if (!location || !mapReady) return
    sendToMap({
      type: 'setCenter',
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    })
  }, [location, mapReady])

  // update zones on map when zones change
  useEffect(() => {
    if (!mapReady) return
    sendToMap({
      type: 'updateZones',
      zones: zones.map(z => ({
        id: z.id,
        type: z.type,
        lat: z.latitude,
        lng: z.longitude,
        name: z.name,
        description: z.description,
        radius: 1000,
      })),
    })
  }, [zones, mapReady])

  const startAddingZone = (type: string) => {
    if (!userId) {
      Alert.alert('Login Required', 'Please login to save zones.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/auth') }
      ])
      return
    }
    setZoneType(type)
    setIsAddingZone(true)
    sendToMap({ type: 'setClickable', clickable: true })
    Alert.alert(
      type === 'safe' ? 'Safe zone mode' : 'Unsafe zone mode',
      'Tap anywhere on the map to mark the zone center.'
    )
  }

  const cancelAddingZone = () => {
    setIsAddingZone(false)
    setSelectedLocation(null)
    setShowZoneModal(false)
    sendToMap({ type: 'setClickable', clickable: false })
  }

  const saveZone = async () => {
    if (!selectedLocation) return
    if (!zoneName.trim()) {
      Alert.alert('Required', 'Please enter a zone name.')
      return
    }
    if (!userId) {
      Alert.alert('Error', 'Please login first.')
      return
    }

    try {
      const res = await fetch(
        buildApiUrl(`/api/zones/${userId}`),
        getFetchOptions('POST', {
          type: zoneType,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          name: zoneName.trim(),
          description: zoneDescription.trim(),
        })
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save zone')
      }

      const newZone = await res.json()
      const mappedZone = {
        id: newZone.zone_id,
        user_id: newZone.user_id,
        type: newZone.type,
        latitude: newZone.latitude,
        longitude: newZone.longitude,
        name: newZone.name,
        description: newZone.description || '',
        radius: 1000,
        created_at: newZone.created_at,
      }

      setZones(prev => [mappedZone, ...prev])
      setZoneName('')
      setZoneDescription('')
      setShowZoneModal(false)
      setIsAddingZone(false)
      setSelectedLocation(null)
      sendToMap({ type: 'setClickable', clickable: false })
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const deleteZone = async (zoneId: string) => {
    try {
      const res = await fetch(buildApiUrl(`/api/zones/delete/${zoneId}`), getFetchOptions('DELETE'))
      if (!res.ok) throw new Error('Failed to delete')
      setZones(prev => prev.filter(z => z.id !== zoneId))
    } catch (error) {
      Alert.alert('Error', 'Could not delete this zone.')
    }
  }

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'mapReady') {
        setMapReady(true)
      }
      if (data.type === 'mapClick' && isAddingZone) {
        setSelectedLocation({ latitude: data.lat, longitude: data.lng })
        setShowZoneModal(true)
      }
    } catch (error) {
      console.log('map bridge error:', error)
    }
  }

  const centerOnUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        sendToMap({ type: 'setCenter', lat: location.coords.latitude, lng: location.coords.longitude })
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setLocation(pos)
      sendToMap({ type: 'setCenter', lat: pos.coords.latitude, lng: pos.coords.longitude })
    } catch (error) {
      console.log('locate error:', error)
      sendToMap({ type: 'setCenter', lat: location.coords.latitude, lng: location.coords.longitude })
    }
  }

  // the leaflet map html - loaded in webview (static, location updated via setCenter postMessage)
  const mapHtml = useMemo(() => {
    const lat = 27.7172
    const lng = 85.324

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${lat}, ${lng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap contributors'
    }).addTo(map);

    let clickable = false;
    let zoneCircles = [];
    let zoneMarkers = [];
    let userMarker = L.circleMarker([${lat}, ${lng}], {
      radius: 8, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9
    }).addTo(map);

    const clearZones = () => {
      for (let i = 0; i < zoneCircles.length; i++) map.removeLayer(zoneCircles[i]);
      for (let i = 0; i < zoneMarkers.length; i++) map.removeLayer(zoneMarkers[i]);
      zoneCircles = [];
      zoneMarkers = [];
    };

    const renderZones = (zones) => {
      clearZones();
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const color = zone.type === 'safe' ? '#22c55e' : '#ef4444';
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius || 1000, color, fillColor: color, fillOpacity: 0.2, weight: 2
        }).addTo(map);
        zoneCircles.push(circle);
        const marker = L.circleMarker([zone.lat, zone.lng], {
          radius: 7, color, fillColor: color, fillOpacity: 1
        }).addTo(map).bindPopup('<b>' + zone.name + '</b><br/>' + (zone.description || ''));
        zoneMarkers.push(marker);
      }
    };

    map.on('click', (event) => {
      if (!clickable) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapClick', lat: event.latlng.lat, lng: event.latlng.lng
      }));
    });

    const handleMsg = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setCenter') {
          map.setView([data.lat, data.lng], Math.max(map.getZoom(), 13));
          userMarker.setLatLng([data.lat, data.lng]);
        }
        if (data.type === 'setClickable') clickable = data.clickable;
        if (data.type === 'updateZones') renderZones(data.zones || []);
      } catch (err) { console.error(err); }
    };

    window.addEventListener('message', handleMsg);
    document.addEventListener('message', handleMsg);

    setTimeout(() => {
      map.invalidateSize();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }, 120);
  </script>
</body>
</html>`
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Zones</Text>
        <Text style={styles.headerSubtitle}>Tap map to mark Safe (green) or Unsafe (red) zones</Text>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          originWhitelist={['*']}
          onMessage={handleMapMessage}
          onLoadStart={() => setMapReady(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.mapBtns}>
          <TouchableOpacity style={styles.mapBtn} onPress={centerOnUser}>
            <Ionicons name="locate" size={22} color="#FF6B9D" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} onPress={() => setShowZonesList(true)}>
            <Ionicons name="list" size={22} color="#FF6B9D" />
          </TouchableOpacity>
        </View>
      </View>

      {!isAddingZone ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#22c55e' }]} onPress={() => startAddingZone('safe')}>
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Mark Safe Zone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#ef4444' }]} onPress={() => startAddingZone('unsafe')}>
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Mark Unsafe Zone</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelAddingZone}>
            <Text style={styles.cancelBtnText}>Cancel Zone Placement</Text>
          </TouchableOpacity>
          <Text style={styles.instructionText}>Tap map to choose center point</Text>
        </View>
      )}

      {/* modal to enter zone name when user taps map */}
      <Modal visible={showZoneModal} transparent animationType="slide" onRequestClose={cancelAddingZone}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{zoneType === 'safe' ? 'Safe Zone' : 'Unsafe Zone'}</Text>
              <TouchableOpacity onPress={cancelAddingZone}>
                <Ionicons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={styles.inputLabel}>Zone Name</Text>
              <TextInput value={zoneName} onChangeText={setZoneName} placeholder="Enter zone name" style={styles.input} />
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                value={zoneDescription}
                onChangeText={setZoneDescription}
                placeholder="Short note"
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                multiline
              />
              <Text style={{ color: '#FF6B9D', fontWeight: '600', marginBottom: 16 }}>Fixed radius: 1 km</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={cancelAddingZone}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: zoneType === 'safe' ? '#22c55e' : '#ef4444' }]}
                onPress={saveZone}
              >
                <Text style={styles.saveBtnText}>Save Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* list of saved zones */}
      <Modal visible={showZonesList} transparent animationType="slide" onRequestClose={() => setShowZonesList(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Zones ({zones.length})</Text>
              <TouchableOpacity onPress={() => setShowZonesList(false)}>
                <Ionicons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }}>
              {zones.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#6B6B6B', fontSize: 15 }}>No zones yet.</Text>
                </View>
              ) : (
                zones.map((zone, i) => (
                  <View key={i} style={styles.zoneCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneType}>{zone.type === 'safe' ? 'Safe Zone' : 'Unsafe Zone'} | 1 km</Text>
                      {zone.description ? <Text style={styles.zoneDesc}>{zone.description}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => deleteZone(zone.id)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 58 : 48,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B6B6B',
  },
  mapContainer: {
    flex: 1,
  },
  mapBtns: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#FFD6E7',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#6B6B6B',
    fontWeight: '600',
  },
  instructionText: {
    textAlign: 'center',
    color: '#6B6B6B',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F2D7E3',
  },
  modalTitle: {
    fontSize: 22,
    color: '#2D2D2D',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 15,
    color: '#6B6B6B',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F2D7E3',
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
  },
  cancelModalBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#FFD6E7',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelModalText: {
    color: '#FF6B9D',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  zoneCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2D7E3',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  zoneName: {
    fontSize: 16,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  zoneType: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B6B6B',
  },
  zoneDesc: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B6B6B',
  },
})
