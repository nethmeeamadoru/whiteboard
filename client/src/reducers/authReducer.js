import { createSlice } from '@reduxjs/toolkit'

import loginService from '../services/login.js'

import { setNotification } from './notificationReducer'

const authSlice = createSlice({
  name: 'user',
  initialState: null,
  reducers: {
    setUser: (state, action) => (state = action.payload),
    clearUser: () => null,
  },
})

export const initAuth = () => {
  return async (dispatch) => {
    const user = loginService.loadFromLocalStorage()
    if (!user) return
    dispatch(setUser(user))
  }
}

export const logIn = ({ username, password }) => {
  return async (dispatch) => {
    try {
      const user = await loginService.login({
        username,
        password,
      })
      dispatch(setUser(user))
      loginService.saveToLocalStorage(user)
      dispatch(
        setNotification(
          {
            message: 'Logged in',
            severity: 'success',
          },
          5
        )
      )
    } catch (exception) {
      dispatch(
        setNotification(
          {
            message: 'wrong username or password',
            severity: 'error',
          },
          5
        )
      )
    }
  }
}

export const logOut = () => {
  return async (dispatch) => {
    dispatch(clearUser())
    loginService.clearLocalStorage()
    dispatch(
      setNotification(
        {
          message: 'Logged out successfully',
          severity: 'success',
        },
        5
      )
    )
  }
}

export const { setUser, clearUser } = authSlice.actions
export default authSlice.reducer
