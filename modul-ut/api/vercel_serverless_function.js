export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Mengambil Kunci API rahasia dari Environment Variable Server
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY belum dikonfigurasi pada Environment Variable server hosting.' 
    });
  }

  try {
    const { systemPrompt, userPrompt, imageParts } = req.body;
    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const parts = [{ text: userPrompt || "" }];
    if (imageParts && Array.isArray(imageParts)) {
      imageParts.forEach(img => {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      });
    }

    const payload = {
      contents: [{ role: "user", parts: parts }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.85 },
      tools: [{ "google_search": {} }]
    };

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      return res.status(apiResponse.status).json({ 
        error: errorData.error?.message || 'Gagal memproses permintaan ke Google Gemini API.' 
      });
    }

    const data = await apiResponse.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respons dari AI.";

    return res.status(200).json({ text: resultText });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  }
}