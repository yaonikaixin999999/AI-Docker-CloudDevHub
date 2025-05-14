const { Client } = require('ssh2');
const path = require('path');
require('dotenv').config();

// 获取SSH连接配置
const getSSHConfig = () => {
    return {
        host: process.env.SSH_HOST,
        port: parseInt(process.env.SSH_PORT || '22'),
        username: process.env.SSH_USER,
        password: process.env.SSH_PASSWORD
    };
};

// 创建SSH连接
const createConnection = () => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const config = getSSHConfig();

        conn.on('ready', () => {
            resolve(conn);
        });

        conn.on('error', (err) => {
            reject(err);
        });

        conn.connect(config);
    });
};

// 获取目录内容
const listDirectory = async (dirPath) => {
    const conn = await createConnection();

    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                conn.end();
                return reject(err);
            }

            sftp.readdir(dirPath, (err, list) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }

                const fileList = list.map(item => {
                    return {
                        name: item.filename,
                        path: path.posix.join(dirPath, item.filename),
                        type: item.attrs.isDirectory() ? 'directory' : 'file',
                        size: item.attrs.size,
                        modifyTime: new Date(item.attrs.mtime * 1000).toISOString()
                    };
                });

                conn.end();
                resolve(fileList);
            });
        });
    });
};

// 获取文件内容
const getFileContent = async (filePath) => {
    const conn = await createConnection();

    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                conn.end();
                return reject(err);
            }

            sftp.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
                conn.end();

                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    });
};

// 保存文件内容
const saveFileContent = async (filePath, content) => {
    const conn = await createConnection();

    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                conn.end();
                return reject(err);
            }

            const stream = sftp.createWriteStream(filePath);

            stream.on('error', (err) => {
                conn.end();
                reject(err);
            });

            stream.on('close', () => {
                conn.end();
                resolve({ success: true, message: '文件保存成功' });
            });

            stream.write(content);
            stream.end();
        });
    });
};

// 递归获取完整目录结构
const getDirectoryTree = async (dirPath, depth = 0) => {
    // 限制递归深度，避免过于庞大的请求
    if (depth > 3) return [];

    try {
        const fileList = await listDirectory(dirPath);
        const result = [];

        for (const file of fileList) {
            // 跳过隐藏文件
            if (file.name.startsWith('.')) continue;

            if (file.type === 'directory') {
                const children = await getDirectoryTree(file.path, depth + 1);
                result.push({
                    ...file,
                    children
                });
            } else {
                result.push(file);
            }
        }

        return result;
    } catch (error) {
        console.error(`获取目录树失败: ${dirPath}`, error);
        return [];
    }
};

// 执行命令
const executeCommand = async (command) => {
    const conn = await createConnection();

    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                conn.end();
                return reject(err);
            }

            let stdout = '';
            let stderr = '';

            stream.on('close', (code) => {
                conn.end();
                resolve({ code, stdout, stderr });
            });

            stream.on('data', (data) => {
                stdout += data.toString();
            });

            stream.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        });
    });
};

module.exports = {
    listDirectory,
    getFileContent,
    saveFileContent,
    getDirectoryTree,
    executeCommand
};