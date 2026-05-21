import { NextRequest, NextResponse } from 'next/server';

/**
 * Send OTP to phone number
 * Generates a 6-digit OTP, stores it in DB with expiry (5 minutes)
 * In production, this would integrate with an SMS gateway (Twilio, Vonage, etc.)
 * For development, the OTP is returned in the response (for testing)
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone number format (basic: digits, 10-15 chars, optional + prefix)
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const normalizedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const { db } = await import('@/lib/db');

    // Check if user exists with this phone
    let user = await db.user.findUnique({ where: { phone: normalizedPhone } });

    if (user) {
      if (user.status === 'BANNED') {
        return NextResponse.json({ error: 'Account has been banned. Contact support.' }, { status: 403 });
      }
      if (user.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Account is suspended. Contact an administrator.' }, { status: 403 });
      }

      // Update OTP for existing user
      await db.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiry },
      });
    } else {
      // Create a new user with just the phone number (will complete on OTP verify)
      await db.user.create({
        data: {
          email: `${normalizedPhone}@phone.local`,
          name: name || 'New User',
          password: '',
          role: 'STUDENT',
          authProvider: 'PHONE',
          phone: normalizedPhone,
          otpCode: otp,
          otpExpiry,
        },
      });
    }

    // In production: send OTP via SMS gateway
    // For development: return OTP in response so the user can test
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: isDev ? `OTP for testing: ${otp}` : 'OTP sent to your phone',
      // In development, include the OTP for testing purposes
      ...(isDev ? { devOtp: otp } : {}),
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error('[OTP Send] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
