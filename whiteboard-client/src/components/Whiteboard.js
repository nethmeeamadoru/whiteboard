import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux'
import { confirmAlert } from 'react-confirm-alert';

import { setNotification } from '../reducers/notificationReducer'
import { createWebSocket } from "../websocket";

const typesDef = {
  CREATE_NEW_ROOM: 'createnewroom',
  ASK_TO_JOIN_ROOM: 'asktojoinroom',
  ADD_USER_TO_ROOM: 'adduser',
  REJECT_JOIN_TO_ROOM: 'rejectjointoroom',
  USER_LEFTH: 'userleft',
  OWNER_LEFT: 'ownerleft',
  WHITEBOARD_EVENT: 'whiteboardevent',
}

const Whiteboard = ({ user, whiteboardSessionID, setWhiteBoardSessionId }) => {
  const canvasRef = useRef();
  const dispatch = useDispatch()
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState({
    type: "DRAW",
    color: "black",
    size: 4,
    points: [],
  });
  const [websocket, setWebsocket] = useState(null);
  const [redoDrawings, setRedoDrawings] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
  
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight

    }
    resizeCanvas();

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ws = createWebSocket();
    setWebsocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      // Need to send username to server.
      if (user.username && websocket) {
        if (whiteboardSessionID === 'newSession') {
          websocket.send(JSON.stringify({
            username: user.username,
            type: typesDef.CREATE_NEW_ROOM,
          }))
        } else {
          websocket.send(JSON.stringify({
            username: user.username,
            roomId: whiteboardSessionID,
            type: typesDef.ASK_TO_JOIN_ROOM,
          }))
        }
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === typesDef.WHITEBOARD_EVENT) {
        draw(ctx, data);
      }
      else if (data.type === typesDef.CREATE_NEW_ROOM) {
        newRoomCreated(ctx, data)
      }
      else if (data.type === typesDef.ASK_TO_JOIN_ROOM) {
        // This asks from room owner if user x can be added
        askIfUserCanJoin(ctx, data)
      }
      else if (data.type === typesDef.ADD_USER_TO_ROOM) {
        // This is notification that user was added
        userJoined(ctx, data)
      }
      else if (data.type === typesDef.REJECT_JOIN_TO_ROOM) {
        userRejected(ctx, data)
      }
      else if (data.type === typesDef.USER_LEFTH) {
        userLeft(ctx, data)
      }
      else if (data.type === typesDef.OWNER_LEFT) {
        ownerLeft(ctx, data)
      }
    };

    return () => {
      ws.close();
    };

  }, [user]);

  if (!user) {
    return null
  }

  const draw = (ctx, drawing) => {
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.size;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
    for (let i = 1; i < drawing.points.length; i++) {
      ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
    }
    ctx.stroke();
  };

  const newRoomCreated = (ctx, data) => {
    const roomId = data.roomId
    setWhiteBoardSessionId(roomId)
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

  const newUserToJoinAccept = (userId) => {
    websocket.send(JSON.stringify({
      type: typesDef.ADD_USER_TO_ROOM,
      userId: userId
    }))
  }

  const newUserToJoinReject = (userId) => {
    websocket.send(JSON.stringify({
      type: typesDef.REJECT_JOIN_TO_ROOM,
      userId: userId
    }))
  }

  const askIfUserCanJoin = (ctx, data) => {
    const userId = data.userId
    const username = data.username
    confirmAlert({
      title: `Add user`,
      message: `Do you want to add user ${username}?`,
      buttons: [
        {
          label: 'Yes',
          onClick: () => newUserToJoinAccept(userId)
        },
        {
          label: 'No',
          onClick: () => newUserToJoinReject(userId)
        }
      ]
    })

  }

  const userJoined = (ctx, data) => {
    const username = data.username
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
  const userRejected = (ctx, data) => {
    // TODO: use popup and reroute back to CreateOrJoinWhiteboard.
    console.log('Request to join was rejected, or room does not exist.')
    dispatch(
      setNotification(
        {
          message: `Request to join was rejected, or room does not exist.`,
          severity: 'error',
        },
        5
      )
    )
    setWhiteBoardSessionId(null)
  }
  const userLeft = (ctx, data) => {
    const username = data.username
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
  const ownerLeft = (ctx, data) => {
    const username = data.username
    console.log(`Owner ${username} left.`)
    // TODO: use info popup with two buttons (save, exit) and after reroute to CreateOrJoinWhiteboard.
    dispatch(
      setNotification(
        {
          message: `Owner ${username} left. Save session and/or exit.`,
          severity: 'error',
        },
        5
      )
    )
  }

  const handleMouseDown = (event) => {
    setIsDrawing(true);
    setCurrentDrawing({
      type: "DRAW",
      color: "black",
      size: 5,
      points: [{ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }],
    });
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const newPoint = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    setCurrentDrawing((prevState) => ({
      ...prevState,
      points: [...prevState.points, newPoint],
    }));
    draw(canvasRef.current.getContext("2d"), currentDrawing);
    websocket.send(JSON.stringify(currentDrawing));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDrawings((prevState) => [...prevState, currentDrawing]);
    setCurrentDrawing({
      type: "DRAW",
      color: "black",
      size: 5,
      points: [],
    });
    setRedoDrawings([]);
  };

  const handleUndo = () => {
    if (drawings.length === 0) return;
    const lastDrawing = drawings[drawings.length - 1];
    setDrawings((prevState) => prevState.slice(0, prevState.length - 1));
    setRedoDrawings((prevState) => [...prevState, lastDrawing]);
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawings.slice(0, drawings.length - 1).forEach((drawing) => draw(ctx, drawing));
  };

  const handleRedo = () => {
    if (redoDrawings.length === 0) return;
    const lastRedoDrawing = redoDrawings[redoDrawings.length - 1];
    setRedoDrawings((prevState) => prevState.slice(0, prevState.length - 1));
    setDrawings((prevState) => [...prevState, lastRedoDrawing]);
    draw(canvasRef.current.getContext("2d"), lastRedoDrawing);
  };

  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setDrawings([]);
    setRedoDrawings([]);
  };

  



  // THIS STILL NEED UPLOADING WITH WEBSOCKETS AND THE IMAGES ARE TOO BIG .Marco
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const canvasWidth = 1000;
        const canvasHeight = 500; 
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const x = (canvasWidth / 2) - (img.width / 2) * scale;
        const y = (canvasHeight / 2) - (img.height / 2) * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };


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
  };

  const saveAsPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

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
        <button onClick={saveAsPNG}>Save</button>
        <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

  export default Whiteboard;
