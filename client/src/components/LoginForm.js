import React from 'react'
import { useDispatch } from 'react-redux'

import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { logIn } from '../reducers/authReducer'

import { useField } from '../hooks'

const LoginForm = () => {
  const dispatch = useDispatch()

  const usernameInput = useField('text')
  const passwordInput = useField('password')

  const handleLogin = async (event) => {
    event.preventDefault()
    dispatch(
      logIn({
        username: usernameInput.input.value,
        password: passwordInput.input.value,
      })
    )
    usernameInput.reset()
    passwordInput.reset()
  }

  const theme = createTheme({
    palette: {
      primary: { main: '#000000' },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Container component='main' maxWidth='xs'>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'black' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component='h1' variant='h5'>
            Sign in to Blog app
          </Typography>
          <Box
            component='form'
            onSubmit={handleLogin}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin='normal'
              required
              fullWidth
              id='username'
              label='Username'
              {...usernameInput.input}
              autoComplete='username'
              autoFocus
            />
            <TextField
              margin='normal'
              required
              fullWidth
              name='password'
              label='Password'
              {...passwordInput.input}
              id='password'
              autoComplete='current-password'
            />
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default LoginForm
