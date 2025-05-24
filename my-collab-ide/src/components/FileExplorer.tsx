// FileExplorer.tsx (只需移除 updateEditorContent 的使用)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 导入自定义图标
import defaultFolderIcon from '../icons/Coding_icons/default_folder.svg';
import defaultFolderOpenedIcon from '../icons/Coding_icons/default_folder_opened.svg';
import cFileIcon from '../icons/Coding_icons/file_type_c.svg';
import cppFileIcon from '../icons/Coding_icons/file_type_cpp2.svg';
import javaFileIcon from '../icons/Coding_icons/file_type_java.svg';
import pythonFileIcon from '../icons/Coding_icons/file_type_python.svg';
import defaultFileIcon from '../icons/Coding_icons/icons8-文件-80.png';

// API 基础 URL
const API_BASE_URL = 'http://localhost:3001/api';

// 文件类型接口
interface FileNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: FileNode[];
  size?: number;
  modifyTime?: string;
}

interface FileExplorerProps {
  activeFile: string;
  setActiveFile: (filePath: string) => void;
  // 移除 updateEditorContent prop，这个职责不属于 FileExplorer
  // updateEditorContent: (content: string) => void; // <--- 移除这一行
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  activeFile,
  setActiveFile,
  // updateEditorContent // <--- 移除这一行
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true); // 初始为 true
  const [error, setError] = useState<string | null>(null);

  // 获取文件树
  useEffect(() => {
    const fetchFileTree = async () => {
      setIsLoading(true); // 开始加载时设置为 true
      setError(null); // 清除之前的错误

      try {
        console.log('正在请求文件树:', `${API_BASE_URL}/files/tree`); // 调试信息
        const response = await axios.get<FileNode[]>(`${API_BASE_URL}/files/tree`);
        console.log('文件树数据获取成功:', response.data); // 调试信息
        setFiles(response.data);

        // 自动展开根目录或某些默认目录，如果需要的话
        if (response.data.length > 0 && response.data[0].type === 'directory') {
            setExpandedDirs(prev => new Set(prev).add(response.data[0].path));
        }

      } catch (err) {
        console.error('获取文件树失败:', err); // 错误信息
        if (axios.isAxiosError(err)) {
          if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error') || err.response === undefined) {
            setError('无法连接到后端服务。请确保后端已启动并运行在 ' + API_BASE_URL + '。');
          } else if (err.response) {
            setError(`加载文件失败: ${err.response.status} - ${err.response.statusText || '未知错误'}`);
          } else {
            setError(`加载文件失败: ${err.message}`);
          }
        } else {
          setError(`加载文件失败: ${String(err)}`);
        }
      } finally {
        setIsLoading(false); // 无论成功或失败，都设置加载完成
      }
    };

    fetchFileTree();
  }, []); // 空依赖数组表示只在组件挂载时运行一次

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'c':
        return <img src={cFileIcon} alt="C" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
      case 'cpp':
        return <img src={cppFileIcon} alt="C++" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
      case 'java':
        return <img src={javaFileIcon} alt="Java" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
      case 'py':
        return <img src={pythonFileIcon} alt="Python" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
      default:
        return <img src={defaultFileIcon} alt="File" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
    }
  };

  // 获取文件夹图标
  const getFolderIcon = (isExpanded: boolean) => {
    return isExpanded ? (
      <img src={defaultFolderOpenedIcon} alt="Folder Opened" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
    ) : (
      <img src={defaultFolderIcon} alt="Folder Closed" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
    );
  };

  // 切换目录展开状态
  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const newExpandedDirs = new Set(prev);
      if (newExpandedDirs.has(path)) {
        newExpandedDirs.delete(path);
      } else {
        newExpandedDirs.add(path);
      }
      return newExpandedDirs;
    });
  };

  // 打开文件
  const openFile = async (file: FileNode) => {
    console.log('点击文件:', file.path); // 调试信息
    // 1. 设置活动文件，这将触发父组件 (CollaborativeEditor) 中的相应逻辑
    setActiveFile(file.path);
    // 2. 移除 updateEditorContent 的调用，加载状态由 EditorComponent 内部管理
    // updateEditorContent(`// 正在加载 ${file.name}...`); // <--- 移除这一行
  };

  // 渲染文件树
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isDirectory = node.type === 'directory';
      const isExpanded = expandedDirs.has(node.path);

      return (
        <div key={node.path} style={{ marginLeft: `${depth * 10}px` }}>
          <div
            onClick={() => (isDirectory ? toggleDir(node.path) : openFile(node))}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              // 高亮显示当前活动文件
              backgroundColor: activeFile === node.path ? 'var(--primary-light)' : 'transparent'
            }}
          >
            {isDirectory
              ? getFolderIcon(isExpanded)
              : getFileIcon(node.name)
            }
            <span style={{ marginLeft: '6px' }}>{node.name}</span>
          </div>

          {isDirectory && isExpanded && node.children && (
            <div className="folder-children">
              {renderFileTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="file-explorer" style={{ padding: '4px 0' }}>
      {/* 加载中状态 */}
      {isLoading && <div className="loading-message">加载文件中...</div>}

      {/* 错误信息 */}
      {error && (
        <div className="error-message" style={{ color: 'red', padding: '8px' }}>
          {error}
        </div>
      )}

      {/* 显示文件树 */}
      {!isLoading && !error && files.length > 0 && (
        <div>
          <div style={{ padding: '4px 8px', fontWeight: 'bold', color: 'var(--text-mid)' }}>
            /data/My_Desktop/User_Coding
          </div>
          {renderFileTree(files)}
        </div>
      )}

      {/* 如果没有文件且加载完成且没有错误 */}
      {!isLoading && !error && files.length === 0 && (
        <div className="no-files-message" style={{ padding: '8px', color: 'var(--text-mid)' }}>
          暂无文件或目录。
        </div>
      )}
    </div>
  );
};

export default FileExplorer;