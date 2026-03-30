import axios from 'axios'
import { buildApiUrl } from '../constants/api'

// calls signup endpoint and returns user data
export const signup = async (userData: any) => {
  try {
    const res = await axios.post(buildApiUrl('/api/users/register'), userData)
    return res.data
  } catch (error: any) {
    console.log('signup error:', error)
    if (error.response) {
      throw new Error(error.response.data.detail || 'Signup failed')
    }
    throw new Error('Network error, check your connection')
  }
}

// login and return user data
export const login = async (email: string, password: string) => {
  try {
    const res = await axios.post(buildApiUrl('/api/users/login'), { email, password })
    return res.data
  } catch (error: any) {
    console.log('login error:', error)
    if (error.response) {
      throw new Error(error.response.data.detail || 'Login failed')
    }
    throw new Error('Network error, check your connection')
  }
}

// basic email check
export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password: string) => {
  return password.length >= 6
}
