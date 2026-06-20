import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  
  if (!prompt) {
    return new Response('Missing prompt', { status: 400 });
  }

  try {
    const bgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
    const res = await fetch(bgUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return NextResponse.json({ base64: `data:image/jpeg;base64,${base64}` });
  } catch (err) {
    console.error(err);
    return new Response('Error proxying image', { status: 500 });
  }
}
