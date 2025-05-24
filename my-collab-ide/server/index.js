const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const filesRouter = require('./routes/files');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// 存储活跃的编译任务
const activeCompilations = new Map();

// 存储在线用户和文件编辑状态
const activeUsers = new Map(); // userId -> { socketId, currentFile, userName }
const fileCollaborators = new Map(); // filePath -> Set of userIds

// 中间件
app.use(cors());
app.use(express.json());

// 将 io 实例传递给路由
app.use('/api/files', (req, res, next) => {
    req.io = io;
    next();
}, filesRouter);

// WebSocket 连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 用户加入协作
    socket.on('join-collaboration', (data) => {
        const { userId, userName, filePath } = data;

        // 记录用户信息
        activeUsers.set(userId, {
            socketId: socket.id,
            currentFile: filePath,
            userName: userName || `用户${userId.slice(0, 6)}`
        });

        // 加入文件房间
        socket.join(`file-${filePath}`);

        // 记录文件协作者
        if (!fileCollaborators.has(filePath)) {
            fileCollaborators.set(filePath, new Set());
        }
        fileCollaborators.get(filePath).add(userId);

        // 通知其他用户有新协作者加入
        socket.to(`file-${filePath}`).emit('user-joined', {
            userId,
            userName: activeUsers.get(userId).userName,
            filePath
        });

        // 发送当前协作者列表
        const collaborators = Array.from(fileCollaborators.get(filePath))
            .map(id => ({
                userId: id,
                userName: activeUsers.get(id)?.userName || id
            }));

        io.to(`file-${filePath}`).emit('collaborators-updated', {
            filePath,
            collaborators
        });
    });

    // 实时文件内容同步
    socket.on('file-content-change', (data) => {
        const { filePath, content, userId, changes } = data;

        // 广播内容变更给其他协作者
        socket.to(`file-${filePath}`).emit('file-content-updated', {
            filePath,
            content,
            userId,
            changes,
            timestamp: Date.now()
        });
    });

    // 光标位置同步
    socket.on('cursor-position-change', (data) => {
        const { filePath, userId, position, selection } = data;

        socket.to(`file-${filePath}`).emit('cursor-position-updated', {
            filePath,
            userId,
            position,
            selection,
            userName: activeUsers.get(userId)?.userName
        });
    });

    // 用户离开文件
    socket.on('leave-file', (data) => {
        const { filePath, userId } = data;

        socket.leave(`file-${filePath}`);

        if (fileCollaborators.has(filePath)) {
            fileCollaborators.get(filePath).delete(userId);

            // 通知其他用户
            socket.to(`file-${filePath}`).emit('user-left', {
                userId,
                filePath
            });
        }
    });

    // 开始编译
    socket.on('start-compilation', (data) => {
        const { filePath, command, userId } = data;
        const compilationKey = `${filePath}-${Date.now()}`;

        activeCompilations.set(compilationKey, {
            filePath,
            command,
            userId,
            startTime: Date.now(),
            status: 'running'
        });

        // 广播编译开始
        io.to(`compilation-${filePath}`).emit('compilation-started', {
            compilationKey,
            filePath,
            command,
            userId,
            startTime: Date.now()
        });
    });

    // 编译完成
    socket.on('compilation-complete', (data) => {
        const { compilationKey, result } = data;
        const compilation = activeCompilations.get(compilationKey);

        if (compilation) {
            compilation.status = 'completed';
            compilation.result = result;
            compilation.endTime = Date.now();

            // 广播编译完成
            io.to(`compilation-${compilation.filePath}`).emit('compilation-completed', {
                compilationKey,
                ...compilation
            });

            // 清理已完成的编译任务
            setTimeout(() => {
                activeCompilations.delete(compilationKey);
            }, 60000); // 1分钟后清理
        }
    });

    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);

        // 清理用户状态
        for (const [userId, userInfo] of activeUsers.entries()) {
            if (userInfo.socketId === socket.id) {
                const filePath = userInfo.currentFile;

                // 从文件协作者中移除
                if (fileCollaborators.has(filePath)) {
                    fileCollaborators.get(filePath).delete(userId);

                    // 通知其他协作者
                    socket.to(`file-${filePath}`).emit('user-left', {
                        userId,
                        filePath
                    });
                }

                activeUsers.delete(userId);
                break;
            }
        }
    });
});

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
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`连接到远程服务器: ${process.env.SSH_HOST}`);
    console.log(`基础目录: ${process.env.BASE_DIR}`);
});