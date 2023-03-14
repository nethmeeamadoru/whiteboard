import React from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { Alert } from '@mui/material'

const Notification = () => {
  const { message, severity } = useSelector((state) => state.notifications)
  if (message === '') {
    return null
  }
  return (
    <div>
      <br />
      <Alert severity={severity}>{message}</Alert>
    </div>
  )
}

Notification.propTypes = {
  message: PropTypes.string,
  boolIsError: PropTypes.bool,
}

export default Notification
