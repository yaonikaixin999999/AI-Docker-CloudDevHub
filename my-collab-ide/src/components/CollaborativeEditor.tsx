// CollaborativeEditor.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import EditorComponent from './EditorComponent'; // 现在 EditorComponent 会管理加载状态
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import axios from 'axios';
import _ from 'lodash';

interface CollaborativeEditorProps {
  onChange: (value: string | undefined) => void;
  defaultLanguage?: string;
  defaultValue?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  onChange,
  defaultLanguage = 'javascript',
  defaultValue = '// Select a file to start coding\\n',
}) => {
  const [doc] = useState(() => new Y.Doc());
  const providerRef = useRef<InstanceType<typeof WebsocketProvider> | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentYTextObserver = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFilePathRef = useRef<string>(''); // 新增：保存当前文件路径
  const currentYTextRef = useRef<Y.Text | null>(null); // ✅ 确保这里有定义

  // 防抖文件切换函数
  const debouncedFileChange = useRef(
      _.debounce(async (filePath: string, editorInstance: monaco.editor.IStandaloneCodeEditor) => {
          if (!editorInstance) return;

          // 如果文件路径没有变化，则不做任何操作
          if (currentFilePathRef.current === filePath) {
              return;
          }

          // 记录新的文件路径
          currentFilePathRef.current = filePath;
          console.log(`CollaborativeEditor 切换到文件: ${filePath}`); // 调试信息

          // 销毁旧的 binding 和 provider
          if (bindingRef.current) {
              bindingRef.current.destroy();
              bindingRef.current = null;
              console.log('销毁旧的 binding'); // 调试信息
          }
          if (providerRef.current) {
              providerRef.current.destroy();
              providerRef.current = null;
              console.log('销毁旧的 provider'); // 调试信息
          }
          // 取消旧的 Y.Text 观察者
          if (currentYTextRef.current && currentYTextObserver.current) {
              currentYTextRef.current.unobserve(currentYTextObserver.current);
              currentYTextObserver.current = null;
              console.log('取消旧的 Y.Text 观察者'); // 调试信息
          }

          // 获取或创建新的 Y.Text 实例
          const yText = doc.getText(`file:${filePath}`);
          currentYTextRef.current = yText; // 更新当前活跃的 Y.Text 实例
          console.log(`获取/创建 Y.Text for: file:${filePath}`); // 调试信息


          // 创建新的 WebsocketProvider
          providerRef.current = new WebsocketProvider(
              'ws://localhost:1234', // 确保这是你的 WebSocket 服务器地址
              `monaco-collab-room-${filePath}`, // 为每个文件使用一个独立的 Yjs room
              doc
          );
          console.log(`创建 WebsocketProvider for room: monaco-collab-room-${filePath}`); // 调试信息

          // 创建新的 MonacoBinding
          const model = editorInstance.getModel();
          if (!model) {
              console.error('Monaco Editor model is not available.');
              return;
          }
          const binding = new MonacoBinding(
              yText,
              model,
              new Set([editorInstance]),
              providerRef.current.awareness
          );
          bindingRef.current = binding;
          console.log('创建 MonacoBinding'); // 调试信息

          // 加载文件内容
          // 停止任何正在进行的旧文件内容请求
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              console.log('中止旧的文件内容请求'); // 调试信息
          }
          const newAbortController = new AbortController();
          abortControllerRef.current = newAbortController;

          try {
              const response = await axios.get(`${API_BASE_URL}/files/content`, {
                  params: { path: filePath },
                  signal: newAbortController.signal
              });

              const fetchedContent = response.data.content;
              console.log(`成功加载文件内容: ${filePath}`); // 调试信息

              doc.transact(() => {
                  // 清空现有内容并插入新内容
                  yText.delete(0, yText.length);
                  yText.insert(0, fetchedContent);
              });

              // 确保 Monaco Editor 的内容与 Y.Text 同步
              // 这一步在 binding 存在的情况下，Yjs 会自动处理，但为了初始化可能需要强制设置
              if (model.getValue() !== fetchedContent) {
                  model.setValue(fetchedContent);
              }
              // 确保语言模式正确设置
              const fileExtension = filePath.split('.').pop() || '';
              const language = getMonacoLanguage(fileExtension);
              monaco.editor.setModelLanguage(model, language);


          } catch (err) {
              if (axios.isCancel(err)) {
                  console.log('File content request canceled:', filePath);
                  return;
              }
              const errorMessage = `// Error loading file: ${err instanceof Error ? err.message : String(err)}`;
              console.error(`加载文件 ${filePath} 失败:`, err); // 调试信息
              // ⚠️ 这里不再将错误信息写入 yText，避免同步到其他客户端
              // 而是让 EditorComponent 自己处理显示错误或者加载失败后的默认内容
              // editorInstance.setValue(errorMessage); // 不直接设置，让 Yjs 同步实际内容或保持默认值
          }

          // 观察 Y.Text 内容变化，并同步到父组件的 onChange
          const newObserveFn = () => {
              const currentContent = yText.toString();
              // 只有当编辑器内容与 Y.Text 内容不一致时才调用 onChange，避免无限循环
              if (onChange && editorInstance.getValue() !== currentContent) {
                  onChange(currentContent);
              }
          };
          yText.observe(newObserveFn);
          currentYTextObserver.current = newObserveFn;

      }, 300)
  ).current; // .current 来获取防抖函数本身

  // Helper function to get Monaco language from file extension
  const getMonacoLanguage = (extension: string) => {
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'py':
            return 'python';
        case 'java':
            return 'java';
        case 'c':
            return 'c';
        case 'cpp':
            return 'cpp';
        case 'json':
            return 'json';
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'md':
            return 'markdown';
        default:
            return 'plaintext';
    }
};


  // EditorComponent ready callback
  const handleEditorReady = useCallback((editorInstance: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
      if (defaultValue) {
          editorInstance.setValue(defaultValue);
      }
      // console.log('Editor ready, initial default value set.'); // 调试信息
  }, [defaultValue]);

  // 处理文件切换的副作用
  const handleFileChange = useCallback((filePath: string) => {
      console.log(`CollaborativeEditor 接收文件切换请求: ${filePath}`); // 调试信息
      if (editorRef.current) {
          debouncedFileChange(filePath, editorRef.current);
      } else {
          console.warn('Editor instance not ready when file change requested.'); // 调试信息
      }
  }, [debouncedFileChange]);


  useEffect(() => {
      // 在组件卸载时进行全面清理
      return () => {
          console.log('CollaborativeEditor 组件卸载，进行清理...'); // 调试信息
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
          }
          if (bindingRef.current) {
              bindingRef.current.destroy();
              bindingRef.current = null;
          }
          if (providerRef.current) {
              providerRef.current.destroy();
              providerRef.current = null;
          }
          if (editorRef.current) {
              editorRef.current.dispose();
              editorRef.current = null;
          }
          if (currentYTextRef.current && currentYTextObserver.current) {
              currentYTextRef.current.unobserve(currentYTextObserver.current);
              currentYTextObserver.current = null;
          }
          // doc.destroy(); // 如果 doc 是整个应用的单例，则不要销毁它
      };
  }, [doc]);


  return (
    <EditorComponent
      onChange={onChange}
      defaultLanguage={defaultLanguage}
      defaultValue={defaultValue}
      onReady={handleEditorReady}
      onFileChange={handleFileChange} // 将文件切换事件传递给 EditorComponent
      activeFile={currentFilePathRef.current} // 传递当前活动文件路径给 EditorComponent
    />
  );
};

export default CollaborativeEditor;