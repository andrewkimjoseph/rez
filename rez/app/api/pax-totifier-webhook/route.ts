import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';
import '@/firebase/serverConfig';

/** Telegram Update object (minimal shape we use) */
interface TelegramUpdate {
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

async function sendTelegramReply(chatId: number, text: string): Promise<void> {
  const token = process.env.PAX_TOTIFIER_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('PAX_TOTIFIER_TELEGRAM_BOT_TOKEN missing; cannot send Telegram reply');
    return;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PAX_TOTIFIER_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerToken = request.headers.get('x-telegram-bot-api-secret-token');
    if (headerToken !== webhookSecret) {
      return new NextResponse(null, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;

  if (text?.startsWith('/disable')) {
    const participantId = text.split(/\s+/)[1]?.trim();

    if (!chatId) {
      return new NextResponse(null, { status: 200 });
    }

    if (!participantId) {
      await sendTelegramReply(
        chatId,
        '❌ Please provide a participant ID.\nUsage: /disable [participantId]'
      );
      return new NextResponse(null, { status: 200 });
    }

    const auth = getAuth(getApp('paxApp'));
    try {
      const existing = await auth.getUser(participantId);
      if (existing.disabled) {
        await sendTelegramReply(chatId, `ℹ️ Participant already disabled.\nParticipant ID: ${participantId}`);
        return new NextResponse(null, { status: 200 });
      }
    } catch {
      // User may not exist; continue and let updateUser surface the error
    }

    await sendTelegramReply(chatId, `⏳ Disabling participant: ${participantId}...`);

    try {
      await auth.updateUser(participantId, { disabled: true });
      
      // Update Firestore
      const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
      const participantDoc = await participantsRef.doc(participantId).get();
      if (participantDoc.exists) {
        await participantsRef.doc(participantId).update({
          isDisabled: true,
          timeUpdated: FieldValue.serverTimestamp(),
        });
      }
      
      await sendTelegramReply(
        chatId,
        `✅ Participant disabled successfully.\nParticipant ID: ${participantId}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error disabling participant via webhook:', error);
      await sendTelegramReply(chatId, `❌ Failed to disable participant.\nError: ${message}`);
    }
  }

  if (text?.startsWith('/enable')) {
    const participantId = text.split(/\s+/)[1]?.trim();

    if (!chatId) {
      return new NextResponse(null, { status: 200 });
    }

    if (!participantId) {
      await sendTelegramReply(
        chatId,
        '❌ Please provide a participant ID.\nUsage: /enable [participantId]'
      );
      return new NextResponse(null, { status: 200 });
    }

    const auth = getAuth(getApp('paxApp'));
    try {
      const existing = await auth.getUser(participantId);
      if (!existing.disabled) {
        await sendTelegramReply(chatId, `ℹ️ Participant already enabled.\nParticipant ID: ${participantId}`);
        return new NextResponse(null, { status: 200 });
      }
    } catch {
      // User may not exist; continue and let updateUser surface the error
    }

    await sendTelegramReply(chatId, `⏳ Enabling participant: ${participantId}...`);

    try {
      await auth.updateUser(participantId, { disabled: false });
      
      // Update Firestore
      const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
      const participantDoc = await participantsRef.doc(participantId).get();
      if (participantDoc.exists) {
        await participantsRef.doc(participantId).update({
          isDisabled: false,
          timeUpdated: FieldValue.serverTimestamp(),
        });
      }
      
      await sendTelegramReply(
        chatId,
        `✅ Participant enabled successfully.\nParticipant ID: ${participantId}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error enabling participant via webhook:', error);
      await sendTelegramReply(chatId, `❌ Failed to enable participant.\nError: ${message}`);
    }
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return new NextResponse(null, { status: 405 });
}
