// incident reporting screen - submit harassment reports
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { buildApiUrl, getFetchOptions } from '@/constants/api'
import { useProfile } from '@/contexts/ProfileContext'

// hardcoded incident types
const INCIDENT_TYPES = [
  { value: 'harassment', label: 'Harassment', icon: 'alert-circle' },
  { value: 'stalking', label: 'Stalking', icon: 'eye' },
  { value: 'assault', label: 'Assault', icon: 'hand-left' },
  { value: 'verbal_abuse', label: 'Verbal Abuse', icon: 'chatbox-ellipses' },
  { value: 'cyber_harassment', label: 'Cyber Harassment', icon: 'phone-portrait' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle' },
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#3CB371', description: 'Minor incident' },
  { value: 'medium', label: 'Medium', color: '#FFB347', description: 'Moderate concern' },
  { value: 'high', label: 'High', color: '#FF6B6B', description: 'Serious incident' },
  { value: 'critical', label: 'Critical', color: '#8B0000', description: 'Immediate danger' },
]

export default function IncidentScreen() {
  const { profile } = useProfile()
  const userId = profile.id || ''

  const [activeTab, setActiveTab] = useState('report') // 'report' or 'history'
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [incidentType, setIncidentType] = useState('harassment')
  const [severity, setSeverity] = useState('medium')
  const [location, setLocation] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [suspectDescription, setSuspectDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [witnessAvailable, setWitnessAvailable] = useState(false)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showSeverityModal, setShowSeverityModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'history') {
      fetchReports()
    }
  }, [activeTab])

  const fetchReports = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await fetch(buildApiUrl(`/api/incidents?user_id=${userId}`))
      if (res.ok) {
        const data = await res.json()
        setReports(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.log('fetch reports error:', error)
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to submit a report')
      return
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title')
      return
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Required', 'Please describe what happened (at least 10 characters)')
      return
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your phone number')
      return
    }

    setLoading(true)
    try {
      // convert image to base64 if picked
      let imageBase64 = null
      if (selectedImage) {
        try {
          const r = await fetch(selectedImage)
          const blob = await r.blob()
          const reader = new FileReader()
          imageBase64 = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch (e) {
          console.log('image convert failed, continuing without image')
        }
      }

      const reportData = {
        title: title.trim(),
        description: description.trim(),
        incident_type: incidentType,
        severity: severity,
        location: location.trim() || null,
        date_time: dateTime.trim() || null,
        suspect_description: suspectDescription.trim() || null,
        phone_number: phoneNumber.trim() || null,
        witness_available: witnessAvailable,
        image_url: null,
        image_base64: imageBase64,
      }

      const res = await fetch(
        buildApiUrl(`/api/incidents?user_id=${userId}`),
        getFetchOptions('POST', reportData)
      )

      if (res.ok) {
        Alert.alert(
          'Report Submitted',
          'Your incident report has been sent to our monitoring team.',
          [{ text: 'OK', onPress: () => { resetForm(); setActiveTab('history') } }]
        )
      } else {
        const err = await res.json()
        throw new Error(err.detail || 'Submit failed')
      }
    } catch (error: any) {
      console.log('submit error:', error)
      Alert.alert('Error', 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setIncidentType('harassment')
    setSeverity('medium')
    setLocation('')
    setDateTime('')
    setSuspectDescription('')
    setPhoneNumber('')
    setWitnessAvailable(false)
    setSelectedImage(null)
  }

  // get color based on status
  const getStatusColor = (status: string) => {
    if (status === 'submitted') return '#FF69B4'
    if (status === 'under_review') return '#FFB347'
    if (status === 'resolved') return '#3CB371'
    return '#9E9E9E'
  }

  const selectedType = INCIDENT_TYPES.find(t => t.value === incidentType)
  const selectedSeverity = SEVERITY_LEVELS.find(s => s.value === severity)

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reporting</Text>
        <Text style={styles.headerSubtitle}>Report harassment to our monitoring team</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'report' && styles.activeTab]}
            onPress={() => setActiveTab('report')}
          >
            <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>New Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'report' ? (
          <View style={styles.form}>
            {/* info banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark" size={24} color="#FF6B9D" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bannerTitle}>Confidential & Secure</Text>
                <Text style={styles.bannerText}>Reviewed by our internal monitoring team</Text>
              </View>
            </View>

            <Text style={styles.label}>Incident Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of the incident"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />

            <Text style={styles.label}>Incident Type *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTypeModal(true)}>
              <Text style={styles.selectBtnText}>{selectedType?.label}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B6B6B" />
            </TouchableOpacity>

            <Text style={styles.label}>Severity *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowSeverityModal(true)}>
              <View style={[styles.severityDot, { backgroundColor: selectedSeverity?.color }]} />
              <Text style={styles.selectBtnText}>{selectedSeverity?.label}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B6B6B" />
            </TouchableOpacity>

            <Text style={styles.label}>Detailed Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what happened..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
            <Text style={styles.charCount}>{description.length}/2000</Text>

            <Text style={styles.label}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Where did it happen?"
              value={location}
              onChangeText={setLocation}
            />

<Text style={styles.label}>Suspect Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Appearance, clothing, etc."
              value={suspectDescription}
              onChangeText={setSuspectDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your contact number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setWitnessAvailable(!witnessAvailable)}
            >
              <View style={[styles.checkbox, witnessAvailable && styles.checkboxChecked]}>
                {witnessAvailable && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Witness available</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Evidence (Optional)</Text>
            {selectedImage ? (
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setSelectedImage(null)}>
                  <Ionicons name="close-circle" size={28} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imgBtnsRow}>
                <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
                  <Ionicons name="images" size={24} color="#FF6B9D" />
                  <Text style={styles.imgBtnText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        ) : (
          <View style={{ padding: 20 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#FF6B9D" style={{ marginTop: 40 }} />
            ) : reports.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>No Reports Yet</Text>
                <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('report')}>
                  <Text style={styles.emptyBtnText}>Submit First Report</Text>
                </TouchableOpacity>
              </View>
            ) : (
              reports.map((report: any, i) => (
                <View key={i} style={styles.reportCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                      <Text style={styles.statusText}>{report.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.reportDesc} numberOfLines={2}>{report.description}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* incident type picker modal */}
      <Modal visible={showTypeModal} transparent animationType="slide" onRequestClose={() => setShowTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Incident Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.modalOption, incidentType === type.value && styles.modalOptionActive]}
                  onPress={() => { setIncidentType(type.value); setShowTypeModal(false) }}
                >
                  <Ionicons name={type.icon as any} size={24} color={incidentType === type.value ? '#FF6B9D' : '#6B6B6B'} />
                  <Text style={[styles.modalOptionText, incidentType === type.value && { color: '#FF6B9D', fontWeight: '600' }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* severity picker modal */}
      <Modal visible={showSeverityModal} transparent animationType="slide" onRequestClose={() => setShowSeverityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Severity</Text>
              <TouchableOpacity onPress={() => setShowSeverityModal(false)}>
                <Ionicons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.modalOption, severity === level.value && styles.modalOptionActive]}
                  onPress={() => { setSeverity(level.value); setShowSeverityModal(false) }}
                >
                  <View style={[styles.severityDot, { backgroundColor: level.color }]} />
                  <View>
                    <Text style={[styles.modalOptionText, severity === level.value && { color: '#FF6B9D', fontWeight: '600' }]}>
                      {level.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B6B6B' }}>{level.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFF0F5',
  },
  activeTab: {
    backgroundColor: '#FFD6E7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  activeTabText: {
    color: '#FF6B9D',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFD6E7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  bannerText: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B6B6B',
    marginBottom: 4,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D2D2D',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'right',
    marginTop: 4,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2D7E3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectBtnText: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    marginLeft: 8,
  },
  severityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  imgBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F2D7E3',
    borderRadius: 8,
    paddingVertical: 14,
    borderStyle: 'dashed',
  },
  imgBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B9D',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderColor: '#F2D7E3',
    borderWidth: 1,
  },
  reportTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  reportDesc: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 6,
  },
  reportDate: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2D7E3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2D7E3',
  },
  modalOptionActive: {
    backgroundColor: '#FFD6E7',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#2D2D2D',
  },
})
