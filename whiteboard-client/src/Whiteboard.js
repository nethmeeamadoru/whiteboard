import React, { useState, useEffect, useRef } from "react";
import { createWebSocket } from "./websocket";


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

  useEffect(() => {
    const canvas = canvasRef.current;
  
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight

};
resizeCanvas();

const ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const ws = createWebSocket();
setWebsocket(ws);

ws.onopen = () => {
  console.log("WebSocket connection established");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "DRAW") {
    draw(ctx, data);
  }
};

return () => {
  ws.close();
};

}, []);



// THIS STILL NEED UPLOADING WITH WEBSOCKETS AND THE IMAGES ARE TOO BIG .Marco
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width * 0.1;
      canvas.height = img.height * 0.1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};


const canvasStyle = {
  width: '1000px',
  height: '500px',
  border: '3px solid black'
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
