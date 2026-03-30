// api config for admin web
const API_BASE_URL = 'http://localhost:8000'

console.log('API_BASE_URL:', API_BASE_URL)

export const API_ENDPOINTS = {
  USERS: '/api/users',
  DELETE_USER: (userId) => `/api/users/${userId}`,
  INCIDENTS: '/api/incidents',
  INCIDENT_BY_ID: (reportId) => `/api/incidents/${reportId}`,
  UPDATE_INCIDENT: (reportId) => `/api/incidents/${reportId}`,
  SOS_ALERTS: '/api/sos/alerts/all',
  UPDATE_SOS: (alertId) => `/api/sos/alerts/${alertId}/resolve`,
  THERAPISTS: '/api/therapists',
  CREATE_THERAPIST: '/api/therapists/create',
  UPDATE_THERAPIST: (therapistId) => `/api/therapists/${therapistId}`,
}

// build full url from endpoint
export const buildApiUrl = (endpoint, queryParams) => {
  let url = API_BASE_URL + endpoint
  if (queryParams) {
    const params = new URLSearchParams(queryParams)
    url = url + '?' + params.toString()
  }
  return url
}

// helper to build fetch options
export const getFetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  return options
}
