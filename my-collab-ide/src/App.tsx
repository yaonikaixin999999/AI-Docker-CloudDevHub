import { useState, useEffect } from 'react';
import './App.css';
import EditorComponent from './components/EditorComponent';
import { apiKeyService } from './services/apiKeyService';
import { aiService } from './services/aiService';

function App() {
  const [code, setCode] = useState<string | undefined>("console.log('Hello, World!');");
  // const [isApiKeySet, setIsApiKeySet] = useState(false);
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

  const handleCodeChange = (code: string | undefined) => {
    setCode(code);
    console.log('Code changed:', code);
  };

  return (
    <div className="app-full-page">
      <EditorComponent
        onChange={handleCodeChange}
        defaultLanguage="typescript"
        defaultValue={code}
      />
    </div>
  );
}

export default App;