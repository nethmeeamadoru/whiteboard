import React, { useState, useEffect, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import CanvasDraw from 'react-canvas-draw'

const WS_URL = 'ws://localhost:3003'

function Whiteboard({ username }) {
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('WebSocket connection established.')
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
  })

  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username,
        type: 'userevent',
      })
    }
  }, [username, sendJsonMessage, readyState])

  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [isDrawing, setIsDrawing] = useState(true)
  const canvasRef = useRef()

  function handleColorChange(event) {
    setColor(event.target.value)
  }

  function handleBrushSizeChange(event) {
    setBrushSize(parseInt(event.target.value, 10))
  }

  function handleDrawingToggle() {
    setIsDrawing(!isDrawing)
  }

  function handleClearCanvas() {
    canvasRef.current.clear()
  }

  function handleSaveCanvas() {
    // eslint-disable-next-line no-unused-vars
    const dataUrl = canvasRef.current.getSaveData()
    // Do something with the data URL, such as send it to a server or download it.
  }

  return (
    <div>
      <div>
        <input type='color' value={color} onChange={handleColorChange} />
        <input
          type='range'
          min='1'
          max='50'
          value={brushSize}
          onChange={handleBrushSizeChange}
        />
        <button onClick={handleDrawingToggle}>
          {isDrawing ? 'Eraser' : 'Brush'}
        </button>
        <button onClick={handleClearCanvas}>Clear</button>
        <button onClick={handleSaveCanvas}>Save</button>
      </div>
      <CanvasDraw
        ref={canvasRef}
        canvasWidth={800}
        canvasHeight={600}
        brushColor={isDrawing ? color : '#FFFFFF'}
        brushRadius={brushSize}
        lazyRadius={0}
        hideGrid={true}
        disabled={!isDrawing}
      />
    </div>
  )
}

export default Whiteboard
