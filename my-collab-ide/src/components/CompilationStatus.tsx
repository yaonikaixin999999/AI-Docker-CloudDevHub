import React, { useState, useEffect } from 'react';
import { collaborationService, CompilationEvent } from '../services/collaborationService';
import './CompilationStatus.css';

interface CompilationStatusProps {
    currentFile: string | null;
}

const CompilationStatus: React.FC<CompilationStatusProps> = ({ currentFile }) => {
    const [activeCompilations, setActiveCompilations] = useState<CompilationEvent[]>([]);

    useEffect(() => {
        if (currentFile) {
            collaborationService.joinCompilationRoom(currentFile);
        }

        const handleCompilationStarted = (event: CompilationEvent) => {
            setActiveCompilations(prev => [...prev, event]);
        };

        const handleCompilationCompleted = (event: CompilationEvent) => {
            setActiveCompilations(prev =>
                prev.map(comp =>
                    comp.compilationKey === event.compilationKey
                        ? { ...comp, ...event, endTime: event.endTime }
                        : comp
                )
            );

            // 3秒后移除已完成的编译
            setTimeout(() => {
                setActiveCompilations(prev =>
                    prev.filter(comp => comp.compilationKey !== event.compilationKey)
                );
            }, 3000);
        };

        const handleCompilationFailed = (event: any) => {
            setActiveCompilations(prev =>
                prev.filter(comp => comp.filePath !== event.filePath)
            );
        };

        collaborationService.onCompilationStarted(handleCompilationStarted);
        collaborationService.onCompilationCompleted(handleCompilationCompleted);
        collaborationService.onCompilationFailed(handleCompilationFailed);

        return () => {
            if (currentFile) {
                collaborationService.leaveCompilationRoom(currentFile);
            }
        };
    }, [currentFile]);

    if (activeCompilations.length === 0) {
        return null;
    }

    return (
        <div className="compilation-status-container">
            <div className="compilation-status-header">
                <span>📊 编译状态</span>
            </div>
            <div className="compilation-list">
                {activeCompilations.map((compilation) => (
                    <div
                        key={compilation.compilationKey}
                        className={`compilation-item ${compilation.endTime ? 'completed' : 'running'}`}
                    >
                        <div className="compilation-info">
                            <span className="compilation-file">
                                {compilation.filePath.split('/').pop()}
                            </span>
                            <span className="compilation-user">
                                用户: {compilation.userId}
                            </span>
                        </div>
                        <div className="compilation-status">
                            {compilation.endTime ? (
                                <span className="status-completed">
                                    ✅ 完成 ({((compilation.endTime - compilation.startTime) / 1000).toFixed(1)}s)
                                </span>
                            ) : (
                                <span className="status-running">
                                    ⏳ 编译中...
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompilationStatus;