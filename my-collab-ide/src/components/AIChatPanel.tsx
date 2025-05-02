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

interface AIChatPanelProps {
    width: number;
    onResize: (width: number) => void;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ width, onResize }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const aiPanelRef = useRef<HTMLDivElement>(null);
    const aiPanelResizerRef = useRef<HTMLDivElement>(null);
    const [isDraggingAIPanel, setIsDraggingAIPanel] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 引入示例对话提示
    const conversationExamples = [
        "你能帮我解释一下React Hooks的工作原理吗？",
        "如何优化这段代码：function fib(n) { if(n <= 1) return n; return fib(n-1) + fib(n-2); }",
        "编写一个简单的Node.js Express服务器",
        "请帮我修复这段代码中的错误"
    ];

    // 初始化检查是否有 API Key
    useEffect(() => {
        const hasKey = apiKeyService.hasApiKey();
        setHasApiKey(hasKey);

        if (hasKey) {
            aiService.setApiKey(apiKeyService.getApiKey());
        }
    }, []);

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

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        // 检查是否有 API Key
        if (!hasApiKey) {
            setErrorMessage('请先设置 API Key');
            setIsConfigOpen(true);
            return;
        }

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
                    {!isMinimized && !hasApiKey && (
                        <button
                            className="ai-key-required"
                            onClick={() => setIsConfigOpen(true)}
                            title="需要设置API Key"
                        >
                            <i className="icon-key">🔑</i>
                        </button>
                    )}

                    {!isMinimized && hasApiKey && (
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
                    {isConfigOpen && (
                        <div className="ai-key-config">
                            <div className="ai-key-header">
                                <h3>API Key 设置</h3>
                                <p className="ai-key-info">请输入你的 OpenAI API Key 以启用 AI 助手</p>
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
                        </div>
                    )}

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
                                        <p>针对你的编程问题提供专业解答和代码建议</p>
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

                                {hasApiKey ? (
                                    <button
                                        className={`ai-send-button ${(!input.trim() || isTyping) ? 'disabled' : ''}`}
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isTyping}
                                        title="发送消息"
                                    >
                                        <img src={sendIcon} alt="发送" width="20" height="20" />
                                    </button>
                                ) : (
                                    <button
                                        className="ai-key-button"
                                        onClick={() => setIsConfigOpen(true)}
                                        title="设置API Key"
                                    >
                                        <i className="icon-key">🔑</i>
                                    </button>
                                )}
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