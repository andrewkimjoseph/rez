import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createReadStream } from 'fs';
import { join } from 'path';
import { statSync } from 'fs';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get file path
    const filePath = join(process.cwd(), 'public', 'playbook.pdf');
    
    // Check if file exists
    try {
      const fileStats = statSync(filePath);
      
      // Create readable stream
      const fileStream = createReadStream(filePath);
      
      // Convert Node.js stream to Web ReadableStream
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          fileStream.on('end', () => {
            controller.close();
          });
          fileStream.on('error', (error) => {
            controller.error(error);
          });
        },
        cancel() {
          fileStream.destroy();
        },
      });

      // Return streaming response with proper headers
      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="rez-playbook.pdf"',
          'Content-Length': fileStats.size.toString(),
        },
      });
    } catch (fileError) {
      console.error('Error reading playbook PDF:', fileError);
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving playbook PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF' },
      { status: 500 }
    );
  }
}
