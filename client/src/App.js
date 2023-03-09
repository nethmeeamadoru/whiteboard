//Test for websocket without user stuff...
//uninstall:
//reactstrap, react-simple-wysiwyg react-avatar

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'

import Whiteboard from './components/Whiteboard'
import Menu from './components/Menu'
import Notification from './components/Notification'
import LoginForm from './components/LoginForm'

import { initAuth } from './reducers/authReducer'

function App() {
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

  return (
    <Container>
      <Menu />
      <Notification />
      <Routes>
        <Route path='/' element={<Whiteboard user={user} />} />
      </Routes>
    </Container>
  )
}

export default App
