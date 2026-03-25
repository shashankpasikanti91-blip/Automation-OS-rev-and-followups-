import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status');
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.user.tenantId,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { type: { contains: search, mode: 'insensitive' as const } },
        { patient: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }},
      ],
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const appt = await prisma.appointment.create({
    data: {
      tenantId: session.user.tenantId,
      title: body.title ?? body.type ?? 'Appointment',
      type: body.type,
      status: body.status ?? 'scheduled',
      scheduledAt: new Date(body.scheduledAt),
      durationMins: body.durationMins ?? body.durationMinutes ?? 30,
      patientId: body.patientId,
      notes: body.notes,
    },
  });

  return NextResponse.json({ data: appt }, { status: 201 });
}
