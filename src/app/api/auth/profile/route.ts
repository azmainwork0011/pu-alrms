import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, coverPhoto: true, rollNumber: true,
        batch: true, department: true, phone: true, bio: true,
        createdAt: true, updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload (avatar or cover photo)
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = formData.get('type') as string | null; // 'avatar' or 'cover'

      if (!file || !type) {
        return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
      }

      if (!['avatar', 'cover'].includes(type)) {
        return NextResponse.json({ error: 'Type must be avatar or cover' }, { status: 400 });
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles', payload.userId);
      await mkdir(uploadDir, { recursive: true });

      // Generate filename
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = type === 'avatar' ? `avatar.${ext}` : `cover.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // URL path
      const fileUrl = `/uploads/profiles/${payload.userId}/${fileName}`;

      // Update user in database
      const updateData = type === 'avatar' ? { avatar: fileUrl } : { coverPhoto: fileUrl };
      await db.user.update({
        where: { id: payload.userId },
        data: updateData,
      });

      return NextResponse.json({ success: true, url: fileUrl });
    } else {
      // Handle JSON update (profile fields)
      const body = await req.json();
      const { name, rollNumber, batch, department, phone, bio } = body;

      // Build update data (only include provided fields)
      const updateData: Record<string, string> = {};
      if (name !== undefined) updateData.name = name;
      if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
      if (batch !== undefined) updateData.batch = batch;
      if (department !== undefined) updateData.department = department;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      const updated = await db.user.update({
        where: { id: payload.userId },
        data: updateData,
        select: {
          id: true, name: true, email: true, role: true,
          avatar: true, coverPhoto: true, rollNumber: true,
          batch: true, department: true, phone: true, bio: true,
          createdAt: true, updatedAt: true,
        },
      });

      return NextResponse.json({ user: updated });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
