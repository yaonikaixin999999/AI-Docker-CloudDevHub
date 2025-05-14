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
  updateEditorContent: (content: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  activeFile,
  setActiveFile,
  updateEditorContent
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rootDir] = useState<string>('/data/My_Desktop/User_Coding');

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

  // 获取文件夹图标
  const getFolderIcon = (isExpanded: boolean) => {
    return isExpanded
      ? <img src={defaultFolderOpenedIcon} alt="Folder open" width="16" height="16" />
      : <img src={defaultFolderIcon} alt="Folder closed" width="16" height="16" />;
  };

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
  };

  // 打开文件
  const openFile = async (file: FileNode) => {
    try {
      setActiveFile(file.path);

      // 先显示加载状态
      updateEditorContent('// 正在加载文件内容...');

      // 从服务器获取文件内容
      const response = await axios.get(`${API_BASE_URL}/files/content`, {
        params: { path: file.path }
      });

      updateEditorContent(response.data.content);
    } catch (err) {
      console.error('打开文件失败:', err);
      updateEditorContent(`// 加载文件内容失败: ${file.path}\n// 错误: ${err}`);
    }
  };

  // 递归渲染文件树
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isDirectory = node.type === 'directory';
      const isExpanded = expandedFolders[node.path] || false;

      return (
        <div key={node.path} style={{ marginLeft: `${depth * 12}px` }}>
          <div
            className={`file-item ${activeFile === node.path ? 'active' : ''}`}
            onClick={() => isDirectory ? toggleFolder(node.path) : openFile(node)}
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
          {renderFileTree(files)}
        </div>
      )}

      {!isLoading && !error && files.length === 0 && (
        <div className="empty-directory" style={{ padding: '8px' }}>
          目录为空
        </div>
      )}
    </div>
  );
};

export default FileExplorer;