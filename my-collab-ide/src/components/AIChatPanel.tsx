import React, { useState, useEffect, useRef } from 'react';
import { Message, aiService } from '../services/aiService';
import { apiKeyService } from '../services/apiKeyService';
import './AIChatPanel.css';
import aiLogo from '../icons/icons8-windows副驾驶-240.png';

import settingsIcon from '../icons/icons8-设置-40.png';
import clearIcon from '../icons/icons8-创建新的-40.png';
import minimizeIcon from '../icons/icons8-最小化-40.png';
import expandIcon from '../icons/icons8-最大化-40.png';
import userAvatar from '../icons/user.jpg';
import sendIcon from '../icons/icons8-发送-40.png';
import openAiIcon from '../icons/icons8-聊天室-50.png';
import githubIcon from '../icons/icons8-github-240.png';

interface AIChatPanelProps {
    width: number;
    onResize: (width: number) => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ width, onResize }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(true); // 默认设置为true，因为我们使用本地模型不需要API key
    const [apiKey, setApiKey] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const aiPanelRef = useRef<HTMLDivElement>(null);
    const aiPanelResizerRef = useRef<HTMLDivElement>(null);
    const [isDraggingAIPanel, setIsDraggingAIPanel] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [useLocalModel, setUseLocalModel] = useState(true);
    const [localModelUrl, setLocalModelUrl] = useState('http://192.168.31.124:1234/v1');
    // 默认设置为第一个聊天模型
    const [modelName, setModelName] = useState('deepseek-r1-distill-qwen-14b');
    const [availableModels, setAvailableModels] = useState<string[]>([
        'deepseek-r1-distill-qwen-14b',
        'mimo-7b-rl-nomtp'
    ]);
    const [loadingModels, setLoadingModels] = useState(false);

    // 引入示例对话提示
    const conversationExamples = [
        "你能帮我解释一下React Hooks的工作原理吗？",
        "如何优化这段代码：function fib(n) { if(n <= 1) return n; return fib(n-1) + fib(n-2); }",
        "编写一个简单的Node.js Express服务器",
        "请帮我修复这段代码中的错误"
    ];

    // 初始化时检查本地模型设置
    useEffect(() => {
        // 设置默认使用本地模型
        localStorage.setItem('use_local_model', 'true');
        localStorage.setItem('local_model_url', 'http://192.168.31.124:1234/v1');

        // 应用设置到服务
        aiService.toggleModelSource(true);
        aiService.setLocalModelUrl('http://192.168.31.124:1234/v1');

        // 加载模型列表
        fetchAvailableModels('http://192.168.31.124:1234/v1');

        // 使用本地模型时直接设置hasApiKey为true，因为不需要API Key
        setHasApiKey(true);

        // 从localStorage读取本地模型设置
        const savedUseLocal = true; // 强制使用本地模型
        const savedLocalUrl = localStorage.getItem('local_model_url') || 'http://192.168.31.124:1234/v1';
        // 默认使用第一个聊天模型
        const savedModelName = localStorage.getItem('model_name') || 'deepseek-r1-distill-qwen-14b';

        setUseLocalModel(savedUseLocal);
        setLocalModelUrl(savedLocalUrl);
        setModelName(savedModelName);

        // 应用设置到服务
        aiService.toggleModelSource(savedUseLocal);
        aiService.setLocalModelUrl(savedLocalUrl);
        aiService.setModel(savedModelName);
    }, []);

    // 获取可用模型列表
    const fetchAvailableModels = async (url: string) => {
        try {
            setLoadingModels(true);
            setErrorMessage(null);

            // 临时设置URL以获取模型
            aiService.setLocalModelUrl(url);
            aiService.toggleModelSource(true);

            const models = await aiService.getAvailableModels();

            // 过滤出聊天模型，排除embedding模型
            const chatModels = models.filter(model => !model.includes('embed'));

            setAvailableModels(chatModels.length > 0 ? chatModels : ['deepseek-r1-distill-qwen-14b', 'mimo-7b-rl-nomtp']);

            if (chatModels.length > 0 && !chatModels.includes(modelName)) {
                // 如果当前选择的模型不在列表中，自动选择第一个
                setModelName(chatModels[0]);
                aiService.setModel(chatModels[0]);
                localStorage.setItem('model_name', chatModels[0]);
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            setErrorMessage('无法连接到本地模型服务器，请检查URL和服务器状态');
            // 使用已知的模型作为备选
            setAvailableModels(['deepseek-r1-distill-qwen-14b', 'mimo-7b-rl-nomtp']);
        } finally {
            setLoadingModels(false);
        }
    };

    // 处理模型配置变更
    const handleToggleLocalModel = (checked: boolean) => {
        setUseLocalModel(checked);
        aiService.toggleModelSource(checked);
        localStorage.setItem('use_local_model', checked.toString());

        // 如果切换到本地模型，尝试加载可用模型
        if (checked) {
            fetchAvailableModels(localModelUrl);
        }

        // 使用本地模型时不需要API Key
        setHasApiKey(checked);
    };

    const handleLocalUrlChange = (url: string) => {
        setLocalModelUrl(url);
        aiService.setLocalModelUrl(url);
        localStorage.setItem('local_model_url', url);
    };

    const handleTestLocalConnection = () => {
        fetchAvailableModels(localModelUrl);
    };

    const handleModelNameChange = (name: string) => {
        setModelName(name);
        aiService.setModel(name);
        localStorage.setItem('model_name', name);
    };

    // 处理消息自动滚动
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 自动调整输入框高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(100, textareaRef.current.scrollHeight)}px`;
        }
    }, [input]);

    // 处理面板拖动
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingAIPanel) {
                const container = document.querySelector('.ide-container');
                if (container && aiPanelRef.current) {
                    const containerRect = container.getBoundingClientRect();
                    const newWidth = Math.max(
                        250,  // 最小宽度
                        Math.min(
                            500,  // 最大宽度
                            containerRect.right - e.clientX
                        )
                    );
                    onResize(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingAIPanel(false);
        };

        if (isDraggingAIPanel) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingAIPanel, onResize]);

    const handleAIPanelMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingAIPanel(true);
    };

    // 发送消息前验证
    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        try {
            setErrorMessage(null);

            // 创建用户消息
            const userMessage: Message = {
                role: 'user',
                content: input,
                timestamp: Date.now()
            };

            // 更新消息列表
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setIsTyping(true);

            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }

            // 发送到 AI 服务
            const newMessages = [...messages, userMessage];
            const response = await aiService.sendMessage(newMessages);

            // 添加 AI 回复
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error('发送消息错误:', error);
            setErrorMessage(error instanceof Error ? error.message : '发送消息时出现错误');
        } finally {
            setIsTyping(false);
        }
    };

    // 在配置面板中添加本地模型设置
    const renderConfigPanel = () => {
        return (
            <div className="ai-key-config">
                <div className="ai-key-header">
                    <h3>AI 模型设置</h3>
                </div>

                {/* 优化后的模型来源切换 */}
                <div className="ai-config-item">
                    <label htmlFor="model-source" className="ai-config-label">模型来源</label>
                    <div className="ai-config-toggle">
                        <input
                            type="checkbox"
                            id="model-source"
                            checked={useLocalModel}
                            onChange={(e) => handleToggleLocalModel(e.target.checked)}
                        />
                        <label htmlFor="model-source" className="toggle-label">
                            <div className="toggle-label-text toggle-off">
                                <img src={openAiIcon} alt="OpenAI" className="toggle-icon" />
                                OpenAI API
                            </div>
                            <div className="toggle-label-text toggle-on">
                                <img src={githubIcon} alt="本地模型" className="toggle-icon" />
                                本地模型
                            </div>
                        </label>
                    </div>
                </div>


                {/* 本地模型URL配置 */}
                {useLocalModel && (
                    <div className="ai-config-item">
                        <label className="ai-config-label">本地模型URL</label>
                        <div className="ai-key-input-group">
                            <input
                                className="ai-key-input"
                                type="text"
                                value={localModelUrl}
                                onChange={(e) => handleLocalUrlChange(e.target.value)}
                                placeholder="例如: http://192.168.31.124:1234/v1"
                            />
                            <button
                                className="ai-key-test"
                                onClick={handleTestLocalConnection}
                                disabled={loadingModels}
                            >
                                {loadingModels ? "连接中..." : "测试连接"}
                            </button>
                        </div>
                        <p className="ai-key-note">
                            指向本地LMstudio API端点的URL
                        </p>
                    </div>
                )}

                {/* 模型名称 */}
                <div className="ai-config-item">
                    <label className="ai-config-label">选择模型</label>
                    <select
                        className="ai-key-input"
                        value={modelName}
                        onChange={(e) => handleModelNameChange(e.target.value)}
                    >
                        {useLocalModel ? (
                            availableModels.length > 0 ? (
                                availableModels.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))
                            ) : (
                                <>
                                    <option value="deepseek-r1-distill-qwen-14b">deepseek-r1-distill-qwen-14b</option>
                                    <option value="mimo-7b-rl-nomtp">mimo-7b-rl-nomtp</option>
                                </>
                            )
                        ) : (
                            <>
                                <option value="gpt-4">GPT-4.1</option>
                                <option value="gpt-4">GPT-4o</option>
                                <option value="gpt-4">GPT-o4-mini</option>
                                <option value="gpt-4">GPT-03-mini</option>
                            </>
                        )}
                    </select>
                    {useLocalModel && loadingModels && (
                        <p className="ai-key-note loading">正在加载可用模型...</p>
                    )}
                </div>

                {/* API Key配置（仅当使用OpenAI API时） */}
                {!useLocalModel && (
                    <>
                        <div className="ai-key-header" style={{ marginTop: '20px' }}>
                            <h3>API Key 设置</h3>
                            <p className="ai-key-info">请输入你的 OpenAI API Key</p>
                        </div>
                        <div className="ai-key-input-container">
                            <input
                                type="password"
                                className="ai-key-input"
                                placeholder="输入你的 API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button className="ai-key-submit" onClick={handleSaveApiKey}>
                                保存
                            </button>
                        </div>
                        <p className="ai-key-note">
                            API Key 将安全地存储在你的浏览器中，不会上传到任何服务器。
                        </p>
                    </>
                )}

                {errorMessage && (
                    <div className="ai-error-message">
                        <div className="error-icon">⚠️</div>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="ai-config-actions">
                    <button className="ai-config-save" onClick={() => setIsConfigOpen(false)}>
                        完成
                    </button>
                </div>
            </div>
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSaveApiKey = () => {
        try {
            if (!apiKey.trim()) {
                setErrorMessage('API Key 不能为空');
                return;
            }

            apiKeyService.saveApiKey(apiKey);
            aiService.setApiKey(apiKey);
            setHasApiKey(true);
            setIsConfigOpen(false);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage('API Key 无效');
        }
    };

    const handleClearConversation = () => {
        setMessages([]);
    };

    const handleExampleClick = (example: string) => {
        setInput(example);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // 格式化时间
    const formatTime = (timestamp: number | undefined) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 格式化消息内容，处理代码块
    const formatMessageContent = (content: string) => {
        if (!content) return null;

        // 使用正则表达式匹配 markdown 代码块
        const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
        let lastIndex = 0;
        const parts = [];
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // 添加代码块前的文本
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
            }

            // 添加代码块
            const language = match[1] || 'plaintext';
            const code = match[2].trim();

            parts.push(
                <div key={`code-${match.index}`} className="message-code-block">
                    <div className="code-header">
                        <span>{language || 'code'}</span>
                        <button
                            className="copy-button"
                            onClick={() => navigator.clipboard.writeText(code)}
                            title="复制代码"
                        >
                            复制
                        </button>
                    </div>
                    <pre><code>{code}</code></pre>
                </div>
            );

            lastIndex = match.index + match[0].length;
        }

        // 添加最后一部分文本
        if (lastIndex < content.length) {
            parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <div
            className={`ai-chat-panel ${isMinimized ? 'minimized' : ''}`}
            ref={aiPanelRef}
            style={{ width: isMinimized ? '50px' : `${width}px` }}
        >
            {/* AI面板拖动控件 */}
            {!isMinimized && (
                <div
                    className="ai-panel-resizer"
                    ref={aiPanelResizerRef}
                    onMouseDown={handleAIPanelMouseDown}
                    title="拖动调整AI面板宽度"
                ></div>
            )}

            <div className="ai-chat-header">
                <div className="ai-chat-title">
                    <div className="ai-chat-icon">
                        <img src={aiLogo} alt="AI 助手" className="ai-logo-img" />
                    </div>
                    {!isMinimized && <span>AI 助手</span>}
                </div>
                <div className="ai-chat-actions">
                    {!isMinimized && (
                        <>
                            <button
                                className="ai-action-btn"
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                title="设置"
                            >
                                <img src={settingsIcon} alt="设置" width="20" height="20" />
                            </button>
                            <button
                                className="ai-action-btn"
                                onClick={handleClearConversation}
                                title="清除对话"
                            >
                                <img src={clearIcon} alt="清除对话" width="20" height="20" />
                            </button>
                        </>
                    )}

                    <button
                        className="ai-action-btn"
                        onClick={toggleMinimize}
                        title={isMinimized ? "展开" : "最小化"}
                    >
                        <img
                            src={isMinimized ? expandIcon : minimizeIcon}
                            alt={isMinimized ? "展开" : "最小化"}
                            width="20"
                            height="20"
                        />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {isConfigOpen && renderConfigPanel()}

                    {errorMessage && <div className="ai-error-message">{errorMessage}</div>}

                    <div className="ai-chat-content">
                        <div className="ai-messages-container">
                            {messages.length === 0 ? (
                                <div className="ai-empty-state">
                                    <div className="ai-welcome">
                                        <div className="ai-welcome-icon">
                                            <img src={aiLogo} alt="AI 助手" className="ai-welcome-logo" />
                                        </div>
                                        <h2>智能编程助手</h2>
                                        <p>使用本地LM Studio模型为您的编程问题提供解答和代码建议</p>
                                    </div>

                                    <div className="ai-examples">
                                        <h3>你可以尝试问我：</h3>
                                        <div className="ai-examples-list">
                                            {conversationExamples.map((example, index) => (
                                                <div
                                                    key={index}
                                                    className="ai-example-item"
                                                    onClick={() => handleExampleClick(example)}
                                                >
                                                    <i className="icon-chat-bubble">💬</i>
                                                    <span>{example}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`ai-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                                    >
                                        <div className="message-avatar">
                                            {msg.role === 'user' ? (
                                                <div className="user-avatar">
                                                    <img src={userAvatar} alt="用户" width="32" height="32" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div className="ai-avatar">
                                                    <img src={aiLogo} alt="AI 助手" className="ai-message-logo" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-bubble">
                                                {formatMessageContent(msg.content)}
                                            </div>
                                            <div className="message-time">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isTyping && (
                                <div className="ai-message assistant-message">
                                    <div className="message-avatar">
                                        <div className="ai-avatar">
                                            <img src={aiLogo} alt="AI 助手" className="ai-message-logo" />
                                        </div>
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble">
                                            <div className="ai-typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef}></div>
                        </div>

                        <div className="ai-chat-input-container">
                            <div className="ai-input-wrapper">
                                <textarea
                                    ref={textareaRef}
                                    className="ai-input-field"
                                    placeholder="发送消息给AI助手..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />

                                <button
                                    className={`ai-send-button ${(!input.trim() || isTyping) ? 'disabled' : ''}`}
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isTyping}
                                    title="发送消息"
                                >
                                    <img src={sendIcon} alt="发送" width="20" height="20" />
                                </button>
                            </div>
                            <div className="ai-input-info">
                                {input.length > 0 && (
                                    <div className={`ai-helper-text ${input.length > 2000 ? 'warning' : ''}`}>
                                        {input.length}/2000
                                    </div>
                                )}
                                <div className="ai-helper-text">
                                    <kbd>Enter</kbd> 发送 | <kbd>Shift + Enter</kbd> 换行
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatPanel;