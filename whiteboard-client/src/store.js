import { configureStore } from '@reduxjs/toolkit'

import authReducer from './reducers/authReducer'
import notificationReducer from './reducers/notificationReducer'

const store = configureStore({
  reducer: {
    user: authReducer,
    notifications: notificationReducer,
  },
})

export default store
