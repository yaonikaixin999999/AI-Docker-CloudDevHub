import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import path from 'path-browserify';
import './EditorComponent.css';
import AIChatPanel from './AIChatPanel'; // 导入新的 AI 聊天组件
import InviteCollaborator from './InviteCollaborator';
import FileExplorer from './FileExplorer';
import RunAndDebug from './RunAndDebug';
import Search from './Search'
import axios from 'axios';

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
    // height = '500px',
    // width = '100%',
    theme = 'vs',
    onChange
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [editorContent, setEditorContent] = useState<string>(defaultValue);
    const [editorLanguage, setEditorLanguage] = useState<string>(defaultLanguage);
    const [activeFile, setActiveFile] = useState<string>(""); // 当前活动文件路径
    const [activePanelTab, setActivePanelTab] = useState("终端");

    // 拖动状态
    const [isDraggingActivityBar, setIsDraggingActivityBar] = useState(false);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);
    const [activityBarWidth, setActivityBarWidth] = useState(50);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [panelHeight, setPanelHeight] = useState(200);
    const [aiPanelWidth, setAiPanelWidth] = useState(320); // 保留AI面板宽度状态

    // 终端状态
    const [terminalOutput, setTerminalOutput] = useState<string[]>([
        "$ ssh root@8.137.125.47",
        "已连接到远程服务器",
        "正在访问 /data/My_Desktop/User_Coding",
        "可开始编辑远程文件"
    ]);
    const [terminalCommand, setTerminalCommand] = useState('');
    const terminalRef = useRef<HTMLDivElement>(null);

    // 引用DOM元素
    const activityBarRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const activityBarResizerRef = useRef<HTMLDivElement>(null);
    const sidebarResizerRef = useRef<HTMLDivElement>(null);
    const panelResizerRef = useRef<HTMLDivElement>(null);

    // API基础URL
    const API_BASE_URL = 'http://localhost:3001/api';

    const saveFile = async () => {
        if (!activeFile) {
            alert('没有打开的文件');
            return;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/files/save?path=${encodeURIComponent(activeFile)}`,
                editorContent,
                {
                    headers: { 'Content-Type': 'text/plain' }
                }
            );

            // 显示保存成功消息
            setTerminalOutput(prev => [...prev, `已保存文件: ${activeFile}`]);
        } catch (error) {
            console.error('保存文件失败:', error);
            setTerminalOutput(prev => [...prev, `保存失败: ${activeFile}, 错误: ${error}`]);
        }
    };

    // 执行命令函数
    const executeCommand = async (command: string) => {
        if (!command.trim()) return;

        setTerminalOutput(prev => [...prev, `$ ${command}`]);
        setTerminalCommand('');

        try {
            // 在实际环境中，通过API执行命令
            const response = await axios.post(`${API_BASE_URL}/files/execute`, {
                command,
                cwd: activeFile ? path.dirname(activeFile) : undefined
            });

            const { stdout, stderr, code } = response.data;

            if (stdout) {
                setTerminalOutput(prev => [...prev, ...stdout.split('\n').filter(Boolean)]);
            }

            if (stderr) {
                setTerminalOutput(prev => [...prev, ...stderr.split('\n').filter(Boolean)]);
            }

            setTerminalOutput(prev => [...prev, `命令执行完成，退出代码: ${code}`]);
        } catch (error) {
            console.error('执行命令失败:', error);
            setTerminalOutput(prev => [...prev, `错误: 执行命令失败`]);
        }

        // 滚动终端到底部
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    };

    // 编译当前文件
    const compileCurrentFile = async () => {
        if (!activeFile) {
            setTerminalOutput(prev => [...prev, "错误: 没有打开的文件"]);
            return;
        }

        const fileName = activeFile.split('/').pop() || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        const outputName = fileName.replace(`.${ext}`, '');

        let command = '';
        switch (ext) {
            case 'c':
                command = `gcc "${fileName}" -o "${outputName}" && echo "编译成功: ${outputName}"`;
                break;
            case 'cpp':
            case 'cc':
            case 'cxx':
                command = `g++ "${fileName}" -o "${outputName}" && echo "编译成功: ${outputName}"`;
                break;
            case 'java':
                command = `javac "${fileName}" && echo "编译成功: ${outputName}.class"`;
                break;
            case 'py':
                command = `python3 -m py_compile "${fileName}" && echo "Python文件无需编译，可直接运行"`;
                break;
            default:
                setTerminalOutput(prev => [...prev, `不支持编译此类型的文件: ${ext}`]);
                return;
        }

        setActivePanelTab('终端');
        await executeCommand(command);
    };

    // 运行当前文件
    const runCurrentFile = async () => {
        if (!activeFile) {
            setTerminalOutput(prev => [...prev, "错误: 没有打开的文件"]);
            return;
        }

        const fileName = activeFile.split('/').pop() || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        const outputName = fileName.replace(`.${ext}`, '');

        let command = '';
        switch (ext) {
            case 'c':
            case 'cpp':
            case 'cc':
            case 'cxx':
                command = `./${outputName}`;
                break;
            case 'java':
                command = `java ${outputName}`;
                break;
            case 'py':
                command = `python3 "${fileName}"`;
                break;
            case 'js':
                command = `node "${fileName}"`;
                break;
            case 'sh':
                command = `bash "${fileName}"`;
                break;
            default:
                setTerminalOutput(prev => [...prev, `不支持运行此类型的文件: ${ext}`]);
                return;
        }

        setActivePanelTab('终端');
        await executeCommand(command);
    };

    // 添加键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S 或 Cmd+S (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
            }
            // F5 运行
            if (e.key === 'F5') {
                e.preventDefault();
                runCurrentFile();
            }
            // F6 编译
            if (e.key === 'F6') {
                e.preventDefault();
                compileCurrentFile();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeFile, editorContent]); // 确保依赖项正确

    // 设置编辑器语言
    const getLanguageFromFileName = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'tsx': return 'typescript';
            case 'jsx': return 'javascript';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'py': return 'python';
            case 'java': return 'java';
            case 'c': return 'c';
            case 'cpp':
            case 'cc':
            case 'cxx': return 'cpp';
            case 'h': return 'c';
            case 'hpp': return 'cpp';
            case 'md': return 'markdown';
            case 'json': return 'json';
            case 'txt': return 'plaintext';
            case 'sh': return 'shell';
            case 'xml': return 'xml';
            case 'sql': return 'sql';
            case 'go': return 'go';
            case 'rb': return 'ruby';
            case 'php': return 'php';
            default: return 'plaintext';
        }
    };

    // 更新编辑器内容
    const updateEditorContent = (content: string) => {
        setEditorContent(content);
        if (editorRef.current) {
            editorRef.current.setValue(content);
        }
    };

    // 当活动文件变化时，更新编辑器语言
    useEffect(() => {
        if (activeFile) {
            const lang = getLanguageFromFileName(activeFile);
            setEditorLanguage(lang);
            setTerminalOutput(prev => [...prev, `打开文件: ${activeFile}`]);
        }
    }, [activeFile]);

    // 自动滚动终端到底部
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalOutput]);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleEditorChange = (value: string | undefined) => {
        setEditorContent(value || '');
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
                                boxShadow: 'var(--shadow-md)',
                                border: '1px solid var(--border-light)',
                                zIndex: 9999,
                                transition: 'var(--transition-default)'
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
                        <span>EXPLORER - 远程服务器</span>
                        <div className="sidebar-actions">
                            <span>...</span>
                        </div>
                    </div>
                    <div className="sidebar-content">
                        {activeTab === 'explorer' && (
                            <div className="file-explorer">
                                <FileExplorer
                                    activeFile={activeFile}
                                    setActiveFile={setActiveFile}
                                    updateEditorContent={updateEditorContent}
                                />
                            </div>
                        )}
                        {activeTab === 'search' && (
                            <div className="search-panel">
                                <Search />
                            </div>
                        )}
                        {activeTab === 'git' && (
                            <div className="p-4">
                                <InviteCollaborator />
                            </div>
                        )}
                        {activeTab === 'debug' && (
                            <div className="debug-panel">
                                <RunAndDebug />
                            </div>
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
                                    {activeFile ? activeFile.split('/').pop() : "未打开文件"}
                                </div>
                                {activeFile && (
                                    <div className="editor-actions" style={{ display: 'flex', marginLeft: 'auto' }}>
                                        <div
                                            className="editor-action-button"
                                            onClick={saveFile}
                                            title="保存 (Ctrl+S)"
                                            style={{
                                                padding: '0 10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'var(--primary-blue)'
                                            }}
                                        >
                                            💾 保存
                                        </div>
                                        <div
                                            className="editor-action-button"
                                            onClick={compileCurrentFile}
                                            title="编译 (F6)"
                                            style={{
                                                padding: '0 10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'var(--primary-blue)'
                                            }}
                                        >
                                            🔨 编译
                                        </div>
                                        <div
                                            className="editor-action-button"
                                            onClick={runCurrentFile}
                                            title="运行 (F5)"
                                            style={{
                                                padding: '0 10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'var(--primary-blue)'
                                            }}
                                        >
                                            ▶️ 运行
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="editor-content">
                                <Editor
                                    height="100%"
                                    language={editorLanguage}
                                    value={editorContent}
                                    theme={theme}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorDidMount}
                                    options={{
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        fontSize: 14,
                                        automaticLayout: true,
                                        lineNumbers: 'on',
                                        folding: true,
                                        renderLineHighlight: 'all',
                                        tabSize: 4,
                                        insertSpaces: true
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
                                    <div className="terminal" ref={terminalRef} style={{ height: '100%', overflow: 'auto' }}>
                                        {terminalOutput.map((line, index) => (
                                            <div key={index} className="terminal-line">
                                                {line}
                                            </div>
                                        ))}
                                        <div className="terminal-input-line" style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>$ </span>
                                            <input
                                                type="text"
                                                value={terminalCommand}
                                                onChange={(e) => setTerminalCommand(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        executeCommand(terminalCommand);
                                                    }
                                                }}
                                                placeholder="输入命令..."
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'inherit',
                                                    fontFamily: 'inherit',
                                                    fontSize: 'inherit',
                                                    width: 'calc(100% - 20px)',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {activePanelTab === '问题' && (
                                    <div className="problems-panel">
                                        <div>没有发现问题</div>
                                    </div>
                                )}
                                {activePanelTab === '输出' && (
                                    <div className="output-panel">
                                        <div>已成功连接到远程服务器</div>
                                        <div>远程服务器: 8.137.125.47</div>
                                        <div>工作目录: /data/My_Desktop/User_Coding</div>
                                    </div>
                                )}
                                {activePanelTab === '调试控制台' && (
                                    <div className="debug-console">
                                        <div>调试会话未启动</div>
                                        <div>按 F5 运行当前文件</div>
                                        <div>按 F6 编译当前文件</div>
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
                            <div className="status-item">远程: 8.137.125.47</div>
                            <div className="status-item">UTF-8</div>
                            <div className="status-item">LF</div>
                            <div className="status-item">{editorLanguage}</div>
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