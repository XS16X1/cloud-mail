import {hon} from "@/hono/hono.js";
import {translate} from "@/service/translate-service.js";

const app = hon.post('/translate', async (c) => {
    const { text } = await c.req.json();
    const translatedText = await translate(text, c.env);
    return c.json(translatedText);
});

export default app;