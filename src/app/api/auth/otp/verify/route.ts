import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify OTP and complete login
 * Verifies the OTP stored in DB, clears it, and returns JWT + user.
 * Returns `isNewUser: true` if the user was just created (needs profile setup).
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, otp, name } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const normalizedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    const { db } = await import('@/lib/db');

    const user = await db.user.findUnique({ where: { phone: normalizedPhone } });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 410 });
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 401 });
    }

    // Determine if this is a new user (no batch/department set yet)
    const isNewUser = !user.batch && !user.department;

    // Clear OTP and mark phone as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        phoneVerified: true,
        lastLogin: new Date(),
        ...(name && name.trim().length >= 2 ? { name: name.trim() } : {}),
      },
    });

    // Generate JWT
    let token: string;
    try {
      const { signToken } = await import('@/lib/jwt');
      token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    } catch {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        userId: user.id, email: user.email, role: user.role, name: user.name,
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      }));
      let sig = 0;
      const secret = process.env.JWT_SECRET || 'pu-alrms-secret-2024';
      const combined = header + '.' + payload + '.' + secret;
      for (let i = 0; i < combined.length; i++) sig = ((sig << 5) - sig + combined.charCodeAt(i)) | 0;
      token = header + '.' + payload + '.' + btoa(String(Math.abs(sig)));
    }

    const now = new Date().toISOString();
    return NextResponse.json({
      token,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        status: user.status || 'ACTIVE',
        avatar: user.avatar || null,
        coverPhoto: user.coverPhoto || null,
        rollNumber: user.rollNumber || null,
        batch: user.batch || null,
        department: user.department || null,
        phone: user.phone || null,
        bio: user.bio || null,
        authProvider: user.authProvider,
        lastLogin: now,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : now,
        updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : now,
      },
    });
  } catch (error) {
    console.error('[OTP Verify] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'OTP verification failed. Please try again.' }, { status: 500 });
  }
}
