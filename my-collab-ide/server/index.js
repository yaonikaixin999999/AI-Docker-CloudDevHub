const express = require('express');
const cors = require('cors');
const path = require('path');
const filesRouter = require('./routes/files');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/files', filesRouter);

// 基础路由
app.get('/', (req, res) => {
    res.json({ message: '云编码服务器 API 正常运行' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`连接到远程服务器: ${process.env.SSH_HOST}`);
    console.log(`基础目录: ${process.env.BASE_DIR}`);
});