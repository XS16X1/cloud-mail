import settingService from "./setting-service.js";

export async function translate(text, c) {
    const settings = await settingService.query(c);
    const { aiKey, aiHost, aiModel } = settings;

    if (!aiKey || !aiHost || !aiModel) {
        return '请在设置中配置AI翻译服务';
    }

    const response = await fetch(`${aiHost}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiKey}`
        },
        body: JSON.stringify({
            model: aiModel,
            messages: [
                {
                    role: 'system',
                    content: 'You are a translator.'
                },
                {
                    role: 'user',
                    content: `Translate the following text to Chinese: ${text}`
                }
            ]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}
