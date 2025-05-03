/**
 * AI 服务接口
 * 处理与 AI API 的通信
 */

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
}

export interface AIServiceOptions {
    apiBaseUrl?: string;
    model?: string;
    useLocalModel?: boolean;
}

export class AIService {
    private apiKey: string | null = null;
    private apiBaseUrl: string;
    private model: string;
    private useLocalModel: boolean;
    private localModelUrl: string = 'http://192.168.31.124:1234/v1'; // LM Studio 服务地址

    constructor(options: AIServiceOptions = {}) {
        // 默认使用本地模型
        this.useLocalModel = options.useLocalModel !== undefined ? options.useLocalModel : true;
        this.apiBaseUrl = this.useLocalModel ? this.localModelUrl : (options.apiBaseUrl || 'https://api.openai.com/v1');
        this.model = options.model || 'local-model'; // 默认使用本地模型ID
    }

    setApiKey(apiKey: string | null) {
        this.apiKey = apiKey;
    }

    toggleModelSource(useLocal: boolean) {
        this.useLocalModel = useLocal;
        this.apiBaseUrl = useLocal ? this.localModelUrl : 'https://api.openai.com/v1';
    }

    setLocalModelUrl(url: string) {
        this.localModelUrl = url;
        if (this.useLocalModel) {
            this.apiBaseUrl = url;
        }
    }

    setModel(model: string) {
        this.model = model;
    }

    async sendMessage(messages: Message[]): Promise<Message> {
        // 如果使用本地模型，则不需要API密钥
        if (!this.useLocalModel && !this.apiKey) {
            throw new Error('未设置 API Key，请先设置 API Key');
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // 只有当使用OpenAI API时才添加Authorization头
            if (!this.useLocalModel) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            console.log('发送请求到:', this.apiBaseUrl);
            console.log('使用模型:', this.model);
            console.log('请求头:', headers);

            const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: this.model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`AI API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('收到响应:', data);
            const assistantMessage = data.choices[0].message;

            return {
                role: 'assistant',
                content: assistantMessage.content,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('AI 请求错误:', error);
            throw error;
        }
    }

    // 添加获取可用模型的方法
    async getAvailableModels(): Promise<string[]> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (!this.useLocalModel && this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            console.log('获取模型列表从:', this.apiBaseUrl);
            const response = await fetch(`${this.apiBaseUrl}/models`, {
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`获取模型列表失败: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('获取到的模型列表:', data);

            // 专门处理LM Studio返回的格式
            if (data.data && Array.isArray(data.data)) {
                // 过滤出非embedding模型
                return data.data
                    .map((model: any) => model.id)
                    .filter((id: string) => !id.includes('embed'));
            } else {
                // 处理其他可能的响应格式或者使用默认值
                console.log('无法解析模型列表，使用默认值');
                return ['deepseek-r1-distill-qwen-14b', 'mimo-7b-rl-nomtp'];
            }
        } catch (error) {
            console.error('获取模型列表错误:', error);
            return ['deepseek-r1-distill-qwen-14b', 'mimo-7b-rl-nomtp'];
        }
    }
}

// 导出服务单例，默认使用本地模型
export const aiService = new AIService({ useLocalModel: true });