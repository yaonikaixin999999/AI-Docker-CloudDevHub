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
}

export class AIService {
    private apiKey: string | null = null;
    private apiBaseUrl: string;
    private model: string;

    constructor(options: AIServiceOptions = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://api.openai.com/v1';
        this.model = options.model || 'gpt-4';
    }

    setApiKey(apiKey: string | null) {
        this.apiKey = apiKey;
    }

    async sendMessage(messages: Message[]): Promise<Message> {
        if (!this.apiKey) {
            throw new Error('未设置 API Key，请先设置 API Key');
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
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
}

// 导出服务单例
export const aiService = new AIService();