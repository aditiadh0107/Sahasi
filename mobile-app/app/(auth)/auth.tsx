import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProfile } from '../../contexts/ProfileContext'
import { buildApiUrl, getFetchOptions, API_ENDPOINTS } from '@/constants/api'

export default function AuthScreen() {
  const router = useRouter()
  const { updateProfile } = useProfile()

  // login or register mode
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1) // for register 2-step form
  const [loading, setLoading] = useState(false)

  // login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const handleLogin = async () => {
    // basic validation
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.USERS_LOGIN),
        getFetchOptions('POST', {
          email: loginEmail.toLowerCase().trim(),
          password: loginPassword,
        })
      )

      if (!response.ok) {
        let errMsg = 'Login failed'
        try {
          const err = await response.json()
          errMsg = err.detail || errMsg
        } catch {}
        throw new Error(errMsg)
      }

      const userData = await response.json()
      console.log('login success:', userData.name)

      updateProfile({
        id: userData.user_id,
        name: userData.name,
        age: userData.age,
        height: userData.height,
        weight: userData.weight,
        bmi: userData.bmi,
        category: userData.category,
      })

      router.replace('/(tabs)/workout')
    } catch (error: any) {
      Alert.alert('Login Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterStep1 = () => {
    if (!name.trim() || name.length < 2) {
      Alert.alert('Error', 'Enter your full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    if (password !== confirmPass) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    // go to step 2
    setStep(2)
  }

  const handleRegister = async () => {
    // validate step 2 fields
    const numAge = parseInt(age)
    if (!age || isNaN(numAge) || numAge < 13 || numAge > 100) {
      Alert.alert('Error', 'Age must be between 13 and 100')
      return
    }
    const numHeight = parseFloat(height)
    if (!height || isNaN(numHeight) || numHeight < 100 || numHeight > 250) {
      Alert.alert('Error', 'Height must be between 100 and 250 cm')
      return
    }
    const numWeight = parseFloat(weight)
    if (!weight || isNaN(numWeight) || numWeight < 30 || numWeight > 300) {
      Alert.alert('Error', 'Weight must be between 30 and 300 kg')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.USERS_REGISTER),
        getFetchOptions('POST', {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          age: numAge,
          height: numHeight,
          weight: numWeight,
        })
      )

      if (!response.ok) {
        let errMsg = 'Registration failed'
        try {
          const err = await response.json()
          errMsg = err.detail || errMsg
        } catch {}
        throw new Error(errMsg)
      }

      const userData = await response.json()
      console.log('register success:', userData.name)

      updateProfile({
        id: userData.user_id,
        name: userData.name,
        age: userData.age,
        height: userData.height,
        weight: userData.weight,
        bmi: userData.bmi,
        category: userData.category,
      })

      Alert.alert('Welcome!', 'Account created successfully.', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)/workout') }
      ])
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#FF8FAB', '#FFF0F5']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* app logo/header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark" size={44} color="#fff" />
            </View>
            <Text style={styles.appTitle}>Sahasi</Text>
            <Text style={styles.appSubtitle}>Your Safety Companion</Text>
          </View>

          {/* login / signup toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => { setMode('login'); setStep(1) }}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
              onPress={() => { setMode('register'); setStep(1) }}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* login form */}
          {mode === 'login' && (
            <View style={styles.formBox}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Login</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* register form - step 1 */}
          {mode === 'register' && step === 1 && (
            <View style={styles.formBox}>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>1</Text></View>
                <View style={styles.stepLine} />
                <View style={styles.stepDot}><Text style={[styles.stepNum, { color: '#aaa' }]}>2</Text></View>
              </View>
              <Text style={styles.formTitle}>Create Account</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterStep1}>
                <Text style={styles.submitBtnText}>Next: Profile Setup</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* register form - step 2 (height/weight/age for BMI calculation) */}
          {mode === 'register' && step === 2 && (
            <View style={styles.formBox}>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: '#3CB371' }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={[styles.stepLine, { backgroundColor: '#3CB371' }]} />
                <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>2</Text></View>
              </View>
              <Text style={styles.formTitle}>Profile Setup</Text>
              <Text style={styles.formSubtitle}>Used to calculate BMI and personalize your training</Text>

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Your age"
                value={age}
                onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              {/* height and weight side by side */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 165"
                    value={height}
                    onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 55"
                    value={weight}
                    onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  BMI will be calculated to give you the right self-defense program
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.footerText}>By continuing, you agree to our Terms of Service</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B9D',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 50,
  },
  toggleBtnActive: {
    backgroundColor: '#FF6B9D',
  },
  toggleText: {
    fontWeight: '600',
    color: '#6B6B6B',
  },
  toggleTextActive: {
    color: '#fff',
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    backgroundColor: '#E91E8C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6E6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#E91E8C',
  },
  stepNum: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#E6E6FA',
    marginHorizontal: 8,
    borderRadius: 2,
  },
  infoBox: {
    backgroundColor: '#FFE4E1',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  infoText: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 18,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  footerText: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
})
