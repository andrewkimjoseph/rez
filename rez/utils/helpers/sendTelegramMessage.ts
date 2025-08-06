interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: string;
}

/**
 * Sends a message to Telegram using the configured bot token and chat ID
 * @param message - The Telegram message object
 * @returns Promise<void>
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  try {

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
  } catch (error) {
    throw error;
  }
}