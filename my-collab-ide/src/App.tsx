import './App.css';
import EditorComponent from './components/EditorComponent';

function App() {
  const handleCodeChange = (code: string | undefined) => {
    console.log('Code changed:', code);
  };

  return (
    <div className="app-full-page">
      <EditorComponent
        onChange={handleCodeChange}
        defaultLanguage="typescript"
        defaultValue="// TypeScript 代码编辑器\nconsole.log('Hello, World!');"
      />
    </div>
  );
}

export default App;