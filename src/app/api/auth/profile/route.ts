import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// ─── Allowed image MIME types ────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Output dimensions (must match frontend constants) ──
const AVATAR_W = 150;
const AVATAR_H = 150;
const COVER_W = 1500;
const COVER_H = 500;

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
      // ════════════════════════════════════════════════════
      // FILE UPLOAD — with sharp resize & optimization
      // ════════════════════════════════════════════════════
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = formData.get('type') as string | null;

      if (!file || !type) {
        return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
      }

      if (!['avatar', 'cover'].includes(type)) {
        return NextResponse.json({ error: 'Type must be "avatar" or "cover"' }, { status: 400 });
      }

      // ── Strict MIME type validation ──
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' },
          { status: 400 },
        );
      }

      // ── File size validation ──
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Image must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
          { status: 400 },
        );
      }

      // ── Path traversal protection ──
      const safeUserId = payload.userId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeUserId || safeUserId !== payload.userId) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      // ── Ensure upload directory exists ──
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles', safeUserId);
      await mkdir(uploadDir, { recursive: true });

      // ── Read file buffer ──
      const bytes = await file.arrayBuffer();
      const inputBuffer = Buffer.from(bytes);

      // ── Determine output dimensions ──
      const outW = type === 'avatar' ? AVATAR_W : COVER_W;
      const outH = type === 'avatar' ? AVATAR_H : COVER_H;

      // ── Process with sharp: resize + convert to JPEG ──
      let processedBuffer: Buffer;
      try {
        processedBuffer = await sharp(inputBuffer)
          .resize(outW, outH, {
            fit: 'cover',        // Crop to fill — no distortion
            position: 'center',  // Center the crop
          })
          .jpeg({
            quality: 85,         // Good quality, small file size
            mozjpeg: true,       // Use mozjpeg for better compression
            chromaSubsampling: '4:2:0',
          })
          .toBuffer();
      } catch (sharpErr) {
        console.error('Sharp processing error:', sharpErr);
        return NextResponse.json(
          { error: 'Failed to process image. Please try a different image.' },
          { status: 400 },
        );
      }

      // ── Generate filename ──
      const fileName = type === 'avatar' ? 'avatar.jpg' : 'cover.jpg';
      const filePath = path.join(uploadDir, fileName);

      // ── Write to disk ──
      await writeFile(filePath, processedBuffer);

      // ── URL path for frontend ──
      const fileUrl = `/uploads/profiles/${safeUserId}/${fileName}`;

      // ── Update user in database ──
      const updateData = type === 'avatar' ? { avatar: fileUrl } : { coverPhoto: fileUrl };
      await db.user.update({
        where: { id: payload.userId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        url: fileUrl,
        dimensions: { width: outW, height: outH },
        size: processedBuffer.length,
      });
    } else {
      // ════════════════════════════════════════════════════
      // JSON UPDATE — profile text fields
      // ════════════════════════════════════════════════════
      const body = await req.json();
      const { name, rollNumber, batch, department, phone, bio } = body;

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
