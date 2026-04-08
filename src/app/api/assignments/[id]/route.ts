import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers or admins can update assignments' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, subjectId, type, deadline, fileUrl, status } = body;

    // Check if assignment exists
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Teachers can only update their own assignments
    if (payload.role === 'TEACHER' && existing.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'You can only update your own assignments' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (type !== undefined) updateData.type = type;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (status !== undefined) updateData.status = status;

    const assignment = await db.assignment.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers or admins can delete assignments' }, { status: 403 });
    }

    const { id } = await params;

    // Check if assignment exists
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Teachers can only delete their own assignments
    if (payload.role === 'TEACHER' && existing.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete your own assignments' }, { status: 403 });
    }

    // Soft delete by setting status to ARCHIVED
    const assignment = await db.assignment.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ assignment, message: 'Assignment archived successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
