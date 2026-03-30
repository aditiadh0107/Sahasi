import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#FFB6C1', '#E6E6FA']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={64} color="#fff" />
        </View>
        <Text style={styles.title}>Sahasi</Text>
        <Text style={styles.subtitle}>Your Personal Safety Companion</Text>
      </View>

      <View style={styles.featuresBox}>
        <Text style={styles.desc}>
          Empowering women with safety tools, self-defense training, and emergency support
        </Text>

        {/* feature list - hardcoded for now */}
        <View style={styles.featureRow}>
          <Ionicons name="fitness-outline" size={24} color="#E91E8C" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Personalized Training</Text>
            <Text style={styles.featureDesc}>Self-defense lessons tailored to you</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Emergency SOS</Text>
            <Text style={styles.featureDesc}>One-tap alert to trusted contacts</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="location-outline" size={24} color="#3CB371" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Safe Zone Marking</Text>
            <Text style={styles.featureDesc}>Mark safe and unsafe areas on map</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/(auth)/auth')}
      >
        <Text style={styles.btnText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <Text style={styles.footer}>Safe • Secure • Always Protected</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E91E8C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E91E8C',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 4,
  },
  featuresBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  desc: {
    fontSize: 15,
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
  },
  btn: {
    backgroundColor: '#E91E8C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 13,
  },
})
