const apiKey = ""; // Api key 

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "ask" && typeof msg.text === "string") {
    fetchAnswer(msg.text)
      .then((answer) => {
        sendResponse({ ok: true, answer });
      })
      .catch((err) => {
        console.error("fetchAnswer error:", err);
        sendResponse({ ok: false, error: String(err) });
      });

    return true;
  }
});

async function fetchAnswer(prompt) {
  if (!prompt) return "Keine Frage angegeben.";
  if (!apiKey || apiKey === "REPLACE_WITH_KEY_FOR_TESTS_ONLY") return "Fehler: Kein API-Key gesetzt.";

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Beantworte die Frage kurz und einfach." },
          { role: "user", content: prompt }
        ],
        max_tokens: 250
      })
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error("OpenAI Fehler", resp.status, text);
      return `API-Fehler ${resp.status}`;
    }

    const data = JSON.parse(text);
    const answer = data?.choices?.[0]?.message?.content;
    return answer ? answer.trim() : "Fehler: Keine Antwort erhalten";
  } catch (e) {
    console.error("Network/Parse error:", e);
    return "Netzwerkfehler beim Abruf";
  }
}
