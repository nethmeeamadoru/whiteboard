import React, { useState, useEffect, useRef } from "react";
import { createWebSocket } from "./websocket";
import './index.css';


const Whiteboard = () => {
  const canvasRef = useRef();
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

    websocket.send(JSON.stringify({ type: "UNDO" }));
  };

  const handleRedo = () => {
    if (redoDrawings.length === 0) return;
    const lastRedoDrawing = redoDrawings[redoDrawings.length - 1];
    setRedoDrawings((prevState) => prevState.slice(0, prevState.length - 1));
    setDrawings((prevState) => [...prevState, lastRedoDrawing]);
    draw(canvasRef.current.getContext("2d"), lastRedoDrawing);

    websocket.send(JSON.stringify({ type: "REDO" }));
  };

  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setDrawings([]);
    setRedoDrawings([]);
  };

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
  
        // Send the image data to the server
        const data = canvas.toDataURL("image/png");
        websocket.send(JSON.stringify({
          type: "image",
          data: data
      }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };



  useEffect(() => {
    const canvas = canvasRef.current;
  
    const ws = createWebSocket();
    setWebsocket(ws);

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight

      };
      resizeCanvas();

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);   
      const drawPicture = (dataUrl) => {
      const img = new Image();
      
      img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = dataUrl;
      };

      ws.onopen = () => {
        console.log("WebSocket connection established");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'INITIAL_DATA') {
          setDrawings(data.drawings);
        } else if (data.type === "DRAW") {
          draw(ctx, data);
        } else if (data.type === "PICTURE") {
          drawPicture(data.payload);
          
        }
      };

      return () => {
        ws.close();
      };

}, []);

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
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
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
