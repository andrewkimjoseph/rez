import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-auth';

export const runtime = 'edge';

// Email template IDs from Resend
const EMAIL_TEMPLATES = {
  taskCreated: 'd24dcde1-e155-40f3-9ab5-6377cf878e20',
  taskRejected: '7aea42e0-e714-407e-809e-bbe323c88d16',
  taskApproved: '28a64ff9-3dd5-4af9-9d45-2ef3976302bb',
  taskPublished: 'ffda9f53-e424-49e5-9b6f-cdee85545d4c',
  taskCompleted: '967b5e39-248b-495f-9d79-3b356b5e18e5',
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;

interface SendResendEmailRequest {
  to: string[];
  template: EmailTemplateType;
  variables: {
    taskMasterId: string;
    taskId: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal server-side call (has secret token)
    // or a direct API call (requires super admin)
    const internalToken = request.headers.get('x-internal-token');
    const expectedToken = process.env.INTERNAL_API_TOKEN;
    
    // Validate internal call token if provided
    const isInternalCall = internalToken && expectedToken && internalToken === expectedToken;
    
    if (!isInternalCall) {
      // For direct API calls or invalid internal calls, require super admin authentication
      const authResult = await requireSuperAdmin(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    const body: SendResendEmailRequest = await request.json();

    // Validate required fields
    if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json(
        { error: 'Recipient email(s) are required' },
        { status: 400 }
      );
    }

    if (!body.template || !EMAIL_TEMPLATES[body.template]) {
      return NextResponse.json(
        { error: 'Valid template type is required' },
        { status: 400 }
      );
    }

    if (!body.variables?.taskMasterId || !body.variables?.taskId) {
      return NextResponse.json(
        { error: 'taskMasterId and taskId are required in variables' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const templateId = EMAIL_TEMPLATES[body.template];

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: body.to,
        template: {
          id: templateId,
          variables: {
            taskMasterId: body.variables.taskMasterId,
            taskId: body.variables.taskId,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email via Resend', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending Resend email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
