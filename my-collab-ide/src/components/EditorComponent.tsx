import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import './EditorComponent.css';
import AIChatPanel from './AIChatPanel'; // 导入新的 AI 聊天组件
import InviteCollaborator from './InviteCollaborator';
import FileExplorer from './FileExplorer';


// 模拟图标导入
import explorerIcon from '../icons/icons8-文件夹-40.png';
import searchIcon from '../icons/icons8-搜索-40.png';
import gitIcon from '../icons/icons8-代码叉-40.png';
import debugIcon from '../icons/icons8-播放-40.png';
import extensionsIcon from '../icons/icons8-用户组-40.png';
import settingsIcon from '../icons/icons8-设置-40.png';

interface EditorComponentProps {
    defaultLanguage?: string;
    defaultValue?: string;
    height?: string | number;
    width?: string | number;
    theme?: string;
    onChange?: (value: string | undefined) => void;
}

const EditorComponent: React.FC<EditorComponentProps> = ({
    defaultLanguage = 'javascript',
    defaultValue = '// 在这里开始编写代码\n',
    height = '500px',
    width = '100%',
    theme = 'vs',
    onChange
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [value, setValue] = useState<string | undefined>(defaultValue);
    const [activeFile, setActiveFile] = useState("App.js");
    const [activePanelTab, setActivePanelTab] = useState("终端");
    // <FileExplorer activeFile={activeFile} setActiveFile={setActiveFile} />


    // 拖动状态
    const [isDraggingActivityBar, setIsDraggingActivityBar] = useState(false);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);
    const [activityBarWidth, setActivityBarWidth] = useState(50);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [panelHeight, setPanelHeight] = useState(200);
    const [aiPanelWidth, setAiPanelWidth] = useState(320); // 保留AI面板宽度状态

    // 引用DOM元素
    const activityBarRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const activityBarResizerRef = useRef<HTMLDivElement>(null);
    const sidebarResizerRef = useRef<HTMLDivElement>(null);
    const panelResizerRef = useRef<HTMLDivElement>(null);

    // 模拟文件结构数据
    // const fileStructure = {
    //     src: {
    //         components: {
    //             "Header.js": "// Header.js 内容",
    //             "Sidebar.js": "// Sidebar.js 内容",
    //             "Editor.js": "// Editor.js 内容",
    //         },
    //         "App.js": defaultValue,
    //         "index.js": "// index.js 内容"
    //     },
    //     public: {},
    //     "package.json": "// package.json 内容",
    //     "README.md": "# 项目说明",
    //     "style.css": "/* CSS 样式 */"
    // };

    //  // 文件图标辅助函数
    //  const getFileIcon = (filename: string) => {
    //     const ext = filename.split('.').pop()?.toLowerCase();
    //     if (ext === 'js') return '📄';
    //     if (ext === 'css') return '📄';
    //     if (ext === 'json') return '�';
    //     if (ext === 'md') return '�';
    //     return '📄';
    // };

    // // 渲染文件夹内容
    // const renderFolder = (folder: any, path: string = '') => {
    //     return Object.entries(folder).map(([name, content]) => {
    //         const fullPath = path ? `${path}/${name}` : name;

    //         if (typeof content === 'object') {
    //             // 这是一个文件夹
    //             return (
    //                 <div key={fullPath} className="folder">
    //                     <div className="folder-name">
    //                         <span className="folder-icon">📁</span> {name}
    //                     </div>
    //                     <div className="folder-content">
    //                         {renderFolder(content, fullPath)}
    //                     </div>
    //                 </div>
    //             );
    //         } else {
    //             // 这是一个文件
    //             return (
    //                 <div
    //                     key={fullPath}
    //                     className={`file ${activeFile === name ? 'active' : ''}`}
    //                     onClick={() => setActiveFile(name)}
    //                 >
    //                     <span className="file-icon">{getFileIcon(name)}</span> {name}
    //                 </div>
    //             );
    //         }
    //     });
    // };

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleEditorChange = (value: string | undefined) => {
        setValue(value);
        if (onChange) {
            onChange(value);
        }
    };

    // 活动栏拖动处理函数
    const handleActivityBarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingActivityBar(true);
    };

    // 侧边栏拖动处理函数
    const handleSidebarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSidebar(true);
    };

    // 面板拖动处理函数
    const handlePanelMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingPanel(true);
    };

    // 处理AI面板宽度变化
    const handleAIPanelResize = (newWidth: number) => {
        setAiPanelWidth(newWidth);
    };

    // 处理鼠标移动事件
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingActivityBar) {
                const newWidth = Math.max(50, Math.min(150, e.clientX));
                setActivityBarWidth(newWidth);
            } else if (isDraggingSidebar) {
                const newWidth = Math.max(200, Math.min(500, e.clientX - activityBarWidth));
                setSidebarWidth(newWidth);
            } else if (isDraggingPanel) {
                const container = document.querySelector('.editor-and-panel-container');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const newHeight = Math.max(100, Math.min(400, containerRect.bottom - e.clientY));
                    setPanelHeight(newHeight);
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingActivityBar(false);
            setIsDraggingSidebar(false);
            setIsDraggingPanel(false);
        };

        // 任何拖动状态都添加事件监听
        if (isDraggingActivityBar || isDraggingSidebar || isDraggingPanel) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [
        isDraggingActivityBar,
        isDraggingSidebar,
        isDraggingPanel,
        activityBarWidth,
        sidebarWidth
    ]);

    // 自动调整编辑器大小
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.layout();
        }
    }, [activityBarWidth, sidebarWidth, panelHeight, aiPanelWidth]);

    // 生成行号
    const generateLineNumbers = () => {
        if (!value) return [];
        const lines = value.split('\n');
        return lines.map((_, index) => (
            <div key={index} className="line-number">{index + 1}</div>
        ));
    };

    // 确定拖动时遮罩层的样式
    const getOverlayClassName = () => {
        if (isDraggingActivityBar) return "resize-overlay dragging-activity-bar";
        if (isDraggingSidebar) return "resize-overlay dragging-sidebar";
        if (isDraggingPanel) return "resize-overlay dragging-panel";
        return "resize-overlay";
    };



    // 左边的活动栏和侧边栏的切换逻辑
    const [activeTab, setActiveTab] = useState('explorer')

    const handleClick = (tabName: string) => {
        setActiveTab(tabName)
    }

    const [showSettingsMenu, setShowSettingsMenu] = useState(false)
    const settingsRef = useRef<HTMLDivElement>(null)

    const toggleSettingsMenu = () => {
        setShowSettingsMenu(prev => !prev)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="ide-container">
            <div className="ide-main-layout">
                {/* 活动栏 */}
                <div
                    className="activity-bar"
                    ref={activityBarRef}
                    style={{ width: `${activityBarWidth}px` }}
                >
                    <div
                        className={`activity-icon ${activeTab === 'explorer' ? 'active' : ''}`}
                        onClick={() => handleClick('explorer')}
                    >
                        <img src={explorerIcon} alt="Explorer" />
                    </div>
                    <div
                        className={`activity-icon ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => handleClick('search')}
                    >
                        <img src={searchIcon} alt="Search" />
                    </div>
                    <div
                        className={`activity-icon ${activeTab === 'git' ? 'active' : ''}`}
                        onClick={() => handleClick('git')}
                    >
                        <img src={gitIcon} alt="Git" />
                    </div>
                    <div
                        className={`activity-icon ${activeTab === 'debug' ? 'active' : ''}`}
                        onClick={() => handleClick('debug')}
                    >
                        <img src={debugIcon} alt="Debug" />
                    </div>
                    <div
                        className={`activity-icon ${activeTab === 'extensions' ? 'active' : ''}`}
                        onClick={() => handleClick('extensions')}
                    >
                        <a href="https://yaonikaixin999999.xyz" target="_blank" rel="noopener noreferrer">
                            <img src={extensionsIcon} alt="Extensions" />
                        </a>
                    </div>
                    <div className="spacer"></div>
                    <div
                        className="activity-icon"
                        onClick={toggleSettingsMenu}
                        ref={settingsRef}
                    // style={{ position: 'relative' }}
                    >
                        <img src={settingsIcon} alt="Settings" />
                    </div>
                    {showSettingsMenu && settingsRef.current && (
                        <div
                            className="settings-menu"
                            style={{
                                position: 'absolute',
                                left: settingsRef.current.getBoundingClientRect().right + 8 + 'px',
                                top: settingsRef.current.getBoundingClientRect().top - 280 + 'px',
                                width: '220px',
                                backgroundColor: 'var(--surface-lightest)',
                                color: 'var(--text-dark)',
                                borderRadius: '6px',
                                boxShadow: 'var(--shadow-md)',                   // 使用你定义的中等阴影
                                border: '1px solid var(--border-light)',         // 加一圈浅灰边框
                                zIndex: 9999,
                                transition: 'var(--transition-default)'        // 添加过渡动画
                            }}
                        >
                            {[
                                '配置文件（默认）',
                                '设置',
                                '扩展',
                                '键盘快捷方式',
                                '代码片段',
                                '任务',
                                '主题',
                                '备份和同步设置',
                                '下载更新(1)',
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* 活动栏拖动控件 */}
                    <div
                        className="activity-bar-resizer"
                        ref={activityBarResizerRef}
                        onMouseDown={handleActivityBarMouseDown}
                    ></div>
                </div>

                {/* 侧边栏 */}
                <div
                    className="sidebar"
                    ref={sidebarRef}
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div className="sidebar-header">
                        <span>EXPLORER</span>
                        <div className="sidebar-actions">
                            <span>...</span>
                        </div>
                    </div>
                    <div className="sidebar-content">
                        {activeTab === 'explorer' && (
                            <div className="file-explorer">
                                <FileExplorer activeFile={activeFile} setActiveFile={setActiveFile} />
                            </div>
                        )}
                        {activeTab === 'search' && (
                            <div className="search-panel">🔍 搜索功能面板</div>
                        )}
                        {activeTab === 'git' && (
                            <div className="p-4">
                                <InviteCollaborator />
                                {/* todo */}
                            </div>
                        )}
                        {activeTab === 'debug' && (
                            <div className="debug-panel">🐞 调试功能面板</div>
                        )}
                        {activeTab === 'extensions' && (
                            <div className="extensions-panel">🧩 扩展功能面板</div>
                        )}
                    </div>
                    {/* 侧边栏拖动控件 */}
                    <div
                        className="sidebar-resizer"
                        ref={sidebarResizerRef}
                        onMouseDown={handleSidebarMouseDown}
                    ></div>
                </div>

                {/* 主内容区 */}
                <div className="editor-and-panel-container">
                    {/* 编辑器区域 */}
                    <div className="main-content">
                        <div className="editor-area">
                            <div className="editor-tabs">
                                <div className="editor-tab active">
                                    {activeFile}
                                </div>
                            </div>
                            <div className="editor-content">
                                <Editor
                                    height="100%"
                                    defaultLanguage={defaultLanguage}
                                    defaultValue={defaultValue}
                                    theme={theme}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorDidMount}
                                    options={{
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        fontSize: 14,
                                        automaticLayout: true
                                    }}
                                />
                            </div>
                        </div>

                        {/* 面板区域 */}
                        <div
                            className="panel-area"
                            ref={panelRef}
                            style={{ height: `${panelHeight}px` }}
                        >
                            {/* 面板拖动控件 */}
                            <div
                                className="panel-resizer"
                                ref={panelResizerRef}
                                onMouseDown={handlePanelMouseDown}
                            ></div>
                            <div className="panel-tabs">
                                <div
                                    className={`panel-tab ${activePanelTab === '问题' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab('问题')}
                                >
                                    问题
                                </div>
                                <div
                                    className={`panel-tab ${activePanelTab === '输出' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab('输出')}
                                >
                                    输出
                                </div>
                                <div
                                    className={`panel-tab ${activePanelTab === '调试控制台' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab('调试控制台')}
                                >
                                    调试控制台
                                </div>
                                <div
                                    className={`panel-tab ${activePanelTab === '终端' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab('终端')}
                                >
                                    终端
                                </div>
                            </div>
                            <div className="panel-content">
                                {activePanelTab === '终端' && (
                                    <div className="terminal">
                                        <div className="terminal-line">$ npm start</div>
                                        <div className="terminal-line">Starting development server...</div>
                                        <div className="terminal-line">Compiled successfully!</div>
                                        <div className="terminal-line">
                                            You can now view my-app in the browser.
                                        </div>
                                        <div className="terminal-line">
                                            Local:            http://localhost:3000
                                        </div>
                                        <div className="terminal-line">
                                            On Your Network:  http://192.168.1.7:3000
                                        </div>
                                        <div className="terminal-line blink">$ </div>
                                    </div>
                                )}
                                {activePanelTab === '问题' && (
                                    <div className="problems-panel">
                                        <div>没有发现问题</div>
                                    </div>
                                )}
                                {activePanelTab === '输出' && (
                                    <div className="output-panel">
                                        <div>构建成功 - 0 警告, 0 错误</div>
                                    </div>
                                )}
                                {activePanelTab === '调试控制台' && (
                                    <div className="debug-console">
                                        <div>调试会话未启动</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 状态栏 */}
                    <div className="status-bar">
                        <div className="status-items-left">
                            <div className="status-item status-branch">
                                <span className="status-git-icon">⑂</span> main
                            </div>
                            <div className="status-item status-metrics">
                                <span className="error">0</span>
                                <span className="warning">0</span>
                            </div>
                        </div>
                        <div className="status-items-right">
                            <div className="status-item">UTF-8</div>
                            <div className="status-item">LF</div>
                            <div className="status-item">{defaultLanguage}</div>
                            <div className="status-item status-position">行 1, 列 1</div>
                        </div>
                    </div>
                </div>

                {/* 引入新的 AIChatPanel 组件 */}
                <AIChatPanel
                    width={aiPanelWidth}
                    onResize={handleAIPanelResize}
                />
            </div>

            {/* 指示器显示当前正在拖动的覆盖层 */}
            {(isDraggingSidebar || isDraggingPanel || isDraggingActivityBar) && (
                <div className={getOverlayClassName()}></div>
            )}
        </div>
    );
};

export default EditorComponent;