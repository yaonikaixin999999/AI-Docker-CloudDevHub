import { useState, useEffect, useCallback } from 'react'; // 导入 useCallback
import './App.css';
import CollaborativeEditor from './components/CollaborativeEditor'; // 引入协同编辑组件
import { apiKeyService } from './services/apiKeyService';
import { aiService } from './services/aiService';

function App() {
  // 现在，这里的 `code` 状态表示由 CollaborativeEditor 组件管理的 *当前激活文件* 的内容。
  const [code, setCode] = useState<string | undefined>("// Select a file to start coding\\n");
  const [, setIsApiKeySet] = useState(false);

  useEffect(() => {
    // 默认使用本地模型设置
    localStorage.setItem('use_local_model', 'true');
    localStorage.setItem('local_model_url', 'http://192.168.31.124:1234/v1');

    // 检查模型配置
    const useLocalModel = localStorage.getItem('use_local_model') === 'true';
    const localModelUrl = localStorage.getItem('local_model_url') || 'http://192.168.31.124:1234/v1';

    // 初始化时加载模型列表来确定默认模型名称
    const initializeModels = async () => {
      try {
        // 应用模型配置
        aiService.toggleModelSource(true); // 强制使用本地模型
        aiService.setLocalModelUrl(localModelUrl);

        // 获取可用模型列表
        const models = await aiService.getAvailableModels();
        console.log('可用模型列表:', models);

        if (models && models.length > 0) {
          const modelName = models[0]; // 使用第一个可用模型
          localStorage.setItem('model_name', modelName);
          aiService.setModel(modelName);
          console.log('已设置默认模型:', modelName);
        } else {
          // 如果无法获取模型，使用默认值
          const defaultModel = 'local-model';
          localStorage.setItem('model_name', defaultModel);
          aiService.setModel(defaultModel);
          console.log('无法获取可用模型，使用默认值:', defaultModel);
        }
      } catch (error) {
        console.error('初始化模型失败:', error);
        // 出错时使用默认值
        const defaultModel = 'local-model';
        localStorage.setItem('model_name', defaultModel);
        aiService.setModel(defaultModel);
      }
    };

    initializeModels();

    // 如果不使用本地模型，则需要检查API Key
    if (!useLocalModel) {
      const hasKey = apiKeyService.hasApiKey();
      setIsApiKeySet(hasKey);

      if (hasKey) {
        aiService.setApiKey(apiKeyService.getApiKey());
      }
    }
  }, []);

  // 使用 useCallback 包装 handleCodeChange，确保其引用稳定
  const handleCodeChange = useCallback((code: string | undefined) => {
    setCode(code);
    console.log('Code changed (from CollaborativeEditor):', code);
  }, []); // 空依赖数组表示此函数只创建一次

  return (
    <div className="app-full-page">
      <CollaborativeEditor
        onChange={handleCodeChange} // 传入稳定的函数引用
        defaultValue="// Select a file to start coding\\n"
        // 移除 editorContent 和 setEditorContent，它们是多余的且会导致类型错误
        // editorContent={code || ""}
        // setEditorContent={setCode}
      />
    </div>
  );
}

export default App;