import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/utils/helpers/sendTelegramMessage';
import { escapeMarkdown } from '@/utils/helpers/escapeMarkdown';
import { requireAuth } from '@/lib/api-auth';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: string;
}

interface NewAccountNotificationData {
  id: string;
  name: string | null;
  emailAddress: string | null;
  profilePictureURI: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const data: NewAccountNotificationData = await request.json();

    if (!data || !data.id) {
      return NextResponse.json(
        { error: 'Missing required account data (id)' },
        { status: 400 }
      );
    }

    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (!TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    const message: TelegramMessage = {
      chat_id: TELEGRAM_CHAT_ID,
      text:
        `🆕 *New Rez Account Created!*\n\n` +
        `*Task Master ID:* ${escapeMarkdown(data.id)}\n` +
        `*Name:* ${escapeMarkdown(data.name || 'N/A')}\n` +
        `*Email:* ${escapeMarkdown(data.emailAddress || 'N/A')}\n` +
        `*Created At (Kenya):* ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}`,
      parse_mode: 'Markdown',
    };

    await sendTelegramMessage(message);

    return NextResponse.json({
      success: true,
      message: 'New account notification sent successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send new account notification' },
      { status: 500 }
    );
  }
}


