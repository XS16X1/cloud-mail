import app from '../hono/hono.js';
import aiTranslateService from '../service/ai-translate-service.js';
import userContext from '../security/user-context.js';
import result from '../model/result.js';

/**
 * AI翻译API
 */

// 获取支持的语言列表
app.get('/ai-translate/languages', async (c) => {
    const languages = aiTranslateService.getSupportedLanguages();
    return c.json(result.ok(languages));
});

// 翻译文本
app.post('/ai-translate/text', async (c) => {
    const { text, targetLang, sourceLang = 'auto' } = await c.req.json();
    
    if (!text) {
        return c.json(result.fail('文本不能为空'));
    }
    
    if (!targetLang) {
        return c.json(result.fail('目标语言不能为空'));
    }

    try {
        const userId = userContext.getUserId(c);
        const translation = await aiTranslateService.translateText(c, text, targetLang, sourceLang);
        return c.json(result.ok(translation));
    } catch (error) {
        console.error('翻译失败:', error);
        return c.json(result.fail('翻译失败: ' + error.message));
    }
});

// 批量翻译
app.post('/ai-translate/batch', async (c) => {
    const { texts, targetLang, sourceLang = 'auto' } = await c.req.json();
    
    if (!Array.isArray(texts) || texts.length === 0) {
        return c.json(result.fail('文本列表不能为空'));
    }
    
    if (!targetLang) {
        return c.json(result.fail('目标语言不能为空'));
    }

    try {
        const userId = userContext.getUserId(c);
        const translations = await aiTranslateService.batchTranslate(c, texts, targetLang, sourceLang);
        return c.json(result.ok(translations));
    } catch (error) {
        console.error('批量翻译失败:', error);
        return c.json(result.fail('批量翻译失败: ' + error.message));
    }
});

// 获取翻译历史
app.get('/ai-translate/history', async (c) => {
    const { limit = 50 } = c.req.query();
    
    try {
        const userId = userContext.getUserId(c);
        const history = await aiTranslateService.getTranslationHistory(c, parseInt(limit));
        return c.json(result.ok(history));
    } catch (error) {
        console.error('获取翻译历史失败:', error);
        return c.json(result.fail('获取翻译历史失败: ' + error.message));
    }
});

// 翻译邮件内容
app.post('/ai-translate/email', async (c) => {
    const { subject, content, targetLang, sourceLang = 'auto' } = await c.req.json();
    
    if (!subject && !content) {
        return c.json(result.fail('邮件主题或内容不能为空'));
    }
    
    if (!targetLang) {
        return c.json(result.fail('目标语言不能为空'));
    }

    try {
        const userId = userContext.getUserId(c);
        const results = [];
        
        // 翻译主题
        if (subject) {
            const subjectTranslation = await aiTranslateService.translateText(c, subject, targetLang, sourceLang);
            results.push({
                type: 'subject',
                original: subject,
                translated: subjectTranslation.translatedText
            });
        }
        
        // 翻译内容
        if (content) {
            const contentTranslation = await aiTranslateService.translateText(c, content, targetLang, sourceLang);
            results.push({
                type: 'content',
                original: content,
                translated: contentTranslation.translatedText
            });
        }

        return c.json(result.ok({
            translations: results,
            targetLang,
            sourceLang
        }));
    } catch (error) {
        console.error('邮件翻译失败:', error);
        return c.json(result.fail('邮件翻译失败: ' + error.message));
    }
});

export default app;