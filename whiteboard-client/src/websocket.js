const createWebSocket = () => {
  const webSocketUrl = 'ws://localhost:8000' // replace with your own WebSocket server URL
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
