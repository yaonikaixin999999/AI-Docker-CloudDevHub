import React, { useState } from 'react'

// 示例文件结构
const fileStructure = {
  src: {
    components: {
      'Header.js': '// Header.js 内容',
      'Sidebar.js': '// Sidebar.js 内容',
      'Editor.js': '// Editor.js 内容',
    },
    'App.js': '// App.js 内容',
    'index.js': '// index.js 内容',
  },
  public: {},
  'package.json': '// package.json 内容',
  'README.md': '# 项目说明',
  'style.css': '/* CSS 样式 */',
}

// 获取文件图标（使用 emoji 或者你可替换为 icon 组件）
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'js') return '📜'
  if (ext === 'css') return '🎨'
  if (ext === 'json') return '🛠️'
  if (ext === 'md') return '📘'
  return '📄'
}

type FileExplorerProps = {
  activeFile: string | null
  setActiveFile: (file: string) => void
}

const FileExplorer: React.FC<FileExplorerProps> = ({ activeFile, setActiveFile }) => {
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({})

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  const renderFolder = (folder: any, path = '') => {
    return Object.entries(folder).map(([name, content]) => {
      const fullPath = path ? `${path}/${name}` : name

      if (typeof content === 'object') {
        const isOpen = expandedFolders[fullPath] ?? true

        return (
          <div key={fullPath} className="folder">
            <div
              className="folder-name flex items-center cursor-pointer px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm font-medium text-gray-800 dark:text-gray-100"
              onClick={() => toggleFolder(fullPath)}
            >
              <span className="mr-2">{isOpen ? '📂' : '📁'}</span>
              {name}
            </div>
            {isOpen && (
              <div className="ml-[level*8] pl-2 border-l border-gray-300 dark:border-gray-600">
                {renderFolder(content, fullPath)}
             </div>
            )}
          </div>
        )
      } else {
        return (
          <div
            key={fullPath}
            className={`file flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
              activeFile === fullPath
                ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
            onClick={() => setActiveFile(fullPath)}
          >
            <span className="mr-2">{getFileIcon(name)}</span>
            {name}
          </div>
        )
      }
    })
  }

  return (
    <div className="file-explorer text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 h-full overflow-auto">
      {renderFolder(fileStructure)}
    </div>
  )
}

export default FileExplorer
