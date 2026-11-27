/* 五年级 explainer videos: a 「看讲解」 / "Watch lesson" button on each flower that has a video, playing it in an in-page HTML5 player.
   - Which videos exist comes from manifest.json on the videos site (window.GARDEN_VIDEO_BASES, first that answers wins), fetched once.
     A flower without a video for the language on screen shows no button. New videos need only a videos-site push.
   - Language follows the 中文 / English switch; 华文 / 高级华文 flowers always use the Chinese video.
   - The <video> element is only created when the child taps the button (preload="none"), so the garden page stays light.
   - "Watched" marks are kept on this device under WATCH_KEY (P5 only); they never touch the practice record. */
(function () {
  "use strict";
  const I = window.GardenI18n, DICT = window.GARDEN_I18N && window.GARDEN_I18N.dict;
  if (!I || !DICT || typeof window.openModal !== "function") return;
  const WATCH_KEY = "anna-garden.p5.watched.v1";
  Object.assign(DICT.zh, { "vid.watch": "▶ 看讲解", "vid.watched": "看过了", "vid.kicker": "讲解视频", "vid.back": "← 返回", "vid.min": "约 {m} 分钟",
    "vid.tip": "先看讲解，再去练习。画面上有字幕；也可以暂停、拖动进度条。", "vid.err": "视频暂时打不开。请检查网络，稍后再试。", "vid.practice": "去练习", "vid.mark": "看过讲解" });
  Object.assign(DICT.en, { "vid.watch": "▶ Watch lesson", "vid.watched": "Watched", "vid.kicker": "Lesson video", "vid.back": "← Back", "vid.min": "about {m} min",
    "vid.tip": "Watch the lesson first, then practise. The video has subtitles; you can pause or drag the bar.", "vid.err": "The video can't be opened right now. Please check the internet and try again later.",
    "vid.practice": "Go and practise", "vid.mark": "Lesson watched" });
  const T = (k, v) => I.T(k, v);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const BASES = (window.GARDEN_VIDEO_BASES || []).filter(Boolean);
  let man = null, base = "", loading = null;
  function load() {
    if (loading) return loading;
    loading = (async () => {
      if (location.protocol === "file:") return null;   // a page opened from disk (local preview) has no videos site
      for (const b of BASES) {
        try { const r = await fetch(b + "manifest.json", { cache: "no-cache" }); if (!r.ok) continue; const j = await r.json();
          if (j && j.version === 1 && j.videos) { man = j; base = b + (j.base || ""); return man; } } catch (e) { /* try the next place */ }
      }
      return null;
    })();
    return loading;
  }
  const topicOf = id => (window.GARDEN_DATA.topics || []).find(t => t.topic_id === id);
  function langFor(t) { return I.isCn(t.subject_id) ? "zh" : I.ui(); }
  function videoFor(id) { const t = topicOf(id), v = man && man.videos[id]; if (!t || !v) return null; return v[langFor(t)] || null; }
  function watched() { try { const o = JSON.parse(localStorage.getItem(WATCH_KEY) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function setWatched(id) { const w = watched(); if (w[id]) return; w[id] = new Date().toISOString(); try { localStorage.setItem(WATCH_KEY, JSON.stringify(w)); } catch (e) {} }
  /* ---------- the button on the flower window ---------- */
  const orig = window.openModal;
  function addButton(id) {
    const box = document.querySelector("#modal"), prac = box && box.querySelector("#btn-practice");
    if (!prac || box.querySelector(".btn-lesson") || !videoFor(id)) return;
    const v = videoFor(id), seen = !!watched()[id];
    const b = document.createElement("button"); b.type = "button"; b.className = "btn-lesson"; b.dataset.lesson = id;
    b.innerHTML = esc(T("vid.watch")) + " <small>" + esc(T("vid.min", { m: Math.max(1, Math.round(v.seconds / 60)) })) + (seen ? " · ✓ " + esc(T("vid.watched")) : "") + "</small>";
    b.addEventListener("click", () => player(id));
    prac.parentNode.insertBefore(b, prac);
  }
  let lastId = null;
  window.openModal = function (id) {
    orig(id); lastId = id;
    if (man) addButton(id); else load().then(() => { if (lastId === id && document.querySelector("#modal:not([hidden]) #btn-practice")) addButton(id); });
  };
  /* ---------- the player (inside the same #modal) ---------- */
  function player(id) {
    const t = topicOf(id), v = videoFor(id), box = document.querySelector("#modal");
    if (!t || !v) { window.openModal(id); return; }
    I.setPage(t.subject_id);
    const lang = langFor(t), name = I.ui() === "en" ? t.name_en : t.name_zh;
    box.hidden = false; document.body.classList.add("modal-open");
    box.innerHTML = "<div class=\"modal-backdrop\" data-close=\"1\"></div><div class=\"modal-card practice-mode lesson-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\">" +
      "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"" + esc(T("aria.close")) + "\">×</button><div class=\"modal-lang\">" + I.toggleHTML(t.subject_id) + "</div>" +
      "<div class=\"practice-head\"><button class=\"practice-back\" type=\"button\" data-lesson-back=\"1\">" + esc(T("vid.back")) + "</button><div class=\"titles\"><div class=\"kicker\">" + esc(T("vid.kicker")) + "</div><h2 id=\"md-title\">" + esc(name) + "</h2></div></div>" +
      "<div class=\"lesson-frame\"><video class=\"lesson-video\" controls playsinline preload=\"none\" poster=\"" + esc(base + v.poster) + "\" data-kp=\"" + esc(id) + "\" data-lang=\"" + lang + "\">" +
      "<source src=\"" + esc(base + v.mp4) + "\" type=\"video/mp4\"><track kind=\"subtitles\" srclang=\"" + (lang === "en" ? "en" : "zh-Hans") + "\" label=\"" + (lang === "en" ? "English" : "中文") + "\" src=\"" + esc(base + v.vtt) + "\"></video></div>" +
      "<p class=\"lesson-tip\">" + esc(T("vid.tip")) + "</p><p class=\"lesson-err\" hidden>" + esc(T("vid.err")) + "</p>" +
      "<button class=\"btn-practice\" type=\"button\" data-lesson-practice=\"1\">" + esc(T("vid.practice")) + "</button></div>";
    const vid = box.querySelector("video");
    vid.addEventListener("error", () => { box.querySelector(".lesson-err").hidden = false; }, true);
    vid.addEventListener("timeupdate", () => { if (vid.duration && vid.currentTime / vid.duration >= 0.9) setWatched(id); });
    vid.addEventListener("ended", () => setWatched(id));
    box.onclick = e => {
      if (e.target.dataset.close) { vid.pause(); window.closeModal(); return; }
      if (e.target.closest("[data-lesson-back]")) { vid.pause(); window.openModal(id); return; }
      if (e.target.closest("[data-lesson-practice]")) { vid.pause(); window.openModal(id); const p = document.querySelector("#btn-practice"); if (p) p.click(); }
    };
    window.__modalRerender = () => { vid.pause(); player(id); };   // 中文 / English switch: the same flower's video in the other language
  }
  /* ---------- small ✓ under watched flowers ---------- */
  function marks() {
    const w = watched();
    document.querySelectorAll(".plot[data-id]").forEach(p => {
      const on = !!w[p.dataset.id] && !!(man && man.videos[p.dataset.id]); let m = p.querySelector(".lesson-mark");
      if (on && !m) { m = document.createElement("span"); m.className = "lesson-mark"; p.appendChild(m); }
      if (m) { if (!on) m.remove(); else { m.textContent = "🎬 " + T("vid.watched"); m.title = T("vid.mark"); } }
    });
  }
  const obs = new MutationObserver(() => { obs.disconnect(); marks(); obs.observe(document.querySelector("#garden"), { childList: true, subtree: true }); });
  const g = document.querySelector("#garden");
  if (g) obs.observe(g, { childList: true, subtree: true });
  document.addEventListener("garden:lang", () => setTimeout(marks, 0));
  const oldClose = window.closeModal; window.closeModal = function () { const v = document.querySelector("#modal video"); if (v) v.pause(); oldClose(); marks(); };
  load().then(marks);
  window.GardenLessons = { _load: load, _videoFor: videoFor, _watched: watched, _manifest: () => man, _base: () => base, play: player };
})();
