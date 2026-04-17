(function () {
  if (window.__chatgpt_listener_installed) return;
  window.__chatgpt_listener_installed = true;

  let selectionTimer = null;
  let lastSelectionText = "";
  let activeRequestId = 0;

  function removeChatElements() {
    document.getElementById("chatgpt-input")?.remove();
    document.getElementById("chatgpt-manual-answer")?.remove();
  }

  function removeAnswerOverlay() {
    document.getElementById("chatgpt-extension-answer")?.remove();
  }

  function getOrCreateAnswerOverlay() {
    let overlay = document.getElementById("chatgpt-extension-answer");
    let content = document.getElementById("chatgpt-extension-answer-content");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "chatgpt-extension-answer";
      Object.assign(overlay.style, {
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(255, 255, 255, 0.96)",
        padding: "8px 10px",
        zIndex: 2147483647,
        fontSize: "12px",
        maxWidth: "320px",
        borderRadius: "4px",
        color: "#222",
        lineHeight: "1.4"
      });

      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = "x";
      btn.setAttribute("aria-label", "Antwort schliessen");
      Object.assign(btn.style, {
        marginLeft: "8px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        float: "right",
        fontSize: "13px",
        lineHeight: "1",
        color: "#777",
        padding: "0"
      });
      btn.addEventListener("click", removeAnswerOverlay);

      content = document.createElement("div");
      content.id = "chatgpt-extension-answer-content";
      content.style.whiteSpace = "pre-wrap";

      overlay.appendChild(btn);
      overlay.appendChild(content);
      document.body.appendChild(overlay);
    }

    return content;
  }

  function setOverlayText(text) {
    const content = getOrCreateAnswerOverlay();
    content.textContent = text;
  }

  async function askForSelection(text) {
    activeRequestId += 1;
    const requestId = activeRequestId;
    setOverlayText("Lade Antwort...");

    try {
      const resp = await chrome.runtime.sendMessage({ type: "ask", text });
      if (requestId !== activeRequestId) return;

      if (resp?.ok) {
        setOverlayText(resp.answer || "Keine Antwort erhalten.");
      } else {
        setOverlayText("Fehler: " + (resp?.error || "keine Antwort"));
      }
    } catch (err) {
      if (requestId !== activeRequestId) return;
      setOverlayText("Fehler bei Anfrage");
    }
  }

  function scheduleSelectionRequest() {
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(() => {
      const text = window.getSelection?.().toString().trim() || "";

      if (!text) {
        lastSelectionText = "";
        return;
      }

      if (text === lastSelectionText) return;

      lastSelectionText = text;
      askForSelection(text);
    }, 350);
  }

  document.addEventListener("mouseup", scheduleSelectionRequest);
  document.addEventListener("keyup", scheduleSelectionRequest);

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable;

    if (e.key?.toLowerCase() === "x" && !isEditable && document.getElementById("chatgpt-extension-answer")) {
      removeChatElements();
      removeAnswerOverlay();
      return;
    }

    if (e.key?.toLowerCase() === "ä") {
      if (document.getElementById("chatgpt-input")) return;

      const input = document.createElement("input");
      input.id = "chatgpt-input";
      input.type = "text";
      input.placeholder = "Frag ChatGPT... (Enter zum Senden, x zum Schliessen)";
      Object.assign(input.style, {
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 2147483646,
        fontSize: "12px",
        padding: "6px",
        width: "300px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        background: "#fff",
        color: "#000"
      });

      const answerDiv = document.createElement("div");
      answerDiv.id = "chatgpt-manual-answer";
      Object.assign(answerDiv.style, {
        position: "fixed",
        top: "44px",
        left: "10px",
        maxWidth: "360px",
        background: "#fff",
        padding: "8px 10px",
        boxShadow: "0 0 8px rgba(0,0,0,0.15)",
        fontSize: "12px",
        zIndex: 2147483646,
        borderRadius: "4px",
        color: "#000"
      });

      document.body.appendChild(input);
      document.body.appendChild(answerDiv);
      input.focus();

      input.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
          const q = input.value.trim();
          if (!q) return;

          answerDiv.textContent = "Lade Antwort...";
          try {
            const resp = await chrome.runtime.sendMessage({ type: "ask", text: q });
            if (resp?.ok) {
              answerDiv.textContent = resp.answer;
            } else {
              answerDiv.textContent = "Fehler: " + (resp?.error || "keine Antwort");
            }
          } catch (err) {
            answerDiv.textContent = "Fehler bei Anfrage";
          }
        } else if (event.key?.toLowerCase() === "x") {
          removeChatElements();
        }
      });
    }
  });
})();
