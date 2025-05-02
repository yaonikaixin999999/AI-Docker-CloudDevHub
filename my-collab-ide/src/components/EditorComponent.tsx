import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import './EditorComponent.css';

import explorerIcon from '../icons/icons8-文件夹-40.png';
import searchIcon from '../icons/icons8-搜索-40.png';
import gitIcon from '../icons/icons8-代码叉-40.png';
import debugIcon from '../icons/icons8-播放-40.png';
import extensionsIcon from '../icons/icons8-用户组-40.png';
import settingsIcon from '../icons/icons8-设置-40.png';
import copilotIcon from '../icons/icons8-windows副驾驶-240.png';

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

    // 拖动状态
    const [isDraggingActivityBar, setIsDraggingActivityBar] = useState(false);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);
    const [isDraggingAIPanel, setIsDraggingAIPanel] = useState(false); // 新增: AI面板拖动状态
    const [activityBarWidth, setActivityBarWidth] = useState(50);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [panelHeight, setPanelHeight] = useState(200);
    const [aiPanelWidth, setAiPanelWidth] = useState(320); // 新增: AI面板宽度状态

    // 引用DOM元素
    const activityBarRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const aiPanelRef = useRef<HTMLDivElement>(null); // 新增: AI面板元素引用
    const activityBarResizerRef = useRef<HTMLDivElement>(null);
    const sidebarResizerRef = useRef<HTMLDivElement>(null);
    const panelResizerRef = useRef<HTMLDivElement>(null);
    const aiPanelResizerRef = useRef<HTMLDivElement>(null); // 新增: AI面板拖动控件引用

    // 模拟文件结构数据
    const fileStructure = {
        src: {
            components: {
                "Header.js": "// Header.js 内容",
                "Sidebar.js": "// Sidebar.js 内容",
                "Editor.js": "// Editor.js 内容",
            },
            "App.js": defaultValue,
            "index.js": "// index.js 内容"
        },
        public: {},
        "package.json": "// package.json 内容",
        "README.md": "# 项目说明",
        "style.css": "/* CSS 样式 */"
    };

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

    // 新增: AI面板拖动处理函数
    const handleAIPanelMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingAIPanel(true);
    };

    // 处理鼠标移动事件
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // 活动栏宽度调整
            if (isDraggingActivityBar) {
                const newWidth = Math.max(40, Math.min(100, e.clientX));
                setActivityBarWidth(newWidth);
            }

            // 侧边栏宽度调整
            if (isDraggingSidebar) {
                const totalSidebarWidth = activityBarWidth + sidebarWidth;
                const newWidth = Math.max(150, Math.min(500, e.clientX - activityBarWidth));
                setSidebarWidth(newWidth);
            }

            // 面板高度调整
            if (isDraggingPanel) {
                const container = document.querySelector('.main-content');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const newHeight = Math.max(
                        100,
                        Math.min(
                            containerRect.height * 0.7,
                            containerRect.height - (e.clientY - containerRect.top)
                        )
                    );
                    setPanelHeight(newHeight);
                }
            }

            // 新增: AI面板宽度调整
            if (isDraggingAIPanel) {
                const container = document.querySelector('.ide-container');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    // 计算新宽度 (注意: 从右向左拖动，所以窗口宽度减去鼠标位置)
                    const newWidth = Math.max(
                        250,  // 最小宽度
                        Math.min(
                            500,  // 最大宽度
                            containerRect.right - e.clientX
                        )
                    );
                    setAiPanelWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingActivityBar(false);
            setIsDraggingSidebar(false);
            setIsDraggingPanel(false);
            setIsDraggingAIPanel(false); // 新增: 清除AI面板拖动状态
        };

        // 任何拖动状态都添加事件监听
        if (isDraggingActivityBar || isDraggingSidebar || isDraggingPanel || isDraggingAIPanel) {
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
        isDraggingAIPanel, // 新增: AI面板拖动状态依赖
        activityBarWidth,
        sidebarWidth
    ]);

    // 自动调整编辑器大小
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.layout();
        }
    }, [activityBarWidth, sidebarWidth, panelHeight, aiPanelWidth]); // 添加aiPanelWidth作为依赖

    // 生成行号
    const generateLineNumbers = () => {
        if (!value) return null;
        const lines = value.split('\n');
        return lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
        ));
    };

    // 确定拖动时遮罩层的样式
    const getOverlayClassName = () => {
        if (isDraggingActivityBar) return "resize-overlay dragging-activity-bar";
        if (isDraggingSidebar) return "resize-overlay dragging-sidebar";
        if (isDraggingPanel) return "resize-overlay dragging-panel";
        if (isDraggingAIPanel) return "resize-overlay dragging-ai-panel"; // 新增: AI面板拖动类名
        return "resize-overlay";
    };

    // 文件图标辅助函数
    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'js') return '📄';
        if (ext === 'css') return '🎨';
        if (ext === 'json') return '📋';
        if (ext === 'md') return '📝';
        return '📄';
    };

    return (
        <div className="ide-container">
            <div className="ide-main-layout">
                {/* 活动栏 */}
                <div
                    className="activity-bar"
                    ref={activityBarRef}
                    style={{ width: `${activityBarWidth}px` }}
                >
                    <div className="activity-icon active" title="资源管理器">
                        <img src={explorerIcon} alt="资源管理器" />
                    </div>
                    <div className="activity-icon" title="搜索">
                        <img src={searchIcon} alt="搜索" />
                    </div>
                    <div className="activity-icon" title="用户管理">
                        <img src={gitIcon} alt="用户管理" />
                    </div>
                    <div className="activity-icon" title="运行和调试">
                        <img src={debugIcon} alt="运行和调试" />
                    </div>
                    <div className="activity-icon" title="代码社区">
                        <img src={extensionsIcon} alt="代码社区" />
                    </div>
                    <div className="spacer"></div>
                    <div className="activity-icon" title="设置">
                        <img src={settingsIcon} alt="设置" />
                    </div>

                    {/* 活动栏调整大小控件 */}
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
                        <div>资源管理器</div>
                        <div className="sidebar-actions">
                            <span title="新建文件">+</span>
                            <span title="刷新">↻</span>
                            <span title="折叠所有">⊟</span>
                        </div>
                    </div>
                    <div className="sidebar-content">
                        <div className="file-explorer">
                            <div className="folder">
                                <div className="folder-name"><span className="folder-icon">▾</span> src</div>
                                <div className="folder-content">
                                    <div className="folder">
                                        <div className="folder-name"><span className="folder-icon">▾</span> components</div>
                                        <div className="folder-content">
                                            <div className="file" onClick={() => setActiveFile("Header.js")}>
                                                <span className="file-icon">{getFileIcon('Header.js')}</span> Header.js
                                            </div>
                                            <div className="file" onClick={() => setActiveFile("Sidebar.js")}>
                                                <span className="file-icon">{getFileIcon('Sidebar.js')}</span> Sidebar.js
                                            </div>
                                            <div className="file" onClick={() => setActiveFile("Editor.js")}>
                                                <span className="file-icon">{getFileIcon('Editor.js')}</span> Editor.js
                                            </div>
                                        </div>
                                    </div>
                                    <div className="file" onClick={() => setActiveFile("App.js")}>
                                        <span className="file-icon">{getFileIcon('App.js')}</span> App.js
                                    </div>
                                    <div className="file" onClick={() => setActiveFile("index.js")}>
                                        <span className="file-icon">{getFileIcon('index.js')}</span> index.js
                                    </div>
                                </div>
                            </div>
                            <div className="folder">
                                <div className="folder-name"><span className="folder-icon">▸</span> public</div>
                            </div>
                            <div className="file" onClick={() => setActiveFile("package.json")}>
                                <span className="file-icon">{getFileIcon('package.json')}</span> package.json
                            </div>
                            <div className="file" onClick={() => setActiveFile("README.md")}>
                                <span className="file-icon">{getFileIcon('README.md')}</span> README.md
                            </div>
                            <div className="file" onClick={() => setActiveFile("style.css")}>
                                <span className="file-icon">{getFileIcon('style.css')}</span> style.css
                            </div>
                        </div>
                    </div>
                    {/* 侧边栏调整大小控件 */}
                    <div
                        className="sidebar-resizer"
                        ref={sidebarResizerRef}
                        onMouseDown={handleSidebarMouseDown}
                    ></div>
                </div>

                {/* 主体区域和编辑器部分 */}
                <div className="editor-and-panel-container">
                    <div className="main-content">
                        {/* 编辑器区域 */}
                        <div className="editor-area" style={{ height: `calc(100% - ${panelHeight}px)` }}>
                            <div className="editor-tabs">
                                <div className={`editor-tab ${activeFile === 'App.js' ? 'active' : ''}`}
                                    onClick={() => setActiveFile("App.js")}>
                                    <span className="file-icon">{getFileIcon('App.js')}</span> App.js
                                </div>
                                <div className={`editor-tab ${activeFile === 'style.css' ? 'active' : ''}`}
                                    onClick={() => setActiveFile("style.css")}>
                                    <span className="file-icon">{getFileIcon('style.css')}</span> style.css
                                </div>
                            </div>
                            <div className="editor-content">
                                {/* Monaco Editor */}
                                <Editor
                                    height="100%"
                                    width="100%"
                                    defaultLanguage={defaultLanguage}
                                    defaultValue={defaultValue}
                                    value={value}
                                    theme={theme}
                                    onMount={handleEditorDidMount}
                                    onChange={handleEditorChange}
                                    options={{
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        fontSize: 14,
                                        wordWrap: 'on',
                                        automaticLayout: true,
                                        lineNumbers: 'on',
                                        roundedSelection: true,
                                        renderLineHighlight: 'gutter',
                                        fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
                                        fontLigatures: true,
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
                            {/* 面板调整大小控件 */}
                            <div
                                className="panel-resizer"
                                ref={panelResizerRef}
                                onMouseDown={handlePanelMouseDown}
                            ></div>
                            <div className="panel-tabs">
                                <div className={`panel-tab ${activePanelTab === '终端' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab("终端")}>终端</div>
                                <div className={`panel-tab ${activePanelTab === '问题' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab("问题")}>问题</div>
                                <div className={`panel-tab ${activePanelTab === '输出' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab("输出")}>输出</div>
                                <div className={`panel-tab ${activePanelTab === '调试控制台' ? 'active' : ''}`}
                                    onClick={() => setActivePanelTab("调试控制台")}>调试控制台</div>
                            </div>
                            <div className="panel-content">
                                <div className="terminal">
                                    <div className="terminal-line">$ npm start</div>
                                    <div className="terminal-line">启动开发服务器...</div>
                                    <div className="terminal-line">编译完成，无错误。</div>
                                    <div className="terminal-line">应用运行在 http://localhost:3000</div>
                                    <div className="terminal-line blink">$</div>
                                </div>
                            </div>
                        </div>

                        {/* 状态栏 */}
                        <div className="status-bar">
                            <div className="status-items-left">
                                <span className="status-item status-branch">
                                    <span className="status-icon">
                                        <img src={gitIcon} alt="分支" className="status-git-icon" />
                                    </span> main
                                </span>
                                <span className="status-item status-metrics">
                                    <span className="warning">
                                        <span role="img" aria-label="warning">⚠️</span> 0
                                    </span>
                                    <span className="error">
                                        <span role="img" aria-label="error">❌</span> 0
                                    </span>
                                </span>
                            </div>
                            <div className="status-items-right">
                                <span className="status-item">UTF-8</span>
                                <span className="status-item">LF</span>
                                <span className="status-item">{ } {defaultLanguage}</span>
                                <span className="status-item status-position">Ln 1, Col 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI助手面板 - 位于右侧 */}
                <div
                    className="ai-copilot-panel"
                    ref={aiPanelRef}
                    style={{ width: `${aiPanelWidth}px` }}
                >
                    {/* 新增: AI面板拖动控件 */}
                    <div
                        className="ai-panel-resizer"
                        ref={aiPanelResizerRef}
                        onMouseDown={handleAIPanelMouseDown}
                        title="拖动调整AI面板宽度"
                    ></div>

                    <div className="ai-copilot-header">
                        <div className="ai-copilot-title">
                            <div className="ai-copilot-icon">
                                <img src={copilotIcon} alt="Ask Copilot" className="ai-copilot-logo-img" />
                            </div>
                            <span>Ask Copilot</span>
                        </div>
                    </div>

                    <div className="ai-copilot-content">
                        <div className="ai-copilot-info">
                            <div className="ai-copilot-logo">
                                <img src={copilotIcon} alt="Ask Copilot" className="ai-copilot-main-logo" />
                            </div>
                            <h2>AI编程助手随时为您提供支持</h2>
                            <p>请在使用前仔细检查输出内容</p>
                        </div>

                        <div className="ai-copilot-actions">
                            <button className="ai-copilot-action">
                                <span className="ai-action-icon">✏️</span>
                                <span>写入人工以附加上下文</span>
                            </button>
                            <button className="ai-copilot-action">
                                <span className="ai-action-icon">💬</span>
                                <span>与IP直接对文</span>
                            </button>
                        </div>

                        <div className="ai-copilot-input">
                            <div className="ai-input-container">
                                <span className="ai-input-placeholder">输入/以使用聊天</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 指示器显示当前正在拖动的覆盖层 */}
            {(isDraggingSidebar || isDraggingPanel || isDraggingActivityBar || isDraggingAIPanel) && (
                <div className={getOverlayClassName()}></div>
            )}
        </div>
    );
};

export default EditorComponent;