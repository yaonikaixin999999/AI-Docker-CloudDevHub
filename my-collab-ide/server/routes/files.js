const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const sshService = require('../services/sshService');
require('dotenv').config();

const BASE_DIR = process.env.BASE_DIR || '/data/My_Desktop/User_Coding';

// 路径安全检查
const isPathSafe = (requestPath) => {
    const normalizedPath = path.posix.normalize(requestPath);
    return normalizedPath.startsWith(BASE_DIR);
};

// 获取文件目录结构
router.get('/list', async (req, res) => {
    try {
        const dirPath = req.query.path || BASE_DIR;

        if (!isPathSafe(dirPath)) {
            return res.status(403).json({ error: '访问被拒绝：请求的路径不在允许的范围内' });
        }

        const files = await sshService.listDirectory(dirPath);
        res.json(files);
    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({ error: '获取文件列表失败' });
    }
});

// 获取文件目录树
router.get('/tree', async (req, res) => {
    try {
        const dirPath = req.query.path || BASE_DIR;

        if (!isPathSafe(dirPath)) {
            return res.status(403).json({ error: '访问被拒绝：请求的路径不在允许的范围内' });
        }

        const tree = await sshService.getDirectoryTree(dirPath);
        res.json(tree);
    } catch (error) {
        console.error('获取文件树失败:', error);
        res.status(500).json({ error: '获取文件树失败' });
    }
});

// 获取文件内容
router.get('/content', async (req, res) => {
    try {
        const filePath = req.query.path;

        if (!filePath) {
            return res.status(400).json({ error: '请提供文件路径' });
        }

        if (!isPathSafe(filePath)) {
            return res.status(403).json({ error: '访问被拒绝：请求的路径不在允许的范围内' });
        }

        const content = await sshService.getFileContent(filePath);
        res.json({ content });
    } catch (error) {
        console.error('获取文件内容失败:', error);
        res.status(500).json({ error: '获取文件内容失败' });
    }
});

// 保存文件内容
router.post('/save', express.text({ limit: '10mb' }), async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const content = req.body;

        if (!filePath) {
            return res.status(400).json({ error: '请提供文件路径' });
        }

        if (!isPathSafe(filePath)) {
            return res.status(403).json({ error: '访问被拒绝：请求的路径不在允许的范围内' });
        }

        const result = await sshService.saveFileContent(filePath, content);
        res.json(result);
    } catch (error) {
        console.error('保存文件内容失败:', error);
        res.status(500).json({ error: '保存文件内容失败' });
    }
});

// 执行命令（编译/运行代码等）
router.post('/execute', async (req, res) => {
    try {
        const { command, cwd, filePath, userId } = req.body;
        const io = req.io;

        if (!command) {
            return res.status(400).json({ error: '请提供要执行的命令' });
        }

        if (cwd && !isPathSafe(cwd)) {
            return res.status(403).json({ error: '访问被拒绝：请求的工作目录不在允许的范围内' });
        }

        // 构建完整命令
        const fullCommand = cwd
            ? `cd ${cwd} && ${command}`
            : `cd ${BASE_DIR} && ${command}`;

        // 生成编译任务ID
        const compilationKey = `${filePath || 'unknown'}-${Date.now()}-${userId || 'anonymous'}`;

        // 通知开始编译
        if (io && filePath) {
            io.to(`compilation-${filePath}`).emit('compilation-started', {
                compilationKey,
                filePath,
                command: fullCommand,
                userId,
                startTime: Date.now()
            });
        }

        const result = await sshService.executeCommand(fullCommand);

        // 通知编译完成
        if (io && filePath) {
            io.to(`compilation-${filePath}`).emit('compilation-completed', {
                compilationKey,
                filePath,
                command: fullCommand,
                userId,
                result,
                endTime: Date.now()
            });
        }

        res.json({ ...result, compilationKey });
    } catch (error) {
        console.error('执行命令失败:', error);

        // 通知编译失败
        if (req.io && req.body.filePath) {
            req.io.to(`compilation-${req.body.filePath}`).emit('compilation-failed', {
                filePath: req.body.filePath,
                error: error.message,
                userId: req.body.userId
            });
        }

        res.status(500).json({ error: '执行命令失败' });
    }
});

// 创建文件或目录
router.post('/create', async (req, res) => {
    try {
        const { path: filePath, type, content } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: '缺少路径参数' });
        }

        if (!isPathSafe(filePath)) {
            return res.status(403).json({ error: '访问被拒绝：请求的路径不在允许的范围内' });
        }

        let result;
        if (type === 'file') {
            // 创建文件，使用sshService
            result = await sshService.saveFileContent(filePath, content || '');
            res.json({ success: true, message: '文件创建成功' });
        } else if (type === 'directory') {
            // 创建目录，使用sshService
            // 注意：需要在sshService中添加创建目录的方法
            result = await sshService.createDirectory(filePath);
            res.json({ success: true, message: '文件夹创建成功' });
        } else {
            res.status(400).json({ error: '无效的类型参数，必须为 file 或 directory' });
        }
    } catch (error) {
        console.error('创建文件/目录错误:', error);
        res.status(500).json({ error: `服务器错误: ${error.message}` });
    }
});

module.exports = router;