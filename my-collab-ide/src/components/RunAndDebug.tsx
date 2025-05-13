import React, { useState } from 'react';
import './RunAndDebug.css';

const RunAndDebug: React.FC = () => {
    const [expanded,] = useState(true);
    // const [expanded, setExpanded] = useState(true);

    return (
        <div className="run-debug-container">
            {/* 运行部分 */}
            <div className="run-debug-section">
                <div className="run-debug-header">
                    <div className="run-debug-header-title">
                        {expanded ?
                            <span className="chevron open">▼</span> :
                            <span className="chevron">▶</span>
                        }
                        运行
                    </div>
                    <div className="run-debug-header-actions">
                        <div className="run-debug-header-action">...</div>
                    </div>
                </div>

                {expanded && (
                    <div className="run-debug-content">
                        <button className="run-debug-button">
                            运行和调试
                        </button>

                        <div className="run-debug-message">
                            要自定义运行和调试<a href="#" className="run-debug-link">创建 launch.json 文件</a>。
                        </div>

                        <div className="run-debug-help">
                            无论是基于 <a href="#" className="run-debug-link">终端命令</a> 还是使用 <a href="#" className="run-debug-link">交互式聊天</a>，
                            AI助手都可帮助你开始调试。
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunAndDebug;