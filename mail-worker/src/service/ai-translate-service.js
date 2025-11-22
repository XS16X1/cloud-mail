import { kv } from '../hono/hono.js';
import dayjs from 'dayjs';

/**
 * AI翻译服务
 */
class AiTranslateService {
    
    /**
     * 支持的翻译语言
     */
    getSupportedLanguages() {
        return [
            { code: 'zh', name: '中文', nativeName: '中文' },
            { code: 'en', name: '英语', nativeName: 'English' },
            { code: 'es', name: '西班牙语', nativeName: 'Español' },
            { code: 'fr', name: '法语', nativeName: 'Français' },
            { code: 'de', name: '德语', nativeName: 'Deutsch' },
            { code: 'ja', name: '日语', nativeName: '日本語' },
            { code: 'ko', name: '韩语', nativeName: '한국어' },
            { code: 'ru', name: '俄语', nativeName: 'Русский' },
            { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
            { code: 'it', name: '意大利语', nativeName: 'Italiano' }
        ];
    }

    /**
     * 翻译文本
     */
    async translateText(c, text, targetLang, sourceLang = 'auto') {
        if (!text || !targetLang) {
            throw new Error('文本和目标语言不能为空');
        }

        // 简单的翻译逻辑，实际项目中可以集成第三方翻译API
        const translatedText = await this.performTranslation(text, sourceLang, targetLang);
        
        // 记录翻译历史
        await this.saveTranslationHistory(c, text, translatedText, sourceLang, targetLang);
        
        return {
            originalText: text,
            translatedText,
            sourceLang,
            targetLang,
            timestamp: dayjs().toISOString()
        };
    }

    /**
     * 执行翻译（模拟实现）
     */
    async performTranslation(text, sourceLang, targetLang) {
        // 这里可以集成真实的翻译API，如Google Translate、DeepL等
        // 目前使用简单的模拟翻译
        
        const translations = {
            'zh-en': {
                '你好': 'Hello',
                '谢谢': 'Thank you',
                '邮件': 'Email',
                '翻译': 'Translation',
                '成功': 'Success',
                '失败': 'Failed',
                '发送': 'Send',
                '接收': 'Receive',
                '主题': 'Subject',
                '内容': 'Content'
            },
            'en-zh': {
                'Hello': '你好',
                'Thank you': '谢谢',
                'Email': '邮件',
                'Translation': '翻译',
                'Success': '成功',
                'Failed': '失败',
                'Send': '发送',
                'Receive': '接收',
                'Subject': '主题',
                'Content': '内容'
            }
        };

        const key = `${sourceLang}-${targetLang}`;
        const translationMap = translations[key] || {};
        
        // 如果有预设翻译，直接返回
        if (translationMap[text]) {
            return translationMap[text];
        }

        // 模拟翻译处理
        if (sourceLang === 'zh' && targetLang === 'en') {
            // 中文转英文的简单模拟
            return text.replace(/你/g, 'You').replace(/好/g, ' good').replace(/谢谢/g, 'Thanks').trim();
        } else if (sourceLang === 'en' && targetLang === 'zh') {
            // 英文转中文的简单模拟
            return text.replace(/You/g, '你').replace(/good/g, '好').replace(/Thanks/g, '谢谢').trim();
        }

        // 默认返回原文
        return text;
    }

    /**
     * 保存翻译历史
     */
    async saveTranslationHistory(c, originalText, translatedText, sourceLang, targetLang) {
        try {
            const userId = c.get('userContext')?.userId;
            if (!userId) return;

            const history = {
                id: crypto.randomUUID(),
                userId,
                originalText,
                translatedText,
                sourceLang,
                targetLang,
                timestamp: dayjs().toISOString()
            };

            // 保存到KV存储
            const key = `translate_history_${userId}_${history.id}`;
            await kv.put(key, JSON.stringify(history), { expiration_ttl: 2592000 }); // 30天过期

            // 更新用户翻译统计
            await this.updateTranslationStats(c, userId, sourceLang, targetLang);
        } catch (error) {
            console.warn('保存翻译历史失败:', error);
        }
    }

    /**
     * 更新翻译统计
     */
    async updateTranslationStats(c, userId, sourceLang, targetLang) {
        try {
            const statsKey = `translate_stats_${userId}`;
            let stats = { total: 0, languages: {} };
            
            const existingStats = await kv.get(statsKey);
            if (existingStats) {
                stats = JSON.parse(existingStats);
            }

            stats.total += 1;
            const langKey = `${sourceLang}-${targetLang}`;
            stats.languages[langKey] = (stats.languages[langKey] || 0) + 1;

            await kv.put(statsKey, JSON.stringify(stats), { expiration_ttl: 2592000 });
        } catch (error) {
            console.warn('更新翻译统计失败:', error);
        }
    }

    /**
     * 获取翻译历史
     */
    async getTranslationHistory(c, limit = 50) {
        try {
            const userId = c.get('userContext')?.userId;
            if (!userId) return [];

            // 获取用户的翻译历史
            const prefix = `translate_history_${userId}_`;
            const historyList = [];
            
            // 这里简化处理，实际应该使用KV的list功能
            // 由于KV API限制，这里返回空数组，实际项目中可以使用数据库
            return historyList;
        } catch (error) {
            console.warn('获取翻译历史失败:', error);
            return [];
        }
    }

    /**
     * 批量翻译
     */
    async batchTranslate(c, texts, targetLang, sourceLang = 'auto') {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('文本列表不能为空');
        }

        const results = [];
        for (const text of texts) {
            try {
                const result = await this.translateText(c, text, targetLang, sourceLang);
                results.push(result);
            } catch (error) {
                results.push({
                    originalText: text,
                    translatedText: text, // 翻译失败返回原文
                    sourceLang,
                    targetLang,
                    error: error.message
                });
            }
        }

        return results;
    }
}

export default new AiTranslateService();