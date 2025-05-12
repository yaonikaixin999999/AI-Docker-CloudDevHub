const express = require('express');
const SftpClient = require('ssh2-sftp-client');
const app = express();

const sftp = new SftpClient();

const sftpConfig = {
  host: '8.137.125.47',
  port: 22,
  username: 'root',
  password: 'Yaonikaixin999999'
};

// 递归获取所有文件路径
async function listAllFiles(remotePath) {
  let results = [];

  const list = await sftp.list(remotePath);

  for (const item of list) {
    const fullPath = `${remotePath}/${item.name}`;
    if (item.type === 'd') {
      // 是目录，递归进入
      const subFiles = await listAllFiles(fullPath);
      results = results.concat(subFiles);
    } else {
      // 是文件，记录路径
      results.push(fullPath);
    }
  }

  return results;
}

app.get('/all-file-contents', async (req, res) => {
    try {
      await sftp.connect(sftpConfig);
  
      const remotePath = '/root/My_Desktop/User_Coding';
      const allFiles = await listAllFiles(remotePath);
  
      const result = [];
  
      for (const fullPath of allFiles) {
        try {
          const fileContent = await sftp.get(fullPath);
          result.push({
            path: fullPath,
            name: fullPath.split('/').pop(),       // 提取文件名
            content: fileContent.toString()        // 文件内容（转字符串）
          });
        } catch (err) {
          console.warn(`Failed to read: ${fullPath}`, err.message);
        }
      }
  
      await sftp.end();
      res.json(result);
    } catch (err) {
      console.error('SFTP Error:', err);
      res.status(500).send('Failed to read all files');
    }
  });
  

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
