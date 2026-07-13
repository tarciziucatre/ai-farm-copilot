// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export async function POST(request: Request) {
  try {
    const { message, fieldId, chatHistory } = await request.json();

    if (!message || !fieldId) {
      return NextResponse.json({ error: "Lipsește mesajul sau fieldId" }, { status: 400 });
    }

    // 1. Extragem datele actuale ale câmpului și ultimele recomandări calculate din DB
    const { data: field } = await supabase
      .from('fields')
      .select('name, crop_type, planting_date')
      .eq('id', fieldId)
      .single();

    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('title, description, urgency, evidence')
      .eq('field_id', fieldId);

    // 2. Construim contextul în timp real pentru AI (Context-Injected RAG)
    const activeRecommendationsText = recommendations && recommendations.length > 0
      ? recommendations.map(r => `- [${r.urgency}] ${r.title}: ${r.description} (Date suport: ${JSON.stringify(r.evidence)})`).join('\n')
      : "Nu există recomandări active sau alerte pentru astăzi.";

    const contextPrompt = `
Informații despre câmpul curent al fermierului:
- Nume Câmp: ${field?.name || 'Nespecificat'}
- Cultură: ${field?.crop_type || 'Porumb'}
- Data Plantării: ${field?.planting_date || 'Nespecificată'}

Recomandări active calculate de Motorul Agronomic de Regule astăzi:
${activeRecommendationsText}
`;

    // 3. Definim regulile stricte de comportament pentru AI (System Prompt)
    const systemInstruction = `
Ești "AI Farm Copilot", un asistent virtual de încredere, expert în agronomie pentru piața din Statele Unite.
Misiunea ta este să ajuți fermierul să înțeleagă recomandările agronomice primite și să îi răspunzi la întrebări legate de gestionarea culturii sale.

REGULI ABSOLUTE:
1. Bazează-ți răspunsurile STRICT pe datele din contextul oferit (câmp, cultură, recomandări active).
2. NU inventa prognoze meteo sau alerte noi pe care motorul de reguli nu le-a calculat.
3. Explică concepte complexe agronomice (precum derivă la stropire, îngheț timpuriu, stres termic) într-un limbaj simplu, direct și prietenos ("farmer-first").
4. Dacă utilizatorul îți cere recomandări de pesticide sau tratamente specifice care nu sunt în context, amintește-i că trebuie să consulte un agronom autorizat local, dar oferă-i sfaturi generale de bune practici.
5. Fii sincer și direct. Dacă nu ai date despre o anumită problemă în context, recunoaște acest lucru.
`;

    // 4. Pregătim mesajele pentru API-ul OpenAI (inclusiv istoricul conversației)
    const messages = [
      { role: "system", content: systemInstruction },
      { role: "system", content: `CONTEXT CURENT CÂMP:\n${contextPrompt}` },
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    // 5. Apelăm OpenAI API
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.3, // Temperatură mică pentru răspunsuri precise și deterministe
        max_tokens: 500
      })
    });

    if (!openAiResponse.ok) {
      const errData = await openAiResponse.json();
      throw new Error(`OpenAI Error: ${errData.error?.message || 'Eroare necunoscută'}`);
    }

    const aiData = await openAiResponse.json();
    const reply = aiData.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
