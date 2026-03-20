// api config for therapist web
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

console.log('API_BASE_URL:', API_BASE_URL)

export const API_ENDPOINTS = {
  THERAPISTS: '/api/therapists',
  CHAT_REQUESTS_FOR_THERAPIST: (therapistId) => `/api/chat-requests/therapist/${therapistId}`,
  CHAT_REQUEST_RESPOND: (requestId) => `/api/chat-requests/${requestId}`,
  ACCEPTED_CHATS: (therapistId) => `/api/accepted-chats/therapist/${therapistId}`,
  MESSAGES: (requestId) => `/api/messages/${requestId}`,
  SEND_MESSAGE: '/api/messages',
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
