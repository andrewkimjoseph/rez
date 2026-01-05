import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/utils/helpers/sendTelegramMessage';
import { escapeMarkdown } from '@/utils/helpers/escapeMarkdown';

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
  rezTaskMasterEmailAddress: string;
  action: 'updated' | 'deleted';
  tallyFormUrl?: string;
  estimatedTimeOfCompletionInMinutes?: number;
  targetNumberOfParticipants?: number;
  rewardAmountPerParticipant?: number;
}

// Use a simple in-memory cache to track processed tasks within this API instance
const processedTasks = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const taskData: TaskNotificationData = await request.json();

    if (!taskData) {
      return NextResponse.json(
        { error: 'No task data provided' },
        { status: 400 }
      );
    }

    const { taskId, title, type, category, difficulty, rezTaskMasterEmailAddress, action } = taskData;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!action || (action !== 'updated' && action !== 'deleted')) {
      return NextResponse.json(
        { error: 'Action must be either "updated" or "deleted"' },
        { status: 400 }
      );
    }

    // Create a unique key for this task and action with timestamp to allow multiple updates
    // For updates, we use a time-based window (e.g., 5 seconds) to prevent rapid duplicate notifications
    const currentTime = Date.now();
    const taskActionKey = `${taskId}-${action}`;
    
    // For deletes, prevent duplicates entirely (a task can only be deleted once)
    // For updates, prevent rapid-fire duplicates within a 5-second window
    if (action === 'deleted') {
      if (processedTasks.has(taskActionKey)) {
        return NextResponse.json({ message: 'Task action already processed' });
      }
      processedTasks.add(taskActionKey);
    } else {
      // For updates, use a time-windowed key
      const timeWindowKey = `${taskActionKey}-${Math.floor(currentTime / 5000)}`; // 5-second window
      if (processedTasks.has(timeWindowKey)) {
        return NextResponse.json({ message: 'Task action already processed' });
      }
      processedTasks.add(timeWindowKey);
    }

    // Get environment variables
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Create notification message based on action type
    const actionEmoji = action === 'updated' ? '✏️' : '🗑️';
    const actionText = action === 'updated' ? 'Updated' : 'Deleted';
    
    let messageText = `${actionEmoji} *Rez Task ${actionText}!*\n\n` +
      `*Task ID:* ${escapeMarkdown(taskId)}\n` +
      `*Title:* ${escapeMarkdown(title || "Untitled Task")}\n` +
      `*Type:* ${escapeMarkdown(type || "Not specified")}\n` +
      `*Category:* ${escapeMarkdown(category || "Not specified")}\n` +
      `*Difficulty:* ${escapeMarkdown(difficulty || "Not specified")}\n` +
      `*Creator Email:* ${escapeMarkdown(rezTaskMasterEmailAddress || "Not provided")}\n`;

    // Only include task details for updates (deleted tasks might not have all fields)
    if (action === 'updated') {
      messageText += 
        `*Estimated Time:* ${taskData.estimatedTimeOfCompletionInMinutes || 'N/A'} minutes\n` +
        `*Target Participants:* ${taskData.targetNumberOfParticipants || 'N/A'}\n` +
        `*Reward per Participant:* $${taskData.rewardAmountPerParticipant || 'N/A'}\n`;
    }

    messageText += `*${actionText} At (Kenya):* ${new Date().toLocaleString("en-US", {
      timeZone: "Africa/Nairobi",
    })}`;

    const message: TelegramMessage = {
      chat_id: TELEGRAM_CHAT_ID,
      text: messageText,
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

