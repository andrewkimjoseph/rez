import { NextRequest, NextResponse } from 'next/server';
import { createTaskInPaxApp } from '@/firebase/firestore/services/createTaskInPaxApp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: type and title' },
        { status: 400 }
      );
    }

    // Create the task using the server-side service
    const taskId = await createTaskInPaxApp({
      type: body.type,
      title: body.title,
      category: body.category || "Other",
      difficulty: body.difficulty || "Medium",
      countries: body.countries,
      gender: body.gender,
      tallyFormUrl: body.tallyFormUrl,
      rezTaskMasterEmailAddress: body.rezTaskMasterEmailAddress,
    });

    // Trigger notification about the new task (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: body.title,
        type: body.type,
        category: body.category || "Other",
        difficulty: body.difficulty || "Medium",
        rezTaskMasterEmailAddress: body.rezTaskMasterEmailAddress,
        tallyFormUrl: body.tallyFormUrl,
        estimatedTimeOfCompletionInMinutes: 5, // Default from service
        targetNumberOfParticipants: 100, // Default from service
        rewardAmountPerParticipant: 0.15, // Default from service
      };

      // Send notification without awaiting (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfNewTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      }).catch(error => {
        // Silently handle notification errors
      });
    } catch (error) {
      // Don't fail the task creation if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      taskId,
      message: 'Task created successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 