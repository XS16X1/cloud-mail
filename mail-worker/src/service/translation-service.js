import settingService from './setting-service';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const translationService = {
    async translate(c, text) {
        const settings = await settingService.query(c);
        const { translationModelName, translationApiKey, translationApiUrl } = settings;

        if (!translationModelName || !translationApiKey || !translationApiUrl) {
            throw new BizError(t('translationSettingNotFound'));
        }

        const response = await fetch(translationApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${translationApiKey}`
            },
            body: JSON.stringify({
                model: translationModelName,
                messages: [{ role: 'user', content: `Translate the following text to Chinese: ${text}` }],
            }),
        });

        if (!response.ok) {
            throw new BizError(t('translationApiError'));
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
};

export default translationService;