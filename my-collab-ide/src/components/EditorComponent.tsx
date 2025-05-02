import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import './EditorComponent.css';

import explorerIcon from '../icons/icons8-文件夹-40.png';  // 资源管理器图标
import searchIcon from '../icons/icons8-搜索-40.png';      // 搜索图标
import gitIcon from '../icons/icons8-代码叉-40.png';            // 用户管理
import debugIcon from '../icons/icons8-播放-40.png';        // 运行和调试图标
import extensionsIcon from '../icons/icons8-用户组-40.png'; // 代码社区
import settingsIcon from '../icons/icons8-设置-40.png';  // 设置图标

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
    const [activityBarWidth, setActivityBarWidth] = useState(50);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [panelHeight, setPanelHeight] = useState(200);

    // 引用DOM元素
    const activityBarRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const activityBarResizerRef = useRef<HTMLDivElement>(null);
    const sidebarResizerRef = useRef<HTMLDivElement>(null);
    const panelResizerRef = useRef<HTMLDivElement>(null);

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
    }, [isDraggingActivityBar, isDraggingSidebar, isDraggingPanel, activityBarWidth, sidebarWidth]);

    // 自动调整编辑器大小
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.layout();
        }
    }, [activityBarWidth, sidebarWidth, panelHeight]);

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
        return "resize-overlay";
    };

    return (
        <div className="ide-container">
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
                                        <div className="file" onClick={() => setActiveFile("Header.js")}>Header.js</div>
                                        <div className="file" onClick={() => setActiveFile("Sidebar.js")}>Sidebar.js</div>
                                        <div className="file" onClick={() => setActiveFile("Editor.js")}>Editor.js</div>
                                    </div>
                                </div>
                                <div className="file" onClick={() => setActiveFile("App.js")}>App.js</div>
                                <div className="file" onClick={() => setActiveFile("index.js")}>index.js</div>
                            </div>
                        </div>
                        <div className="folder">
                            <div className="folder-name"><span className="folder-icon">▸</span> public</div>
                        </div>
                        <div className="file" onClick={() => setActiveFile("package.json")}>package.json</div>
                        <div className="file" onClick={() => setActiveFile("README.md")}>README.md</div>
                        <div className="file" onClick={() => setActiveFile("style.css")}>style.css</div>
                    </div>
                </div>
                {/* 侧边栏调整大小控件 */}
                <div
                    className="sidebar-resizer"
                    ref={sidebarResizerRef}
                    onMouseDown={handleSidebarMouseDown}
                ></div>
            </div>

            {/* 主体区域 */}
            <div className="main-content">
                {/* 编辑器区域 */}
                <div className="editor-area" style={{ height: `calc(100% - ${panelHeight}px)` }}>
                    <div className="editor-tabs">
                        <div className={`editor-tab ${activeFile === 'App.js' ? 'active' : ''}`}
                            onClick={() => setActiveFile("App.js")}>App.js</div>
                        <div className={`editor-tab ${activeFile === 'style.css' ? 'active' : ''}`}
                            onClick={() => setActiveFile("style.css")}>style.css</div>
                    </div>
                    <div className="editor-content">
                        {/* Monaco Editor 替代这里的代码区域 */}
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
                                fontFamily: 'Consolas, "Courier New", monospace',
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
            </div>

            {/* 状态栏 */}
            <div className="status-bar">
                <div className="status-items-left">
                    <span className="status-item">⑂ main</span>
                    <span className="status-item">✓ 0 ⚠︎ 0 ✖ 0</span>
                </div>
                <div className="status-items-right">
                    <span className="status-item">UTF-8</span>
                    <span className="status-item">LF</span>
                    <span className="status-item">{ } {defaultLanguage}</span>
                    <span className="status-item">Ln 1, Col 1</span>
                </div>
            </div>

            {/* 指示器显示当前正在拖动的覆盖层 */}
            {(isDraggingSidebar || isDraggingPanel || isDraggingActivityBar) && (
                <div className={getOverlayClassName()}></div>
            )}
        </div>
    );
};

export default EditorComponent;