const createWebSocket = () => {
  let webSocketUrl = ''
  if (process.env.REACT_APP_USE_HTTPS === '1') {
    webSocketUrl = `wss${
      process.env.REACT_APP_WEBSOCKET_URL || '://localhost:3003/ws'
    }`
  } else {
    webSocketUrl = `ws${
      process.env.REACT_APP_WEBSOCKET_URL || '://localhost:3003/ws'
    }`
  }

  const websocket = new WebSocket(webSocketUrl)

  websocket.onopen = () => {
    console.log('WebSocket connection established')
  }

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  websocket.onclose = () => {
    console.log('WebSocket connection closed')
  }

  return websocket
}

export { createWebSocket }
