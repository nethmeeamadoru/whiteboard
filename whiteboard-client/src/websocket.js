const createWebSocket = () => {
  const webSocketUrl =
    process.env.REACT_APP_WEBSOCKET_URL || 'wss://localhost:3003'

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
