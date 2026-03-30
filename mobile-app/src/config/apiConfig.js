// src/config/apiConfig.js
// Central API configuration — all services import from here, never hardcode credentials in components.

export const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com'

export const EXERCISEDB_HEADERS = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
  'x-rapidapi-key': 'd545df30b2mshb1edd676a62393ep169476jsne68d5a838bfa',
}
