import axios from 'axios'
import PropTypes from 'prop-types'

const baseUrl = '/api/login'

const login = async (credentials) => {
  const response = await axios.post(baseUrl, credentials)
  return response.data
}

login.prototype = {
  credentials: PropTypes.string.isRequired,
}

const STORAGE_KEY = 'loggedWhiteboardAppUser'

const loadFromLocalStorage = () => {
  const loggedUserJSON = window.localStorage.getItem(STORAGE_KEY)
  if (loggedUserJSON) {
    const user = JSON.parse(loggedUserJSON)
    return user
  }
  return undefined
}

const saveToLocalStorage = (user) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

const clearLocalStorage = () => {
  window.localStorage.removeItem(STORAGE_KEY)
}

const exportObjects = {
  login,
  loadFromLocalStorage,
  saveToLocalStorage,
  clearLocalStorage,
}

export default exportObjects
