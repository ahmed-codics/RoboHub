import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getOutputText = (data: unknown) => {
  const response = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = response.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content.trim() : '';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let importId = '';
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const model = Deno.env.get('GROQ_MODEL') || 'llama-3.1-8b-instant';

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: 'Supabase function secrets are not configured.' }, 500);
    }

    if (!groqKey) {
      return jsonResponse({ error: 'GROQ_API_KEY is not configured for profile extraction.' }, 500);
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    const body = await req.json();
    const sourceType = body?.sourceType;
    const documentPath = String(body?.documentPath || '');
    const originalFilename = String(body?.originalFilename || '');
    const extractedText = String(body?.extractedText || '').slice(0, 60000);

    if (!['cv_pdf', 'linkedin_pdf'].includes(sourceType)) {
      return jsonResponse({ error: 'Invalid import source type.' }, 400);
    }

    if (!documentPath || !documentPath.startsWith(`${user.id}/`)) {
      return jsonResponse({ error: 'Invalid document path.' }, 400);
    }

    if (extractedText.trim().length < 100) {
      return jsonResponse({ error: 'The uploaded PDF does not contain enough readable text.' }, 400);
    }

    const { data: importRow, error: importError } = await supabase
      .from('profile_imports')
      .insert({
        user_id: user.id,
        source_type: sourceType,
        document_path: documentPath,
        original_filename: originalFilename || null,
        status: 'processing',
      })
      .select('id')
      .single();

    if (importError) {
      console.error('Failed to create profile import:', importError);
      return jsonResponse({ error: 'Failed to create profile import record.' }, 500);
    }

    importId = importRow.id;

    const prompt = `
Extract a marketplace freelancer profile from this ${sourceType === 'linkedin_pdf' ? 'LinkedIn profile PDF' : 'CV PDF'} text.

Rules:
- Robotics, ROS, embedded systems, automation, AI, electrical, mechanical, and software skills should be preserved.
- Keep bio client-facing and concise, 2-4 sentences.
- Use empty strings or empty arrays when data is missing.
- Do not invent employers, schools, certifications, dates, URLs, or locations.
- Add warnings for missing major sections or low-confidence extraction.
- Return one valid JSON object only. No markdown.
- JSON shape:
{
  "name": "",
  "headline": "",
  "location": "",
  "bio": "",
  "skills": [],
  "experience": [{"title":"","company":"","location":"","start_date":"","end_date":"","is_current":false,"description":""}],
  "education": [{"school":"","degree":"","field":"","start_year":"","end_year":"","description":""}],
  "certifications": [{"name":"","issuer":"","issued_at":"","credential_url":""}],
  "links": {"linkedin_url":"","website_url":""},
  "warnings": []
}

PDF text:
${extractedText}
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(35000),
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You extract structured freelancer profile data from CVs and LinkedIn PDFs. Return only JSON matching the schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const groqData = await groqResponse.json();
    if (!groqResponse.ok) {
      console.error('Groq extraction failed:', groqData);
      throw new Error(groqData?.error?.message || 'AI extraction failed.');
    }

    const outputText = getOutputText(groqData);
    if (!outputText) {
      throw new Error('AI extraction returned an empty response.');
    }

    let profile;
    try {
      profile = JSON.parse(outputText);
    } catch (error) {
      console.error('Invalid extraction JSON:', outputText, error);
      throw new Error('AI extraction returned invalid JSON.');
    }

    const { error: updateError } = await supabase
      .from('profile_imports')
      .update({
        status: 'completed',
        extracted_json: profile,
        error_message: null,
      })
      .eq('id', importId);

    if (updateError) {
      console.error('Failed to save extraction JSON:', updateError);
      throw new Error('Failed to save extracted profile.');
    }

    return jsonResponse({ importId, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error.';
    console.error('Error in extract-profile-from-document:', error);

    if (supabase && importId) {
      await supabase
        .from('profile_imports')
        .update({ status: 'failed', error_message: message })
        .eq('id', importId);
    }

    return jsonResponse({ error: message }, 500);
  }
});
