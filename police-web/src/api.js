// api config for police web
const API_BASE_URL = 'http://localhost:8000'
export const MIDDLEWARE_URL = 'http://localhost:3000'

console.log('API_BASE_URL:', API_BASE_URL)

// police portal uses this id to get all SOS alerts
export const POLICE_ID = 'police_portal'

export const API_ENDPOINTS = {
  SOS_ALERTS_ALL: '/api/sos/alerts/all',
  SOS_ALERTS: (userId) => `/api/sos/alerts/${userId}`,
  SOS_RESOLVE: (alertId) => `/api/sos/alerts/${alertId}/resolve`,
  INCIDENTS: '/api/incidents',
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
