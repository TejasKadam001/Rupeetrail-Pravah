import { NextRequest, NextResponse } from 'next/server';
import { findMatchingRoad, generateLocalRoadAnswer } from '@/lib/chatbotEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || '';

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const matchedRoad = findMatchingRoad(message);
    const deterministicAnswer = generateLocalRoadAnswer(message);

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are BMC PRAVAH Copilot, the official AI assistant for the Brihanmumbai Municipal Corporation (BMC) road audit and citizen accountability portal.
Answer the citizen's question accurately, concisely, and politely.
If the citizen is asking who was the contractor or who built a road, use the following verified municipal database extract:

${deterministicAnswer}

Citizen Question: "${message}"

Rules:
1. Always state the contractor name clearly and prominently.
2. Note whether the road is under Defect Liability Period (DLP) warranty (which means the contractor must fix defects for ₹0).
3. Tolerate spelling typos gracefully (e.g. "sv rod" = SV Road, "colaba causway" = Colaba Causeway).
4. Keep the tone helpful, professional, and civic-minded.`;

        // We try the working models
        const models = ['models/gemma-4-26b-a4b-it', 'models/gemini-2.5-flash-lite', 'models/gemini-flash-latest'];
        let aiResponseText = '';

        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
            const apiRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
              }),
              signal: AbortSignal.timeout(5000),
            });

            if (apiRes.ok) {
              const resData = await apiRes.json();
              const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                aiResponseText = text;
                break;
              }
            }
          } catch {
            // Try next model if timeout or error
          }
        }

        if (aiResponseText) {
          return NextResponse.json({
            reply: aiResponseText,
            matchedRoad,
            source: 'gemini',
          });
        }
      } catch (err) {
        console.error('Gemini API call failed, using deterministic ground truth:', err);
      }
    }

    // Ground truth fallback (always 100% accurate and instant)
    return NextResponse.json({
      reply: deterministicAnswer,
      matchedRoad,
      source: 'local_database',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
