import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { confirmAlert } from 'react-confirm-alert'
import 'react-confirm-alert/src/react-confirm-alert.css'

import { setNotification } from '../reducers/notificationReducer'
import { createWebSocket } from '../websocket'

const typesDef = {
  CREATE_NEW_ROOM: 'createnewroom',
  ASK_TO_JOIN_ROOM: 'asktojoinroom',
  ADD_USER_TO_ROOM: 'adduser',
  REJECT_JOIN_TO_ROOM: 'rejectjointoroom',
  USER_LEFTH: 'userleft',
  OWNER_LEFT: 'ownerleft',
  WHITEBOARD_DRAW: 'DRAW',
  WHITEBOARD_PICTURE: 'PICTURE',
  WHITEBOARD_UNDO: 'UNDO',
  WHITEBOARD_REDO: 'REDO',
  WHITEBOARD_CLEAR: 'CLEAR',
}

const Whiteboard = ({ user, whiteboardSessionID, setWhiteBoardSessionId }) => {
  const canvasRef = useRef()
  // eslint-disable-next-line no-unused-vars
  const [context, setContext] = useState(null) //Where is context used.
  const dispatch = useDispatch()
  const [roomId, setRoomId] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawings, setDrawings] = useState([])
  const [currentDrawing, setCurrentDrawing] = useState({
    type: typesDef.WHITEBOARD_DRAW,
    color: 'black',
    size: 4,
    points: [],
  })
  const [websocket, setWebsocket] = useState(null)
  const [redoDrawings, setRedoDrawings] = useState([])

  useEffect(() => {
    const canvas = canvasRef.current

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    resizeCanvas()

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    setContext(ctx) // This must be after the fillStyle and fillRect

    const ws = createWebSocket()
    setWebsocket(ws)

    ws.onopen = () => {
      console.log('WebSocket connection established onopen')
      console.log(ws)
      // Need to send username to server.
      if (user.username) {
        if (whiteboardSessionID === 'newSession') {
          console.log('New ws with newSession.')
          ws.send(
            JSON.stringify({
              username: user.username,
              type: typesDef.CREATE_NEW_ROOM,
            })
          )
        } else {
          console.log('New ws with join session.')
          ws.send(
            JSON.stringify({
              username: user.username,
              roomId: whiteboardSessionID,
              type: typesDef.ASK_TO_JOIN_ROOM,
            })
          )
        }
      }
    }

    ws.onmessage = (event) => {
      console.log('ws.onmessage')
      const data = JSON.parse(event.data)
      if (data.type === typesDef.WHITEBOARD_DRAW) {
        console.log('WHITEBOARD_DRAW')
        draw(ctx, data)
      } else if (data.type === typesDef.WHITEBOARD_PICTURE) {
        console.log('WHITEBOARD_PICTURE')
        //TODO
      } else if (data.type === typesDef.WHITEBOARD_UNDO) {
        console.log('WHITEBOARD_UNDO')
        //TODO
      } else if (data.type === typesDef.WHITEBOARD_REDO) {
        console.log('WHITEBOARD_REDO')
        //TODO
      } else if (data.type === typesDef.WHITEBOARD_CLEAR) {
        console.log('WHITEBOARD_CLEAR')
        clear()
      } else if (data.type === typesDef.CREATE_NEW_ROOM) {
        console.log('CREATE_NEW_ROOM')
        newRoomCreated(data)
      } else if (data.type === typesDef.ASK_TO_JOIN_ROOM) {
        // This asks from room owner if user x can be added
        console.log('ASK_TO_JOIN_ROOM')
        askIfUserCanJoin(data, ws)
      } else if (data.type === typesDef.ADD_USER_TO_ROOM) {
        // This is notification that user was added
        console.log('ADD_USER_TO_ROOM')
        userJoined(data)
      } else if (data.type === typesDef.REJECT_JOIN_TO_ROOM) {
        console.log('REJECT_JOIN_TO_ROOM')
        userRejected()
      } else if (data.type === typesDef.USER_LEFTH) {
        console.log('USER_LEFTH')
        userLeft(data)
      } else if (data.type === typesDef.OWNER_LEFT) {
        console.log('OWNER_LEFT')
        ownerLeft(data)
      } else {
        console.log('Unknown ws type:')
        console.log(event)
      }
    }

    return () => {
      console.log('Closing ws')
      ws.close()
    }
  }, [])

  if (!user) {
    return null
  }

  const draw = (ctx, drawing) => {
    console.log('draw')
    console.log(drawing)
    ctx.strokeStyle = drawing.color
    ctx.lineWidth = drawing.size
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
    for (let i = 1; i < drawing.points.length; i++) {
      ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
    }
    ctx.stroke()
  }

  const newRoomCreated = (data) => {
    const roomId = data.data.roomId
    console.log(`RoomId ${roomId}`)
    setRoomId(roomId)
    dispatch(
      setNotification(
        {
          message: `Room with ${roomId} created.`,
          severity: 'success',
        },
        5
      )
    )
  }

  const newUserToJoinAccept = (userId, ws) => {
    ws.send(
      JSON.stringify({
        type: typesDef.ADD_USER_TO_ROOM,
        userId: userId,
      })
    )
  }

  const newUserToJoinReject = (userId, ws) => {
    ws.send(
      JSON.stringify({
        type: typesDef.REJECT_JOIN_TO_ROOM,
        userId: userId,
      })
    )
  }

  const askIfUserCanJoin = (data, ws) => {
    console.log(data)
    const userId = data.data.userId
    const username = data.data.username
    confirmAlert({
      title: 'Add user',
      message: `Do you want to add user ${username}?`,
      buttons: [
        {
          label: 'Yes',
          onClick: () => newUserToJoinAccept(userId, ws),
        },
        {
          label: 'No',
          onClick: () => newUserToJoinReject(userId, ws),
        },
      ],
      closeOnEscape: false,
      closeOnClickOutside: false,
    })
  }

  const userJoined = (data) => {
    const username = data.data.username

    if (user && user.username === username) {
      console.log(`You joined to room ${whiteboardSessionID}`)
      setRoomId(whiteboardSessionID)
    }
    console.log(`User ${username} joined.`)
    dispatch(
      setNotification(
        {
          message: `User ${username} joined.`,
          severity: 'success',
        },
        5
      )
    )
  }

  const userRejected = () => {
    console.log('Request to join was rejected, or room does not exist.')
    dispatch(
      setNotification(
        {
          message: 'Request to join was rejected, or room does not exist.',
          severity: 'error',
        },
        5
      )
    )
    setWhiteBoardSessionId(null)
  }

  const userLeft = (data) => {
    const username = data.data.username
    console.log(`User ${username} left.`)
    dispatch(
      setNotification(
        {
          message: `User ${username} left.`,
          severity: 'success',
        },
        5
      )
    )
  }

  const saveImageAndExit = () => {
    handleSave()
    setWhiteBoardSessionId(null)
  }

  const ownerLeft = (data) => {
    const username = data.data.username
    console.log(`Owner ${username} left.`)
    confirmAlert({
      title: 'Session ended',
      message: `Owner ${username} left. Save session and/or exit.`,
      buttons: [
        {
          label: 'Save as image',
          onClick: () => saveImageAndExit(),
        },
        {
          label: 'Exit',
          onClick: () => setWhiteBoardSessionId(null),
        },
      ],
      closeOnEscape: false,
      closeOnClickOutside: false,
    })
  }

  const handleMouseDown = (event) => {
    setIsDrawing(true)
    setCurrentDrawing({
      type: typesDef.WHITEBOARD_DRAW,
      color: 'black',
      size: 5,
      points: [{ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }],
    })
  }

  const handleMouseMove = (event) => {
    if (!isDrawing) return
    const newPoint = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    }
    setCurrentDrawing((prevState) => ({
      ...prevState,
      points: [...prevState.points, newPoint],
    }))
    draw(canvasRef.current.getContext('2d'), currentDrawing)
    websocket.send(JSON.stringify(currentDrawing))
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setDrawings((prevState) => [...prevState, currentDrawing])
    setCurrentDrawing({
      type: typesDef.WHITEBOARD_DRAW,
      color: 'black',
      size: 5,
      points: [],
    })
    setRedoDrawings([])
  }

  const handleUndo = () => {
    if (drawings.length === 0) return
    const lastDrawing = drawings[drawings.length - 1]
    setDrawings((prevState) => prevState.slice(0, prevState.length - 1))
    setRedoDrawings((prevState) => [...prevState, lastDrawing])
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    drawings
      .slice(0, drawings.length - 1)
      .forEach((drawing) => draw(ctx, drawing))

    websocket.send(JSON.stringify({ type: typesDef.WHITEBOARD_UNDO }))
  }

  const handleRedo = () => {
    if (redoDrawings.length === 0) return
    const lastRedoDrawing = redoDrawings[redoDrawings.length - 1]
    setRedoDrawings((prevState) => prevState.slice(0, prevState.length - 1))
    setDrawings((prevState) => [...prevState, lastRedoDrawing])
    draw(canvasRef.current.getContext('2d'), lastRedoDrawing)

    websocket.send(JSON.stringify({ type: typesDef.WHITEBOARD_REDO }))
  }

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    setDrawings([])
    setRedoDrawings([])
  }

  const handleClear = () => {
    clear()
    websocket.send(JSON.stringify({ type: typesDef.WHITEBOARD_CLEAR }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const canvasWidth = 1000
        const canvasHeight = 500
        canvas.width = canvasWidth
        canvas.height = canvasHeight

        const scale = Math.min(
          canvasWidth / img.width,
          canvasHeight / img.height
        )
        const x = canvasWidth / 2 - (img.width / 2) * scale
        const y = canvasHeight / 2 - (img.height / 2) * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        // Send the image data to the server
        const data = canvas.toDataURL('image/png')
        websocket.send(
          JSON.stringify({
            type: typesDef.WHITEBOARD_PICTURE,
            data: data,
          })
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const canvasStyle = {
    width: '1000px',
    height: '500px',
    border: '3px solid black',
    padding: '10px',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    margin: 'auto',
    background_color: 'white',
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = dataURL
    downloadLink.download = 'whiteboard.png'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
      <button onClick={handleClear}>Clear</button>
      <button onClick={handleSave}>Save</button>
      <input type='file' accept='image/*' onChange={handleFileChange} />
      <p>RoomId: {roomId}</p>
    </div>
  )
}

export default Whiteboard
