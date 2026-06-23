import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

function getUploadDir() {
  return process.env.UPLOAD_DIR || './uploads';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attachmentId } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return Response.json({ error: 'Attachment not found' }, { status: 404 });
  }

  if (!attachment.path.startsWith('local:')) {
    return Response.json({ error: 'Not a local file' }, { status: 400 });
  }

  const filename = attachment.path.slice(6); // strip "local:"
  const filePath = join(getUploadDir(), filename);

  if (!existsSync(filePath)) {
    return Response.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const fileBuffer = await readFile(filePath);

  const isPreviewable = attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf';
  const disposition = isPreviewable
    ? 'inline'
    : `attachment; filename="${encodeURIComponent(attachment.originalName)}"`;

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
