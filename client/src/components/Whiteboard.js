import React, { useEffect } from 'react' //useState, useRef
//import { useSelector } from 'react-redux'
import useWebSocket, { ReadyState } from 'react-use-websocket'
//import CanvasDraw from 'react-canvas-draw'

import { Navbar, NavbarBrand, UncontrolledTooltip } from 'reactstrap'
import { DefaultEditor } from 'react-simple-wysiwyg'
import Avatar from 'react-avatar'

const WS_URL = 'ws://localhost:8000'

// Need to pass user to Whiteborad, if useSelector is used here typeError happens.
function Whiteboard({ user }) {
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
    if (user.username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username: user.username,
        type: 'userevent',
      })
    }
  }, [user, sendJsonMessage, readyState])

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar color='light' light>
        <NavbarBrand href='/'>Real-time document editor</NavbarBrand>
      </Navbar>
      <div className='container-fluid'>{<EditorSection />}</div>
    </>
  )

  /*

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
  )*/
}

function isUserEvent(message) {
  let evt = JSON.parse(message.data)
  return evt.type === 'userevent'
}

function isDocumentEvent(message) {
  let evt = JSON.parse(message.data)
  return evt.type === 'contentchange'
}

function History() {
  console.log('history')
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent,
  })
  const activities = lastJsonMessage?.data.userActivity || []
  return (
    <ul>
      {activities.map((activity, index) => (
        <li key={`activity-${index}`}>{activity}</li>
      ))}
    </ul>
  )
}

function Users() {
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent,
  })
  const users = Object.values(lastJsonMessage?.data.users || {})
  return users.map((user) => (
    <div key={user.username}>
      <span id={user.username} className='userInfo' key={user.username}>
        <Avatar name={user.username} size={40} round='20px' />
      </span>
      <UncontrolledTooltip placement='top' target={user.username}>
        {user.username}
      </UncontrolledTooltip>
    </div>
  ))
}

function EditorSection() {
  return (
    <div className='main-content'>
      <div className='document-holder'>
        <div className='currentusers'>
          <Users />
        </div>
        <Document />
      </div>
      <div className='history-holder'>
        <History />
      </div>
    </div>
  )
}

function Document() {
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isDocumentEvent,
  })

  let html = lastJsonMessage?.data.editorContent || ''

  function handleHtmlChange(e) {
    sendJsonMessage({
      type: 'contentchange',
      content: e.target.value,
    })
  }

  return <DefaultEditor value={html} onChange={handleHtmlChange} />
}

export default Whiteboard
