import React, { useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import './EditorComponent.css'; // 我们将创建一个单独的CSS文件

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
    theme = 'vs-dark',
    onChange
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [value, setValue] = useState<string | undefined>(defaultValue);
    const [activeFile, setActiveFile] = useState("App.js");

    const [activePanelTab, setActivePanelTab] = useState("终端");

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

    // 生成行号
    const generateLineNumbers = () => {
        if (!value) return null;
        const lines = value.split('\n');
        return lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
        ));
    };

    return (
        <div className="ide-container">
            {/* 活动栏 */}
            <div className="activity-bar">
                <div className="activity-icon active" title="资源管理器">📁</div>
                <div className="activity-icon" title="搜索">🔍</div>
                <div className="activity-icon" title="源代码管理">⑂</div>
                <div className="activity-icon" title="运行和调试">▶</div>
                <div className="activity-icon" title="扩展">🧩</div>
                <div className="spacer"></div>
                <div className="activity-icon" title="设置">⚙️</div>
            </div>

            {/* 侧边栏 */}
            <div className="sidebar">
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
            </div>

            {/* 主体区域 */}
            <div className="main-content">
                {/* 编辑器区域 */}
                <div className="editor-area">
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
                            }}
                        />
                    </div>
                </div>

                {/* 面板区域 */}
                <div className="panel-area">
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
                    <div className="panel-resizer"></div>
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
        </div>
    );
};

export default EditorComponent;