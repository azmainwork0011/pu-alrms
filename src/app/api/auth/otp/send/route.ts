import { NextRequest, NextResponse } from 'next/server';

/**
 * Send OTP to phone number
 * Generates a 6-digit OTP, stores it in DB with expiry (5 minutes).
 * In production, integrate with Twilio/Vonage/AWS SNS.
 * In development, OTP is returned in response for testing.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone number format
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Use format: +8801XXXXXXXXX' }, { status: 400 });
    }

    const normalizedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const { db } = await import('@/lib/db');

    // Check if user exists with this phone
    let user = await db.user.findUnique({ where: { phone: normalizedPhone } });
    let isNewUser = false;

    if (user) {
      if (user.status === 'BANNED') {
        return NextResponse.json({ error: 'Account has been banned. Contact support.' }, { status: 403 });
      }
      if (user.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Account is suspended. Contact an administrator.' }, { status: 403 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiry },
      });
    } else {
      isNewUser = true;
      await db.user.create({
        data: {
          email: `${normalizedPhone.replace(/[^0-9]/g, '')}@phone.local`,
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

    // ── Production: Send OTP via SMS gateway ──
    // Uncomment and configure one of these when ready for production:

    // Option 1: Twilio
    // if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
    //   const twilio = require('twilio');
    //   const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    //   await client.messages.create({
    //     body: `Your PU-ALRMS verification code is: ${otp}. Valid for 5 minutes.`,
    //     from: process.env.TWILIO_PHONE,
    //     to: normalizedPhone,
    //   });
    // }

    // Option 2: Vonage (Nexmo)
    // if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
    //   const { Vonage } = require('@vonage/server-sdk');
    //   const vonage = new Vonage({ apiKey: process.env.VONAGE_API_KEY, apiSecret: process.env.VONAGE_API_SECRET });
    //   await vonage.sms.send({ to: normalizedPhone, from: 'PU-ALRMS', text: `Your PU-ALRMS code: ${otp}` });
    // }

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      isNewUser,
      message: isDev ? `OTP for testing: ${otp}` : 'Verification code sent to your phone',
      ...(isDev ? { devOtp: otp } : {}),
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error('[OTP Send] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
