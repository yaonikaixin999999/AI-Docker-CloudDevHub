import React, { useRef } from 'react';
import explorerIcon from '../icons/icons8-文件夹-40.png';
// import searchIcon from '../icons/icons8-搜索-40.png';
// import gitIcon from '../icons/icons8-代码叉-40.png';
// import debugIcon from '../icons/icons8-播放-40.png';
// import extensionsIcon from '../icons/icons8-用户组-40.png';
import settingsIcon from '../icons/icons8-设置-40.png';

interface ActivityBarProps {
    activeTab: string;
    width: number;
    onTabChange: (tab: string) => void;
    onDragStart: () => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({
    activeTab,
    width,
    onTabChange,
    onDragStart
}) => {
    const activityBarRef = useRef<HTMLDivElement>(null);
    const activityBarResizerRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [showSettingsMenu, setShowSettingsMenu] = React.useState(false);

    const handleClick = (tabName: string) => {
        onTabChange(tabName);
    };

    const toggleSettingsMenu = () => {
        setShowSettingsMenu(prev => !prev);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActivityBarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        onDragStart();
    };

    return (
        <div
            className="activity-bar"
            ref={activityBarRef}
            style={{ width: `${width}px` }}
        >
            <div
                className={`activity-icon ${activeTab === 'explorer' ? 'active' : ''}`}
                onClick={() => handleClick('explorer')}
            >
                <img src={explorerIcon} alt="Explorer" />
            </div>

            {/* 其他活动栏图标 */}

            <div className="spacer"></div>

            <div
                className="activity-icon"
                onClick={toggleSettingsMenu}
                ref={settingsRef}
            >

                <img src={settingsIcon} alt="Settings" />
            </div>

            {/* 设置菜单弹窗 */}
            {showSettingsMenu && settingsRef.current && (
                <div className="settings-menu" style={{/* 样式 */ }}>
                    {/* 设置菜单项 */}
                </div>
            )}

            {/* 拖动控件 */}
            <div
                className="activity-bar-resizer"
                ref={activityBarResizerRef}
                onMouseDown={handleActivityBarMouseDown}
            ></div>
        </div>
    );
};

export default ActivityBar;