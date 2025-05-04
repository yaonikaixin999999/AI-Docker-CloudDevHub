import React, { useState } from 'react';
import './Search.css';
import searchIconPath from '../icons/icons8-搜索-40.png';

interface SearchProps {
    // 可以添加需要的属性
}

const Search: React.FC<SearchProps> = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isReplaceVisible, setIsReplaceVisible] = useState(false);
    const [replaceQuery, setReplaceQuery] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [useRegExp, setUseRegExp] = useState(false);

    // 切换替换区域显示
    const toggleReplace = () => {
        setIsReplaceVisible(!isReplaceVisible);
    };

    // 模拟搜索处理函数
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('搜索:', searchQuery);
        // 实际应用中这里应该执行搜索逻辑
    };

    // 模拟替换处理函数
    const handleReplace = () => {
        console.log('替换:', searchQuery, '替换为:', replaceQuery);
        // 实际应用中这里应该执行替换逻辑
    };

    // 模拟全部替换处理函数
    const handleReplaceAll = () => {
        console.log('全部替换:', searchQuery, '替换为:', replaceQuery);
        // 实际应用中这里应该执行全部替换逻辑
    };

    return (
        <div className="search-container">
            <div className="search-header">
                <div className="search-title">
                    搜索
                    <div className="search-actions">
                        <button className="search-action" title="刷新" onClick={() => console.log('刷新')}>
                            <span>⟳</span>
                        </button>
                        <button className="search-action" title="清除" onClick={() => setSearchQuery('')}>
                            <span>✕</span>
                        </button>
                        <button className="search-action" title="折叠" onClick={() => console.log('折叠')}>
                            <span>⤢</span>
                        </button>
                        <button className="search-action" title="更多选项" onClick={toggleReplace}>
                            <span>⋮</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSearch}>
                    <div className="search-input-container">
                        <img
                            src={searchIconPath}
                            alt="搜索"
                            className="search-icon-img"
                        />
                        <input
                            type="text"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索"
                            autoFocus
                        />
                    </div>
                </form>

                {isReplaceVisible && (
                    <div className="search-input-container">
                        <input
                            type="text"
                            className="search-input"
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                            placeholder="替换"
                        />
                    </div>
                )}

                <div className="search-options">
                    <div className="search-options-left">
                        <div
                            className={`search-option ${caseSensitive ? 'active' : ''}`}
                            onClick={() => setCaseSensitive(!caseSensitive)}
                            title="区分大小写 (Alt+C)"
                        >
                            <span>Aa</span>
                        </div>
                        <div
                            className={`search-option ${wholeWord ? 'active' : ''}`}
                            onClick={() => setWholeWord(!wholeWord)}
                            title="全字匹配 (Alt+W)"
                        >
                            <span>ab</span>
                        </div>
                        <div
                            className={`search-option ${useRegExp ? 'active' : ''}`}
                            onClick={() => setUseRegExp(!useRegExp)}
                            title="使用正则表达式 (Alt+R)"
                        >
                            <span>.*</span>
                        </div>
                    </div>
                    <div className="search-options-right">
                        {isReplaceVisible && (
                            <>
                                <button
                                    className="search-option"
                                    onClick={handleReplace}
                                    title="替换 (Ctrl+Shift+1)"
                                >
                                    替换
                                </button>
                                <button
                                    className="search-option"
                                    onClick={handleReplaceAll}
                                    title="全部替换 (Ctrl+Alt+Enter)"
                                >
                                    全部替换
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="search-toggle" onClick={toggleReplace}>
                <div className="search-toggle-label">替换</div>
                <div className="search-toggle-shortcut">AB</div>
            </div>

            <div className="search-results">
                {/* 搜索结果会在这里显示 */}
                <div className="search-more">暂无搜索结果</div>
            </div>
        </div>
    );
};

export default Search;