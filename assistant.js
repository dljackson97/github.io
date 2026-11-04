// Website assistant: chat button and panel (agent/SPEC.md §3, §6).
//
// To add it to a page, put these in the page's <head>:
//   <link rel="stylesheet" href="/assistant.css" />
//   <script src="/assistant.js" defer></script>
//
// Privacy: the conversation lives only in this page's memory. Nothing is saved
// in the browser, and it's gone when the visitor closes or leaves the page.

(function () {
  // On a local preview, talk to the Worker running on this computer
  const ENDPOINT = ["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://localhost:8787/chat"
    : "https://clementine-assistant.clementinespeech.workers.dev/chat";

  const PHONE_DISPLAY = "(757) 636-0746";
  const PHONE_LINK = "tel:+17576360746";
  const CONSULT_LINK = "/contact#free-consultation";
  const MAX_CHARS = 500;
  const MAX_VISITOR_MESSAGES = 10;
  const REQUEST_TIMEOUT_MS = 30000;
  // Replies appear word by word (the full reply has already arrived; this is
  // only how it's shown). Skipped for visitors who prefer reduced motion.
  const REVEAL_MS_PER_WORD = 35;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phones and tablets: don't pop the keyboard up until the visitor taps the box
  const touchScreen = window.matchMedia("(pointer: coarse)").matches;

  // Pre-chat notice (SPEC §3), shown as two paragraphs so the AI disclaimer
  // stands on its own
  const NOTICE =
    "Hi! I can answer general questions about Clementine Speech Therapy. Please don't share names, health details, or other personal information here. For anything specific about you or your child, please reach out to Aemelia for a free consultation. You can call (757) 636-0746 or use our Contact Us page.";
  const NOTICE_DISCLAIMER =
    "This assistant uses AI and can make mistakes. It doesn't give clinical advice.";
  const PERSONAL_INFO_WARNING =
    "It looks like your message includes a phone number, email address or date. To protect your privacy, please remove it before sending. For anything specific about you or your child, please reach out to Aemelia for a free consultation at (757) 636-0746.";
  // Same text as the Worker's outage message, for when the Worker can't be reached
  const OUTAGE = "I'm having trouble right now. Please call (757) 636-0746.";
  const ENDED_PLACEHOLDER = "This chat has ended. Call or book a free consultation for more.";

  // Obvious personal details, caught before a message is sent (SPEC §3)
  const MONTHS = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const PERSONAL_INFO = [
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, // phone
    /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/, // 3/2/21
    /\b\d{4}-\d{1,2}-\d{1,2}\b/, // 2021-03-02
    new RegExp(`\\b${MONTHS}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, "i"), // March 2
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTHS}(?![a-z])`, "i"), // 2nd of March
  ];

  // Links the assistant may send. Anything else stays plain text.
  const LINK = /(^|[\s(])(\/(?:faqs(?:#[a-z0-9-]+)?|about|services|contact))(?=$|[\s.,;:!?)])/g;
  // What visitors see instead of the raw path (same names as the site menu).
  // FAQ links still open the exact question.
  const LINK_LABELS = {
    "/faqs": "FAQs",
    "/about": "About Us",
    "/services": "Services",
    "/contact": "Contact Us",
  };

  // Conversation state, in memory only
  const history = []; // { role: "user" | "assistant", content }
  const counted = new Set(); // topics and flags this conversation has counted
  let accepted = false;
  let busy = false;
  let ended = false;

  // ---------------------------------------------------------------- markup
  // Static markup only. Visitor and assistant text is always added with
  // textContent, never as HTML.

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "assistant-launcher";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "assistant-panel");
  launcher.innerHTML =
    '<svg class="assistant-launcher-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>' +
    "<span>Ask a question</span>";

  const panel = document.createElement("section");
  panel.id = "assistant-panel";
  panel.className = "assistant-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "assistant-title");
  panel.hidden = true;
  panel.innerHTML = `
    <header class="assistant-header">
      <div>
        <h2 id="assistant-title" class="assistant-title" tabindex="-1">Ask Clementine</h2>
        <p class="assistant-subtitle">AI assistant · general questions</p>
      </div>
      <div class="assistant-header-end">
        <img src="/images/CLEMENTINELOGO-nowords.png" alt="" class="assistant-logo" />
        <button type="button" class="assistant-close" aria-label="Close assistant">&#x2715;</button>
      </div>
    </header>
    <div class="assistant-notice">
      <div class="assistant-notice-copy">
        <p class="assistant-notice-text"></p>
        <p class="assistant-notice-text assistant-notice-disclaimer"></p>
      </div>
      <button type="button" class="btn btn-primary assistant-accept">I understand, start chatting</button>
    </div>
    <div class="assistant-chat" hidden>
      <div class="assistant-log" role="log" aria-live="polite" aria-relevant="additions"></div>
      <form class="assistant-form" novalidate>
        <p class="assistant-warning" role="alert" hidden></p>
        <label for="assistant-input" class="assistant-sr-only">Your question</label>
        <textarea id="assistant-input" class="assistant-input" rows="2"
          placeholder="Ask a general question…" aria-describedby="assistant-count"></textarea>
        <div class="assistant-form-row">
          <span id="assistant-count" class="assistant-count">0/${MAX_CHARS}</span>
          <button type="submit" class="btn btn-primary assistant-send" disabled>Send</button>
        </div>
      </form>
    </div>`;

  document.body.append(launcher, panel);
  // Lets assistant.css lift the site's welcome popup above the chat button
  document.body.classList.add("has-assistant");

  const $ = (selector) => panel.querySelector(selector);
  const notice = $(".assistant-notice");
  const chat = $(".assistant-chat");
  const log = $(".assistant-log");
  const form = $(".assistant-form");
  const input = $(".assistant-input");
  const count = $(".assistant-count");
  const sendButton = $(".assistant-send");
  const warning = $(".assistant-warning");
  $(".assistant-notice-text").textContent = NOTICE;
  $(".assistant-notice-disclaimer").textContent = NOTICE_DISCLAIMER;

  // ---------------------------------------------------------- open / close

  function open() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    launcher.classList.add("is-hidden");
    // Once the chat has been opened, the welcome popup stays away for the
    // rest of the visit (its timer could otherwise put it on top)
    document.body.classList.add("assistant-used");
    hideWelcomePopup();
    fitToScreen();
    if (touchScreen) {
      $(".assistant-title").focus(); // no keyboard, whole card visible
    } else {
      (accepted ? input : $(".assistant-accept")).focus();
    }
  }

  // Phones: keep the whole card inside the part of the screen the keyboard
  // doesn't cover. The keyboard's size is only known while the page runs,
  // so it's passed to assistant.css as two variables.
  const viewport = window.visualViewport;
  function fitToScreen() {
    if (!viewport || panel.hidden) return;
    panel.style.setProperty("--assistant-vv-top", `${viewport.offsetTop}px`);
    panel.style.setProperty("--assistant-vv-height", `${viewport.height}px`);
  }
  viewport?.addEventListener("resize", fitToScreen);
  viewport?.addEventListener("scroll", fitToScreen);

  function close() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.classList.remove("is-hidden");
    launcher.focus();
  }

  // The site's welcome popup shares the bottom-right corner; don't show both
  function hideWelcomePopup() {
    const popup = document.getElementById("welcome-popup");
    if (!popup) return;
    popup.classList.remove("is-visible");
    try {
      sessionStorage.setItem("popup-dismissed", "1");
    } catch {}
  }

  launcher.addEventListener("click", open);
  $(".assistant-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });

  $(".assistant-accept").addEventListener("click", () => {
    accepted = true;
    notice.hidden = true;
    chat.hidden = false;
    if (!touchScreen) input.focus();
  });

  // ------------------------------------------------------------- the input

  // Counts characters the way a person would (an emoji counts as 1), the same
  // way the Worker does
  const charCount = (text) => [...text].length;

  function updateInput() {
    const n = charCount(input.value);
    count.textContent = `${n}/${MAX_CHARS}`;
    count.classList.toggle("is-over", n > MAX_CHARS);
    sendButton.disabled = busy || ended || n === 0 || n > MAX_CHARS || input.value.trim() === "";
  }

  input.addEventListener("input", () => {
    warning.hidden = true;
    updateInput();
  });

  // Enter sends; Shift+Enter adds a new line
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) form.requestSubmit();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy || ended || charCount(text) > MAX_CHARS) return;
    if (PERSONAL_INFO.some((pattern) => pattern.test(text))) {
      warning.textContent = PERSONAL_INFO_WARNING;
      warning.hidden = false;
      return;
    }
    send(text);
  });

  // -------------------------------------------------------------- messages

  function addUserMessage(text) {
    const { message, body } = messageShell("user");
    body.textContent = text;
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }

  // Shows the assistant's reply word by word, then its hand-off buttons.
  // Scrolling follows the reply until its first line reaches the top of the
  // chat, then stays put so the visitor reads from the beginning.
  async function addBotMessage(text, handoff) {
    const { message, body } = messageShell("bot");
    log.setAttribute("aria-busy", "true"); // screen readers wait for the full reply
    log.append(message);
    const keepTopInView = () => {
      log.scrollTop = Math.min(message.offsetTop - 12, log.scrollHeight - log.clientHeight);
    };
    keepTopInView();
    for (const piece of replyPieces(text)) {
      body.append(piece);
      if (!reducedMotion) {
        keepTopInView();
        await new Promise((resolve) => setTimeout(resolve, REVEAL_MS_PER_WORD));
      }
    }
    if (handoff === "consult" || handoff === "phone") {
      message.append(handoffButtons(handoff));
    }
    keepTopInView();
    log.setAttribute("aria-busy", "false");
  }

  function messageShell(who) {
    const message = document.createElement("div");
    message.className = `assistant-msg assistant-msg--${who}`;
    const label = document.createElement("span");
    label.className = "assistant-sr-only";
    label.textContent = who === "user" ? "You said:" : "Assistant:";
    const body = document.createElement("p");
    body.className = "assistant-msg-text";
    message.append(label, body);
    return { message, body };
  }

  // Splits a reply into words and links, in order. The assistant's allowed
  // links (/faqs#..., /about, ...) become real links with friendly names;
  // they open in a new tab so the conversation isn't lost.
  function replyPieces(text) {
    const pieces = [];
    const addWords = (s) => {
      for (const word of s.match(/\S+\s*|\s+/g) ?? []) pieces.push(document.createTextNode(word));
    };
    let last = 0;
    for (const match of text.matchAll(LINK)) {
      const start = match.index + match[1].length;
      addWords(text.slice(last, start));
      const link = document.createElement("a");
      link.href = match[2];
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "assistant-link";
      link.textContent = LINK_LABELS[match[2].split("#")[0]];
      pieces.push(link);
      last = start + match[2].length;
    }
    addWords(text.slice(last));
    return pieces;
  }

  // "consult" shows booking first; "phone" shows calling first
  function handoffButtons(handoff) {
    const row = document.createElement("div");
    row.className = "assistant-handoff";
    const consult = document.createElement("a");
    consult.href = CONSULT_LINK;
    consult.className = "btn assistant-handoff-btn";
    consult.textContent = "Book a free consultation";
    const call = document.createElement("a");
    call.href = PHONE_LINK;
    call.className = "btn assistant-handoff-btn";
    call.textContent = `Call ${PHONE_DISPLAY}`;
    const [primary, secondary] = handoff === "phone" ? [call, consult] : [consult, call];
    primary.classList.add("btn-primary");
    secondary.classList.add("btn-ghost");
    row.append(primary, secondary);
    return row;
  }

  function addTyping() {
    const typing = document.createElement("div");
    typing.className = "assistant-msg assistant-msg--bot assistant-typing";
    typing.innerHTML =
      '<span class="assistant-sr-only">The assistant is typing</span>' +
      '<span class="assistant-dot" aria-hidden="true"></span>' +
      '<span class="assistant-dot" aria-hidden="true"></span>' +
      '<span class="assistant-dot" aria-hidden="true"></span>';
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    return typing;
  }

  // ------------------------------------------------------------ sending

  async function send(text) {
    addUserMessage(text);
    history.push({ role: "user", content: text });
    input.value = "";
    busy = true;
    updateInput();
    const typing = addTyping();

    const answer = await ask();
    typing.remove();

    if (answer.topic === null) {
      // A fixed message from the Worker (too long, rate limit, turn limit,
      // outage, declined): this exchange never reached the AI, so it isn't
      // part of the conversation sent next time
      history.pop();
      const visitorMessages = history.filter((m) => m.role === "user").length;
      if (visitorMessages >= MAX_VISITOR_MESSAGES) {
        endChat();
      } else if (!input.value) {
        input.value = text; // let them shorten or retry it
      }
    } else {
      history.push({ role: "assistant", content: answer.reply });
      counted.add(answer.topic);
      if (answer.flag && answer.flag !== "none") counted.add(answer.flag);
    }

    await addBotMessage(answer.reply, answer.handoff);
    busy = false;
    updateInput();
    if (!ended) input.focus();
  }

  // Returns { reply, topic, handoff, flag }, or the outage message if the
  // Worker can't be reached or answers with something unexpected
  async function ask() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, countedTopics: [...counted] }),
        signal: controller.signal,
      });
      const answer = await res.json();
      if (typeof answer.reply !== "string" || answer.reply.trim() === "") throw new Error();
      return answer;
    } catch {
      return { reply: OUTAGE, topic: null, handoff: "phone", flag: null };
    } finally {
      clearTimeout(timer);
    }
  }

  function endChat() {
    ended = true;
    input.disabled = true;
    input.placeholder = ENDED_PLACEHOLDER;
  }
})();
