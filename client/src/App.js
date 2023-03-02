/*import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route } from 'react-router-dom'

import { Container } from '@mui/material'

import Whiteboard from './components/Whiteboard'
import Notification from './components/Notification'
import LoginForm from './components/LoginForm'
import Menu from './components/Menu'

import { initAuth } from './reducers/authReducer'

const App = () => {
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
        <Route path='/' element={<Whiteboard currentUser={user} />} />
      </Routes>
    </Container>
  )
}

export default App
*/

//Test for websocket without user stuff...

//uninstall:
//reactstrap, react-simple-wysiwyg react-avatar

import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'

import Whiteboard from './components/Whiteboard'
import Menu from './components/Menu'
import Notification from './components/Notification'

function App() {
  const [username, setUsername] = useState('')

  if (!username) {
    return (
      <Container>
        <Notification />
        <LoginSection onLogin={setUsername} />
      </Container>
    )
  }

  return (
    <Container>
      <Menu />
      <Notification />
      <Routes>
        <Route path='/' element={<Whiteboard username={username} />} />
      </Routes>
    </Container>
  )
}

function LoginSection({ onLogin }) {
  const [username, setUsername] = useState('')
  //useWebSocket(WS_URL, {
  //  share: true,
  //  filter: () => false,
  //})
  function logInUser() {
    if (!username.trim()) {
      return
    }
    onLogin && onLogin(username)
  }

  return (
    <div className='account'>
      <div className='account__wrapper'>
        <div className='account__card'>
          <div className='account__profile'>
            <p className='account__name'>Hello, user!</p>
            <p className='account__sub'>Join to edit the document</p>
          </div>
          <input
            name='username'
            onInput={(e) => setUsername(e.target.value)}
            className='form-control'
          />
          <button
            type='button'
            onClick={() => logInUser()}
            className='btn btn-primary account__btn'
          >
            Join
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
