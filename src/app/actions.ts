"use server";

export async function checkGrammar(quote: string) {
  try {
    const textPrompt = `Fix the grammar and spelling of this quote. Only return the corrected quote, no other text or explanation: "${quote}"`;
    const textRes = await fetch(`https://text.pollinations.ai/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that corrects grammar and spelling. Only return the corrected quote, no other text or explanation.' },
          { role: 'user', content: quote }
        ],
        model: 'openai'
      })
    });
    
    if (!textRes.ok) {
      console.error("Pollinations API error:", await textRes.text());
      return quote; // Fallback to original
    }
    
    let correctedText = await textRes.text();
    
    // Sometimes it returns JSON if we hit the OpenAI compatible endpoint
    try {
      const json = JSON.parse(correctedText);
      if (json.error) return quote;
      // If it's standard OpenAI format:
      if (json.choices && json.choices.length > 0) {
        correctedText = json.choices[0].message.content;
      }
    } catch(e) {
      // Not JSON, just text
    }

    // Remove surrounding quotes if AI adds them
    correctedText = correctedText.replace(/^["']|["']$/g, '').trim();
    return correctedText || quote;
  } catch (err) {
    console.error("Error in checkGrammar:", err);
    return quote;
  }
}

export async function fetchImageAsBase64(prompt: string) {
  try {
    const bgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
    const res = await fetch(bgUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error("Error fetching image as base64:", err);
    throw err;
  }
}
