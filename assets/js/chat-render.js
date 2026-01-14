(async function () {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function renderMessage(msg) {
    const body = escapeHtml(msg.content || "").replace(/\n/g, "<br>");
    const attachments = (msg.attachments || [])
      .map(a => {
        if (a.type === "image") {
          return `<div class="dmsg__attach"><img loading="lazy" src="${a.url}" alt="attachment"></div>`;
        }
        return "";
      })
      .join("");

    // msg.avatar should be a usable URL/path
    const avatar = msg.avatar || "/assets/pfps/default.png";

    return `
      <div class="dmsg">
        <div class="dmsg__avatar">
          <img src="${escapeHtml(avatar)}" alt="${escapeHtml(msg.author)} avatar">
        </div>
        <div>
          <div class="dmsg__head">
            <span class="dmsg__name">${escapeHtml(msg.author || "Unknown")}</span>
            <span class="dmsg__time">${formatTime(msg.ts)}</span>
          </div>
          <div class="dmsg__body">${body}${attachments}</div>
        </div>
      </div>
    `;
  }

  async function initBox(box) {
    const src = box.getAttribute("data-chat-src");
    const title = box.getAttribute("data-title") || "Chat";

    const titleEl = box.querySelector(".discordbox__title");
    const logEl = box.querySelector(".discordbox__log");

    if (titleEl) titleEl.textContent = title;

    if (!src) {
      if (logEl) logEl.innerHTML = `<div class="dstatus"><strong>No data-chat-src set.</strong></div>`;
      return;
    }
    if (!logEl) {
      console.error("discordbox missing .discordbox__log", box);
      return;
    }

    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      const limitAttr = box.getAttribute("data-limit");
      const limit = limitAttr ? parseInt(limitAttr, 10) : 0;

      let msgs = (data.messages || [])
        .slice()
        .sort((a, b) => new Date(a.ts) - new Date(b.ts));

      if (limit > 0) msgs = msgs.slice(Math.max(0, msgs.length - limit));

      logEl.innerHTML = msgs.map(renderMessage).join("");
      logEl.scrollTop = logEl.scrollHeight;
    } catch (e) {
      logEl.innerHTML = `<div class="dstatus"><strong>Couldn’t load chat.</strong> ${escapeHtml(String(e))}</div>`;
    }
  }

  document.querySelectorAll(".discordbox[data-chat-src]").forEach(initBox);
})();
