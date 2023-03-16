const createWebSocket = () => {
    const webSocketUrl = "wss://localhost:8000"; // replace
    const websocket = new WebSocket(webSocketUrl);
  
    websocket.onopen = () => {
      console.log("WebSocket connection established");
    };
  
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  
    websocket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  
    return websocket;
  };
  
  export { createWebSocket };
  
