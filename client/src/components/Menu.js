import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link as RouterLink } from 'react-router-dom'

import { AppBar, Button, Toolbar, Typography, Box, Link } from '@mui/material'

import { logOut } from '../reducers/authReducer'

const Menu = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  if (!user) return null
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar sx={{ bgcolor: 'black' }} position='static'>
        <Toolbar>
          <Link
            variant='h5'
            noWrap
            color='inherit'
            component={RouterLink}
            underline='none'
            to='/'
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
          >
            Whiteboard
          </Link>
          <Typography
            align='right'
            variant='body2'
            component='em'
            sx={{ flexGrow: 1 }}
          >
            {user.name} logged in
          </Typography>
          <Button color='inherit' onClick={() => dispatch(logOut())}>
            logout
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  )
}

export default Menu
