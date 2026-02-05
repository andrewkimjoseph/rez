import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { rezStorage } from '@/firebase/serverConfig';

const FILE_PATH = 'website_assets/playbook.pdf';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const bucket = rezStorage.bucket('the-rez-app.firebasestorage.app');
    const file = bucket.file(FILE_PATH);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const contentType = metadata?.contentType || 'application/pdf';
    const nodeStream = file.createReadStream();

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err: Error) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="rez-playbook.pdf"',
      },
    });
  } catch (error) {
    console.error('Error serving playbook:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
