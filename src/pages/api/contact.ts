import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getEnv } from '../../shared/config';

export const prerender = false;

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  contact: z.string().min(1, 'Contact is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
});

function sanitizeInput(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .trim();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const raw = {
      name: formData.get('name')?.toString().trim() || '',
      contact: formData.get('contact')?.toString().trim() || '',
      message: formData.get('message')?.toString().trim() || '',
    };

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Всі поля обов\'язкові' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, contact, message } = parsed.data;
    const env = getEnv();

    const safeName = sanitizeInput(name);
    const safeContact = sanitizeInput(contact);
    const safeMessage = sanitizeInput(message);

    const text = [
      '📬 *Нова заявка з сайту*',
      '',
      `👤 *Ім'я:* ${safeName}`,
      `📞 *Зв'язок:* ${safeContact}`,
      `💬 *Повідомлення:* ${safeMessage}`,
      '',
      `🕐 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`,
    ].join('\n');

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResponse.status);
      throw new Error('Telegram API error');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Помилка відправки' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
