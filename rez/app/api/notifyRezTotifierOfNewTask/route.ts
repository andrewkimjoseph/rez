import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/utils/helpers/sendTelegramMessage';
import { escapeMarkdown } from '@/utils/helpers/escapeMarkdown';
import { requireAuth } from '@/lib/api-auth';

export const runtime = 'edge';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: string;
}

interface TaskNotificationData {
  taskId: string;
  title: string;
  type: string;
  category: string;
  difficulty: string;
  creatorEmail: string; // Person who created the task
  rezTaskMasterEmailAddress: string; // Person assigned to the task (assignee)
  tallyFormUrl?: string;
  estimatedTimeOfCompletionInMinutes?: number;
  targetNumberOfParticipants?: number;
  rewardAmountPerParticipant?: number;
}

// Use a simple in-memory cache to track processed tasks within this API instance
const processedTasks = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const taskData: TaskNotificationData = await request.json();

    if (!taskData) {
      return NextResponse.json(
        { error: 'No task data provided' },
        { status: 400 }
      );
    }

    const { taskId, title, type, category, difficulty, creatorEmail, rezTaskMasterEmailAddress } = taskData;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if we've already processed this task in this API instance
    if (processedTasks.has(taskId)) {
      return NextResponse.json({ message: 'Task already processed' });
    }

    // Mark task as processed BEFORE sending notification to prevent duplicates
    processedTasks.add(taskId);

    // Get environment variables
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Create notification message
    const message: TelegramMessage = {
      chat_id: TELEGRAM_CHAT_ID,
      text:
        `🎯 *New Rez Task Created!*\n\n` +
        `*Task ID:* ${escapeMarkdown(taskId)}\n` +
        `*Title:* ${escapeMarkdown(title || "Untitled Task")}\n` +
        `*Type:* ${escapeMarkdown(type || "Not specified")}\n` +
        `*Category:* ${escapeMarkdown(category || "Not specified")}\n` +
        `*Difficulty:* ${escapeMarkdown(difficulty || "Not specified")}\n` +
        `*Creator Email:* ${escapeMarkdown(creatorEmail || "Not provided")}\n` +
        `*Assignee Email:* ${escapeMarkdown(rezTaskMasterEmailAddress || "Not provided")}\n` +
        `*Estimated Time:* ${taskData.estimatedTimeOfCompletionInMinutes || 'N/A'} minutes\n` +
        `*Target Participants:* ${taskData.targetNumberOfParticipants || 'N/A'}\n` +
        `*Reward per Participant:* $${taskData.rewardAmountPerParticipant || 'N/A'}\n` +
        `*Created At (Kenya):* ${new Date().toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        })}`,
      parse_mode: "Markdown",
    };

    // Send notification to Telegram
    await sendTelegramMessage(message);

    // Clean up old entries to prevent memory leaks
    // Keep only the last 100 processed tasks
    if (processedTasks.size > 100) {
      const entries = Array.from(processedTasks);
      processedTasks.clear();
      entries.slice(-50).forEach((entry) => processedTasks.add(entry));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}