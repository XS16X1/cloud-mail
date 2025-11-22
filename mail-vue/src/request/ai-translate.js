import http from '@/axios/index.js';

/**
 * AI翻译相关API请求
 */

export function getSupportedLanguages() {
    return http.get('/ai-translate/languages');
}

export function translateText(text, targetLang, sourceLang = 'auto') {
    return http.post('/ai-translate/text', {
        text,
        targetLang,
        sourceLang
    });
}

export function translateBatch(texts, targetLang, sourceLang = 'auto') {
    return http.post('/ai-translate/batch', {
        texts,
        targetLang,
        sourceLang
    });
}

export function translateEmail(subject, content, targetLang, sourceLang = 'auto') {
    return http.post('/ai-translate/email', {
        subject,
        content,
        targetLang,
        sourceLang
    });
}

export function getTranslationHistory(limit = 50) {
    return http.get('/ai-translate/history', {
        params: { limit }
    });
}