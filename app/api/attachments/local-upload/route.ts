import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/json',
];

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

function getUploadDir() {
  return process.env.UPLOAD_DIR || './uploads';
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const testCaseId = formData.get('testCaseId') as string | null;
  const fieldName = formData.get('fieldName') as string | null;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: `File too large (max ${MAX_SIZE / 1024 / 1024}MB)` }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json({ error: `File type "${file.type}" is not allowed` }, { status: 400 });
  }

  const uploadDir = getUploadDir();
  const randomId = crypto.randomBytes(12).toString('hex');
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storedFilename = `${randomId}-${sanitizedName}`;
  const filePath = join(uploadDir, storedFilename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      filename: storedFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `local:${storedFilename}`,
      ...(testCaseId ? { testCaseId } : {}),
      ...(fieldName ? { fieldName } : {}),
    },
  });

  return Response.json({
    data: {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      size: attachment.size,
      mimeType: attachment.mimeType,
      uploadedAt: attachment.uploadedAt.toISOString(),
      entityType: 'testcase',
    },
  }, { status: 201 });
}
