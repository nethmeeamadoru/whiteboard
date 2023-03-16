import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'

import Whiteboard from './components/Whiteboard'
import Menu from './components/Menu'
import Notification from './components/Notification'
import LoginForm from './components/LoginForm'
import CreateOrJoinWhiteboard from './components/CreateOrJoinWhiteboard'

import { initAuth } from './reducers/authReducer'

const App = () => {
  const [whiteboardSessionID, setWhiteBoardSessionId] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initAuth())
  }, [dispatch])

  const user = useSelector((state) => state.user)

  if (user === null) {
    return (
      <Container>
        <Notification />
        <LoginForm />
      </Container>
    )
  }

  if (!whiteboardSessionID) {
    return (
      <Container>
        <Menu />
        <Notification />
        <CreateOrJoinWhiteboard
          user={user}
          setWhiteBoardSessionId={setWhiteBoardSessionId}
        />
      </Container>
    )
  }

  return (
    <Container>
      <Menu />
      <Notification />
      <Routes>
        <Route
          path='/'
          element={
            <Whiteboard
              user={user}
              whiteboardSessionID={whiteboardSessionID}
              setWhiteBoardSessionId={setWhiteBoardSessionId}
            />
          }
        />
      </Routes>
    </Container>
  )
}

export default App
