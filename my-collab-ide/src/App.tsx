import { useState, useEffect } from 'react';
import './App.css';
import EditorComponent from './components/EditorComponent';
import { apiKeyService } from './services/apiKeyService';
import { aiService } from './services/aiService';

function App() {
  const [code, setCode] = useState<string | undefined>("console.log('Hello, World!');");
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  useEffect(() => {
    // 检查是否已设置 API Key
    const hasKey = apiKeyService.hasApiKey();
    setIsApiKeySet(hasKey);

    if (hasKey) {
      // 如果已设置，初始化 AI 服务
      aiService.setApiKey(apiKeyService.getApiKey());
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