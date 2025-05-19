import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { throttle } from 'lodash';

// 导入自定义图标
import defaultFolderIcon from '../icons/Coding_icons/default_folder.svg';
import defaultFolderOpenedIcon from '../icons/Coding_icons/default_folder_opened.svg';
import cFileIcon from '../icons/Coding_icons/file_type_c.svg';
import cppFileIcon from '../icons/Coding_icons/file_type_cpp2.svg';
import javaFileIcon from '../icons/Coding_icons/file_type_java.svg';
import pythonFileIcon from '../icons/Coding_icons/file_type_python.svg';
import defaultFileIcon from '../icons/Coding_icons/icons8-文件-80.png';

import newFileIcon from '../icons/icons8-添加文件-80.png';
import newFolderIcon from '../icons/icons8-新增文件夹-80.png';

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

// 修改接口定义
interface FileExplorerProps {
  activeFile: string;
  setActiveFile: (filePath: string) => void;
  openFileTab: (filePath: string, content?: string) => Promise<void>; // 新增的文件标签打开方法
  updateEditorContent: (content: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  activeFile,
  setActiveFile,
  openFileTab,
  updateEditorContent
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rootDir] = useState<string>('/data/My_Desktop/User_Coding');
  // 添加文件加载状态跟踪
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  // 添加文件内容缓存
  const [fileContentCache, setFileContentCache] = useState<Record<string, {
    content: string;
    timestamp: number;
  }>>({});

  // 添加新状态用于文件/文件夹创建
  const [currentPath, setCurrentPath] = useState<string>(rootDir);
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [creatingItem, setCreatingItem] = useState<boolean>(false);

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'c':
        return <img src={cFileIcon} alt="C" width="16" height="16" />;
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'h':
      case 'hpp':
        return <img src={cppFileIcon} alt="C++" width="16" height="16" />;
      case 'java':
        return <img src={javaFileIcon} alt="Java" width="16" height="16" />;
      case 'py':
      case 'python':
        return <img src={pythonFileIcon} alt="Python" width="16" height="16" />;
      default:
        return <img src={defaultFileIcon} alt="File" width="16" height="16" />;
    }
  };

  // 新建文件处理函数
  const handleCreateFile = async () => {
    if (!newItemName.trim()) {
      alert('文件名不能为空');
      return;
    }

    setCreatingItem(true);
    try {
      const newFilePath = `${currentPath}/${newItemName}`;

      await axios.post(`${API_BASE_URL}/files/create`, {
        path: newFilePath,
        type: 'file',
        content: '' // 创建空文件
      });

      // 刷新文件树
      await refreshFileTree();

      // 打开新创建的文件
      await openFileTab(newFilePath, '');

      // 重置状态
      setNewItemName('');
      setShowNewFileInput(false);
    } catch (err) {
      console.error('创建文件失败:', err);
      alert(`创建文件失败: ${err}`);
    } finally {
      setCreatingItem(false);
    }
  };

  // 新建文件夹处理函数
  const handleCreateFolder = async () => {
    if (!newItemName.trim()) {
      alert('文件夹名不能为空');
      return;
    }

    setCreatingItem(true);
    try {
      const newFolderPath = `${currentPath}/${newItemName}`;

      await axios.post(`${API_BASE_URL}/files/create`, {
        path: newFolderPath,
        type: 'directory'
      });

      // 刷新文件树
      await refreshFileTree();

      // 自动展开新创建的文件夹
      setExpandedFolders(prev => ({
        ...prev,
        [newFolderPath]: true
      }));

      // 重置状态
      setNewItemName('');
      setShowNewFolderInput(false);
    } catch (err) {
      console.error('创建文件夹失败:', err);
      alert(`创建文件夹失败: ${err}`);
    } finally {
      setCreatingItem(false);
    }
  };

  // 添加刷新文件树的函数
  const refreshFileTree = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/files/tree`, {
        params: { path: rootDir }
      });
      setFiles(response.data);
    } catch (err) {
      console.error('刷新文件树失败:', err);
      setError('无法刷新文件树，请检查服务器连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件点击，记录当前目录
  const handleFileClick = async (file: FileNode) => {
    // 记录当前目录（文件的父目录）
    const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
    setCurrentPath(parentDir || rootDir);

    // 打开文件
    await throttledOpenFile(file);
  };


  // 获取文件夹图标
  const getFolderIcon = (isExpanded: boolean) => {
    return isExpanded
      ? <img src={defaultFolderOpenedIcon} alt="Folder open" width="16" height="16" />
      : <img src={defaultFolderIcon} alt="Folder closed" width="16" height="16" />;
  };

  // 打开文件函数
  const openFile = async (file: FileNode) => {
    try {
      // 设置此文件为加载中
      setLoadingFiles(prev => ({ ...prev, [file.path]: true }));

      // 检查缓存是否有效（5分钟内的缓存）
      const cacheEntry = fileContentCache[file.path];
      const isCacheValid = cacheEntry &&
        (Date.now() - cacheEntry.timestamp < 5 * 60 * 1000);

      if (isCacheValid) {
        // 使用缓存内容
        await openFileTab(file.path, cacheEntry.content);
        return;
      }

      // 从服务器获取文件内容
      const response = await axios.get(`${API_BASE_URL}/files/content`, {
        params: { path: file.path },
        timeout: 5000
      });

      // 更新缓存
      setFileContentCache(prev => ({
        ...prev,
        [file.path]: {
          content: response.data.content,
          timestamp: Date.now()
        }
      }));

      // 直接调用openFileTab
      await openFileTab(file.path, response.data.content);
    } catch (err) {
      console.error('打开文件失败:', err);
      // 只有在出错时才更新编辑器内容显示错误
      updateEditorContent(`// 加载文件内容失败: ${file.path}\n// 错误: ${err}`);
    } finally {
      // 清除加载状态
      setLoadingFiles(prev => ({ ...prev, [file.path]: false }));
    }
  };

  // 创建节流版本的openFile函数
  const throttledOpenFile = throttle((file: FileNode) => openFile(file), 500);

  // 加载目录树
  useEffect(() => {
    const fetchFileTree = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/files/tree`, {
          params: { path: rootDir }
        });
        setFiles(response.data);
      } catch (err) {
        console.error('加载文件树失败:', err);
        setError('无法加载文件树，请检查服务器连接');

        // 开发阶段：使用模拟数据
        if (process.env.NODE_ENV === 'development') {
          console.log('使用模拟数据...');
          setFiles([
            {
              name: 'projects',
              path: `${rootDir}/projects`,
              type: 'directory',
              children: [
                { name: 'hello.c', path: `${rootDir}/projects/hello.c`, type: 'file' },
                { name: 'example.cpp', path: `${rootDir}/projects/example.cpp`, type: 'file' }
              ]
            },
            {
              name: 'python_examples',
              path: `${rootDir}/python_examples`,
              type: 'directory',
              children: [
                { name: 'hello.py', path: `${rootDir}/python_examples/hello.py`, type: 'file' }
              ]
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileTree();
  }, [rootDir]);

  // 切换文件夹展开状态
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
    // 更新当前路径
    setCurrentPath(folderPath);
  };

  // 递归渲染文件树
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isDirectory = node.type === 'directory';
      const isExpanded = expandedFolders[node.path] || false;
      const isFileLoading = loadingFiles[node.path] || false;

      return (
        <div key={node.path} style={{ marginLeft: `${depth * 12}px` }}>
          <div
            className={`file-item ${activeFile === node.path ? 'active' : ''}`}
            onClick={() => {
              if (isDirectory) {
                toggleFolder(node.path);
              } else {
                handleFileClick(node);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: activeFile === node.path ? 'var(--primary-light)' : 'transparent'
            }}
          >
            {isDirectory
              ? getFolderIcon(isExpanded)
              : (
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {getFileIcon(node.name)}
                  {isFileLoading && (
                    <span className="file-loading-spinner" style={{
                      position: 'absolute',
                      right: '-8px',
                      top: '-8px',
                      fontSize: '10px',
                      animation: 'spin 1s infinite linear'
                    }}>⟳</span>
                  )}
                </div>
              )
            }
            <span style={{ marginLeft: '6px' }}>{node.name}</span>
            {fileContentCache[node.path] && (
              <span title="已缓存" style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.5 }}>✓</span>
            )}
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
 .file-explorer-actions {
          display: flex;
          padding: 8px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--surface-light);
          justify-content: space-between;
          align-items: center;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .action-button:hover {
          background-color: var(--primary-light);
        }
        
        .action-button img {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }
        
        .new-item-input-container {
          display: flex;
          padding: 8px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--surface-lightest);
          align-items: center;
        }
        
        .new-item-input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-light);
          border-radius: 4px;
          font-size: 13px;
        }
        
        .new-item-input:focus {
          outline: none;
          border-color: var(--primary-blue);
        }
        
        .new-item-actions {
          display: flex;
          gap: 4px;
          margin-left: 8px;
        }
        
        .new-item-button {
          padding: 4px 8px;
          border-radius: 4px;
          border: none;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .confirm-button {
          background-color: var(--primary-blue);
          color: white;
        }
        
        .confirm-button:hover {
          background-color: var(--primary-dark);
        }
        
        .cancel-button {
          background-color: var(--surface-mid);
          color: var(--text-dark);
        }
        
        .cancel-button:hover {
          background-color: var(--surface-dark);
        }

      `}</style>

      {/* 文件操作工具栏 */}
      <div className="file-explorer-actions">
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="action-button"
            title="新建文件"
            onClick={() => {
              setShowNewFileInput(true);
              setShowNewFolderInput(false);
              setNewItemName('');
            }}
          >
            <img src={newFileIcon} alt="新建文件" />
          </button>
          <button
            className="action-button"
            title="新建文件夹"
            onClick={() => {
              setShowNewFolderInput(true);
              setShowNewFileInput(false);
              setNewItemName('');
            }}
          >
            <img src={newFolderIcon} alt="新建文件夹" />
          </button>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-mid)' }}>
          {currentPath.replace(rootDir, '') || '/'}
        </div>
        <button
          className="action-button"
          title="刷新文件列表"
          onClick={refreshFileTree}
        >
          <span style={{ fontSize: '16px' }}>↻</span>
        </button>
      </div>

      {/* 新建文件输入框 */}
      {showNewFileInput && (
        <div className="new-item-input-container">
          <input
            type="text"
            className="new-item-input"
            placeholder="输入文件名..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            autoFocus
            disabled={creatingItem}
          />
          <div className="new-item-actions">
            <button
              className="new-item-button confirm-button"
              onClick={handleCreateFile}
              disabled={creatingItem}
            >
              {creatingItem ? '创建中...' : '确定'}
            </button>
            <button
              className="new-item-button cancel-button"
              onClick={() => setShowNewFileInput(false)}
              disabled={creatingItem}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 新建文件夹输入框 */}
      {showNewFolderInput && (
        <div className="new-item-input-container">
          <input
            type="text"
            className="new-item-input"
            placeholder="输入文件夹名..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            autoFocus
            disabled={creatingItem}
          />
          <div className="new-item-actions">
            <button
              className="new-item-button confirm-button"
              onClick={handleCreateFolder}
              disabled={creatingItem}
            >
              {creatingItem ? '创建中...' : '确定'}
            </button>
            <button
              className="new-item-button cancel-button"
              onClick={() => setShowNewFolderInput(false)}
              disabled={creatingItem}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && <div className="loading-message">加载文件中...</div>}

        {error && (
          <div className="error-message" style={{ color: 'red', padding: '8px' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && files.length > 0 && (
          <div>
            <div style={{ padding: '4px 8px', fontWeight: 'bold', color: 'var(--text-mid)' }}>
              /data/My_Desktop/User_Coding
            </div>
            {/* 修改文件树渲染，使用更新后的点击处理函数 */}
            {renderFileTree(files)}
          </div>
        )}

        {!isLoading && !error && files.length === 0 && (
          <div className="empty-directory" style={{ padding: '8px' }}>
            目录为空
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;