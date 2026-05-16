import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI, isZAIReady } from '@/lib/zai';

// ═══════════════════════════════════════════════════════════════════
// AI DIAGNOSTICS — Self-test endpoint for system health monitoring
// Tests: AI chat, math accuracy, code generation, research
// Admin/Teacher only access.
// ═══════════════════════════════════════════════════════════════════

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  latency: number;
  details: string;
  expected?: string;
  actual?: string;
}

async function runTest(name: string, testFn: () => Promise<{ pass: boolean; details: string; expected?: string; actual?: string }>): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await testFn();
    return { name, status: result.pass ? 'pass' : 'fail', latency: Date.now() - start, ...result };
  } catch (err: any) {
    return { name, status: 'fail', latency: Date.now() - start, details: err?.message || 'Unknown error' };
  }
}

export async function GET(req: Request) {
  // Auth check — admin/teacher only
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'DEVELOPER'].includes(payload.role as string)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const results: TestResult[] = [];

  // ── Test 1: SDK Initialization ──
  results.push(await runTest('SDK Initialization', async () => {
    const ready = await isZAIReady();
    return { pass: ready, details: ready ? 'Z-AI SDK initialized successfully' : 'Z-AI SDK failed to initialize' };
  }));

  // ── Test 2: Simple Q&A ──
  results.push(await runTest('Simple Q&A', async () => {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a helpful assistant. Respond with ONLY the answer, nothing else.' },
        { role: 'user', content: 'What is the capital of France?' },
      ],
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content || '';
    const pass = text.toLowerCase().includes('paris');
    return { pass, details: pass ? 'Correct answer received' : 'Unexpected answer', expected: 'Paris', actual: text.substring(0, 100) };
  }));

  // ── Test 3: Math Accuracy ──
  results.push(await runTest('Math Accuracy', async () => {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a math expert. Solve step by step. Put your final numeric answer on the LAST line in format: ANSWER: <number>' },
        { role: 'user', content: 'What is 17 * 23?' },
      ],
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content || '';
    const hasAnswer = text.includes('391') || text.match(/ANSWER.*391/i);
    return { pass: hasAnswer, details: hasAnswer ? 'Math answer correct' : 'Math answer may be incorrect', expected: '391', actual: text.substring(0, 150) };
  }));

  // ── Test 4: Code Generation ──
  results.push(await runTest('Code Generation', async () => {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a Python expert. Write clean, correct code. Use markdown code blocks.' },
        { role: 'user', content: 'Write a Python function to reverse a string.' },
      ],
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content || '';
    const hasCode = text.includes('```') && text.includes('def ') && text.includes('return');
    return { pass: hasCode, details: hasCode ? 'Valid Python code generated' : 'No valid code block found', actual: text.substring(0, 150) };
  }));

  // ── Test 5: Research Summary ──
  results.push(await runTest('Research Summary', async () => {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an academic research assistant. Provide a brief, structured summary.' },
        { role: 'user', content: 'Explain machine learning in 2-3 sentences.' },
      ],
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content || '';
    const hasContent = text.length > 50 && (text.includes('learn') || text.includes('data') || text.includes('algorithm') || text.includes('model'));
    return { pass: hasContent, details: hasContent ? 'Meaningful research summary' : 'Response too short', actual: text.substring(0, 150) };
  }));

  // ── Test 6: Image Generation ──
  results.push(await runTest('Image Generation', async () => {
    const zai = await getZAI();
    const response = await zai.images.generations.create({
      prompt: 'A red circle on white background',
      size: '1024x1024',
    });
    const hasImage = response?.data?.[0]?.base64 && response.data[0].base64.length > 1000;
    return { pass: !!hasImage, details: hasImage ? `Image generated (${response.data[0].base64.length} bytes)` : 'No image data' };
  }));

  // ── Test 7: Vision Analysis ──
  results.push(await runTest('Vision Analysis', async () => {
    const zai = await getZAI();
    const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const completion = await zai.chat.completions.createVision({
      model: 'vision',
      messages: [
        { role: 'system', content: 'Describe what you see. Be brief.' },
        { role: 'user', content: [
          { type: 'text', text: 'What color is this image?' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${redPixelBase64}` } },
        ]},
      ],
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content || '';
    return { pass: text.length > 10, details: text.length > 10 ? 'Vision analysis working' : 'No response', actual: text.substring(0, 100) };
  }));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: failed === 0 ? 'healthy' : 'degraded',
    summary: { total: results.length, passed, failed, totalLatencyMs: totalLatency },
    tests: results,
  });
}
