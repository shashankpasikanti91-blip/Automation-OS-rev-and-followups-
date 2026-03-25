import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = buildPagination(searchParams);

  const where = { tenantId: ctx.tenantId, isDeleted: false };

  const [docs, total] = await Promise.all([
    prisma.document.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json(apiSuccess(buildPaginatedResponse(docs, total, page, limit)));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string ?? file?.name ?? 'untitled';
  const organizationId = formData.get('organizationId') as string | null;
  const contactId = formData.get('contactId') as string | null;
  const documentType = formData.get('documentType') as string ?? 'OTHER';

  if (!file) return NextResponse.json(apiError('No file provided', 400), { status: 400 });

  // Validate file type and size (max 10MB)
  const allowedMimes = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  // Also allow by extension for browsers that send generic MIME types
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt', 'csv', 'xls', 'xlsx', 'doc', 'docx'];
  const fileExt = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!allowedMimes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
    return NextResponse.json(apiError('File type not allowed', 400), { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(apiError('File too large (max 10MB)', 400), { status: 400 });
  }

  const filename = `${randomUUID()}.${fileExt}`;
  const uploadDir = join(process.env.UPLOAD_DIR ?? './uploads', ctx.tenantId);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const fileUrl = `/uploads/${ctx.tenantId}/${filename}`;

  const doc = await prisma.document.create({
    data: {
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      name,
      storagePath: fileUrl,
      mimeType: file.type,
      size: file.size,
      docType: documentType,
      organizationId: organizationId ?? undefined,
      contactId: contactId ?? undefined,
      status: 'PENDING',
    },
  });

  // Queue AI extraction job (fire and forget — in prod use BullMQ)
  prisma.aiJob.create({
    data: {
      tenantId: ctx.tenantId,
      documentId: doc.id,
      type: 'document_extraction',
      status: 'QUEUED',
      prompt: JSON.stringify({ documentId: doc.id, fileUrl, fileType: file.type }),
    },
  }).catch(() => {});

  return NextResponse.json(apiSuccess(doc), { status: 201 });
}
