import app from '../hono/hono';
import result from '../model/result';
import translationService from '../service/translation-service';

app.post('/translation/translate', async (c) => {
    const { text } = await c.req.json();
    const translatedText = await translationService.translate(c, text);
    return c.json(result.ok(translatedText));
});