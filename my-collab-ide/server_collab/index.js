// server/index.js
const express = require('express');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils.js'); // y-websocket 的工具方法

const app = express();
const httpServer = require('http').createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
  // 提取文档名称（例如：从 URL 获取）
  const docName = req.url.slice(1) || 'default-room';
  
  // 使用 y-websocket 提供的 setupWSConnection 方法来处理连接
  setupWSConnection(ws, req, { docName });
  
  console.log(`WebSocket connection established for document: ${docName}`);
});

const PORT = process.env.PORT || 1234;
httpServer.listen(PORT, () => {
  console.log(`✅ WebSocket server running at ws://localhost:${PORT}`);
});
