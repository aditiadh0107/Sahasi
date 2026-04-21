// API config for Sahasi app
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// auto-detect host IP from the Expo dev server — works on any network without hardcoding
// Android emulator can't use localhost — it routes to itself, not the host machine
const _host = (Constants.expoConfig?.hostUri ?? '').split(':')[0]
const DEV_HOST = _host || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost')

// use local server in dev, production url otherwise
export const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:8000` : 'https://api.sahasi.app'
export const MIDDLEWARE_URL = __DEV__ ? `http://${DEV_HOST}:3000` : 'https://middleware.sahasi.app'

console.log('API:', API_BASE_URL)

// helper to build full url from endpoint
export const buildApiUrl = (endpoint: string, queryParams?: any) => {
  let url = API_BASE_URL + endpoint
  if (queryParams) {
    const params = new URLSearchParams(queryParams)
    url = url + '?' + params.toString()
  }
  return url
}

// fetch with a timeout — rejects with a readable error if server doesn't respond
export const fetchWithTimeout = async (url: string, options: any, timeoutMs = 8000): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Server not reachable. Check your network or backend IP.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// makes fetch requests easier
export const getFetchOptions = (method: string = 'GET', body: any = null) => {
  let options: any = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  return options
}

// all the api routes
export const API_ENDPOINTS = {
  USERS_REGISTER: '/api/users/register',
  USERS_LOGIN: '/api/users/login',

  PROFILES: '/api/profiles',

  LESSONS: (user_id: string) => `/api/lessons/${user_id}`,
  SELF_DEFENCE_LESSONS: '/api/lessons',

  INCIDENTS: '/api/incidents',

  ZONES: (user_id: string) => `/api/zones/${user_id}`,
  ZONE_DELETE: (zone_id: string) => `/api/zones/delete/${zone_id}`,
  LOCATION_ZONES: '/api/zones',

  CONTACTS: (user_id: string) => `/api/contacts/${user_id}`,
  CONTACTS_GENERATE_CODE: (user_id: string) => `/api/contacts/generate-code/${user_id}`,
  CONTACTS_VERIFY_CODE: (user_id: string) => `/api/contacts/verify-code/${user_id}`,
  TRUSTED_CONTACTS: '/api/contacts',

  SOS: (user_id: string) => `/api/sos/${user_id}`,
  SOS_ALERTS: (user_id: string) => `/api/sos/alerts/${user_id}`,
  SOS_RESOLVE: (alert_id: string) => `/api/sos/alerts/${alert_id}/resolve`,
}
