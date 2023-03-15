import { createSlice } from '@reduxjs/toolkit'

const initialState = { message: '', severity: '' }

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    createNotification: (state, action) => (state = action.payload),
    clearNotification: () => initialState,
  },
})

let cancel = null

export const setNotification = (notification, timeInSec) => {
  if (cancel) clearTimeout(cancel)
  const timeOut = timeInSec * 1000
  return async (dispatch) => {
    dispatch(createNotification(notification))
    cancel = setTimeout(() => {
      dispatch(clearNotification())
    }, timeOut)
  }
}

export const { createNotification, clearNotification } =
  notificationSlice.actions
export default notificationSlice.reducer
