/**
 * API Key 管理服务
 * 负责存储、检索和验证 API Key
 */

const API_KEY_STORAGE_KEY = 'ai_assistant_api_key';

export interface ApiKeyServiceInterface {
    // 保存 API Key
    saveApiKey(apiKey: string): void;

    // 获取存储的 API Key
    getApiKey(): string | null;

    // 检查是否已设置 API Key
    hasApiKey(): boolean;

    // 清除存储的 API Key
    clearApiKey(): void;
}

class LocalStorageApiKeyService implements ApiKeyServiceInterface {
    saveApiKey(apiKey: string): void {
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('API Key 不能为空');
        }
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    }

    getApiKey(): string | null {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    }

    hasApiKey(): boolean {
        const key = this.getApiKey();
        return key !== null && key.trim() !== '';
    }

    clearApiKey(): void {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
}

// 导出服务实例
export const apiKeyService = new LocalStorageApiKeyService();

// 导出验证 API Key 的辅助函数
export function validateApiKey(apiKey: string): boolean {
    // 这里可以添加 API Key 的基本验证逻辑
    // 例如长度检查、格式验证等
    return Boolean(apiKey && apiKey.trim().length >= 8); // 保证返回 boolean 类型
}