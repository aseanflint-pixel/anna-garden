/* 安安's garden: 摸底测试 / garden check-up  — 家长要求：给两个孩子的系统都加上“摸底测试” 比如测试是包含全部知识点，
   每个知识点放两道题， 一道难一些的，一道简单一些的。 测试完给出报告看孩子知识点薄弱在哪几项。
   - One test per subject: every flower (knowledge point) that has questions gets 2 questions from the existing bank (no new questions).
   - The bank has no difficulty tags, so a documented score decides: marks + ½ per extra answer box + 1 for a long question (150+ characters)
     + 1 if a parent marks it; on equal scores the longer question (stem + options) counts as a little harder. Easier = from the lowest third of the flower's questions, harder = from the highest third. All the same score
     -> two random ones, flagged 「两题难度相近」 on the report.
   - Auto-marked questions (choice / typed answers) first. A flower with fewer than 2 of them keeps its auto-marked one and adds a
     parent-marked question (flagged); with none, 2 parent-marked questions. The parent ticks those on the report (parent PIN), no AI marking.
   - Random question order and shuffled options every attempt; nothing is marked during the test.
   - Typed answers use the practice page's own checker (window.GardenCheck.checkExact): numerically equal answers count as right.
   - Results are kept on this device under DIAG_KEY with a history of attempts. They never touch the practice record
     (anna-garden.progress.v1): two questions are a snapshot, so the test does not grow or wilt any flower. 华文 / 高级华文 stay Chinese. */
(function () {
  "use strict";
  const DIAG_KEY = window.GARDEN_DIAG_KEY || "anna-garden.diag.v1", MAX_HIST = 30;   // the 五年级 page sets its own key
  const I = window.GardenI18n, DICT = window.GARDEN_I18N && window.GARDEN_I18N.dict;
  if (!I || !DICT) return;
  Object.assign(DICT.zh, {
    "save.diag": "🌱 摸底测试", "dg.kicker": "摸底测试", "dg.title": "{name}的花园体检", "dg.lead": "选一个科目。每朵花出 2 道题：一道简单一些，一道难一些。做题时先不告诉你对错，做完再看报告。体检不会改变花朵的进度。",
    "dg.subj.meta": "{k} 朵花 · {n} 道题 · 大约 {m} 分钟", "dg.start": "开始", "dg.resume": "继续上次没做完的（{s}，做了 {a}/{n}）", "dg.discard": "不要上次没做完的了",
    "dg.hist": "以前的体检", "dg.hist.none": "还没有做过体检。", "dg.hist.row": "{d} · {s} · {p}%", "dg.hist.pending": "（{n} 题等家长批改）", "dg.overview": "所有科目一起看（每科最近一次）",
    "dg.q.of": "第 {i} 题，共 {n} 题", "dg.q.saved": "记下了 ✓ 做完再看对错", "dg.q.write": "这题由爸爸妈妈批改", "dg.q.skip": "跳过", "dg.q.finish": "交卷", "dg.q.pause": "← 先停一下（下次接着做）",
    "dg.q.left": "还有 {n} 题没写。没写的算错，现在交卷吗？", "dg.q.sure": "现在交卷", "dg.q.back": "回去做",
    "dg.r.title": "体检报告 · {s}", "dg.r.when": "{d} · {k} 朵花 · {n} 道题", "dg.r.overall": "总得分", "dg.r.pending": "还有 {n} 题等爸爸妈妈批改，批改后报告会更新。",
    "dg.cat.both": "开花了：两题都对", "dg.cat.easy": "发芽了：只对简单题", "dg.cat.hard": "根要扎稳：只对难题", "dg.cat.none": "要浇水：两题都错", "dg.cat.pending": "等家长批改", "dg.cat.single": "（这朵花只有 1 道题）",
    "dg.r.weak": "需要多浇水的花", "dg.r.weakNone": "所有的花都开了，真棒！", "dg.r.all": "每朵花的结果", "dg.r.easyQ": "简单题", "dg.r.hardQ": "难题", "dg.r.onlyQ": "唯一一题",
    "dg.r.right": "对", "dg.r.partial": "部分对", "dg.r.wrong": "不对", "dg.r.blank": "没写", "dg.r.waiting": "等家长", "dg.r.parentFlag": "家长批改题", "dg.r.sameFlag": "两题难度相近",
    "dg.r.print": "打印 / 存成 PDF", "dg.r.save": "下载报告文件", "dg.r.back": "← 摸底测试", "dg.r.mark": "家长批改", "dg.pmLabel": "批改摸底测试", "dg.r.marking": "批改中：点「对 / 部分对 / 不对」",
    "dg.r.rule": "怎么选题：每朵花从题库里选 2 题。按分数、答题框数量、题目长度和是否家长批改算出难度分（同分时字数多的算难一些），最低的三分之一里选简单题，最高的三分之一里选难题。只能自动批改的题不够时，加家长批改题。体检结果和练习进度分开保存，不会改变花朵。",
    "dg.r.ruleTag": "怎么选题：每朵花从题库里选 2 题。题库标了难度（简单 / 中等 / 难），先从最简单的一档里随机选简单题，最难的一档里随机选难题；没有标记差别时按分数、答题框数量、题目长度算难度分。只能自动批改的题不够时，加家长批改题。体检结果和练习进度分开保存，不会改变花朵。", "dg.ov.title": "所有科目一起看", "dg.ov.none": "还没有做过体检。", "dg.ov.row": "{s}：{p}%（{d}）"
  });
  Object.assign(DICT.en, {
    "save.diag": "🌱 Check-up test", "dg.kicker": "Check-up test", "dg.title": "{name}'s garden check-up", "dg.lead": "Pick a subject. Every flower gets 2 questions: one easier, one harder. You won't see right or wrong while you work; the report comes at the end. The check-up doesn't change any flower.",
    "dg.subj.meta": "{k} flowers · {n} questions · about {m} min", "dg.start": "Start", "dg.resume": "Carry on with the unfinished test ({s}, {a}/{n} done)", "dg.discard": "Drop the unfinished test",
    "dg.hist": "Past check-ups", "dg.hist.none": "No check-ups yet.", "dg.hist.row": "{d} · {s} · {p}%", "dg.hist.pending": " ({n} waiting for a parent)", "dg.overview": "All subjects together (latest of each)",
    "dg.q.of": "Question {i} of {n}", "dg.q.saved": "Saved ✓ Results at the end", "dg.q.write": "Mum or Dad marks this one", "dg.q.skip": "Skip", "dg.q.finish": "Hand in", "dg.q.pause": "← Pause (carry on later)",
    "dg.q.left": "{n} questions have no answer. They count as wrong. Hand in now?", "dg.q.sure": "Hand in", "dg.q.back": "Go back",
    "dg.r.title": "Check-up report · {s}", "dg.r.when": "{d} · {k} flowers · {n} questions", "dg.r.overall": "Overall", "dg.r.pending": "{n} questions are waiting for Mum or Dad to mark; the report updates after that.",
    "dg.cat.both": "Blooming: both right", "dg.cat.easy": "Sprouting: easier one only", "dg.cat.hard": "Roots need care: harder one only", "dg.cat.none": "Needs water: both wrong", "dg.cat.pending": "Waiting for a parent", "dg.cat.single": " (this flower has only 1 question)",
    "dg.r.weak": "Flowers that need water", "dg.r.weakNone": "Every flower is blooming. Great job!", "dg.r.all": "Every flower", "dg.r.easyQ": "Easier", "dg.r.hardQ": "Harder", "dg.r.onlyQ": "Only one",
    "dg.r.right": "Right", "dg.r.partial": "Partly right", "dg.r.wrong": "Not right", "dg.r.blank": "No answer", "dg.r.waiting": "Parent to mark", "dg.r.parentFlag": "Parent-marked", "dg.r.sameFlag": "Similar difficulty",
    "dg.r.print": "Print / save as PDF", "dg.r.save": "Download the report", "dg.r.back": "← Check-up test", "dg.r.mark": "Parent marking", "dg.pmLabel": "Mark the check-up", "dg.r.marking": "Marking: tap Right / Partly right / Not right",
    "dg.r.rule": "How questions are chosen: 2 per flower from the question bank. A score from marks, answer boxes, question length and parent marking decides (on a tie, the longer question counts as harder): the lowest third gives the easier question, the highest third the harder one. Parent-marked questions are added when there aren't enough auto-marked ones. Results are kept apart from practice progress and don't change any flower.",
    "dg.r.ruleTag": "How questions are chosen: 2 per flower from the question bank. The bank marks each question easy, medium or hard: the easier question is drawn from the easiest level, the harder one from the hardest level; without a difference in levels a score from marks, answer boxes and question length decides. Parent-marked questions are added when there aren't enough auto-marked ones. Results are kept apart from practice progress and don't change any flower.", "dg.ov.title": "All subjects together", "dg.ov.none": "No check-ups yet.", "dg.ov.row": "{s}: {p}% ({d})"
  });
  const T = (k, v) => I.T(k, v);
  const G = () => window.GardenCheck;
  const DATA = () => window.GARDEN_DATA;
  const B = () => window.PRACTICE_BANK || { questions: [], byTopic: {} };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const en = () => I.ui() === "en";
  const tName = t => t ? (en() ? t.name_en : t.name_zh) : "";
  const sName = sid => I.term("subject", sid);
  let byIdCache = null; const byId = id => { if (!byIdCache) { byIdCache = {}; B().questions.forEach(q => { byIdCache[q.id] = q; }); } return byIdCache[id]; };
  const topicOf = id => (DATA().topics || []).find(t => t.topic_id === id);
  function questionsFor(t) {   // same rule as the practice page: the flower's own id plus its learning-outcome ids, same bank subject
    const b = B(), ids = [t.topic_id].concat((t.learning_outcomes || []).map(x => x.topic_id)), seen = {}, out = [];
    ids.forEach(id => ((b.byTopic && b.byTopic[id]) || []).forEach(i => { const q = b.questions[i]; if (!q || seen[q.id]) return; seen[q.id] = 1; if (!t.bank_subject || q.subject === t.bank_subject) out.push(q); }));
    return out;
  }
  const subjects = () => (DATA().subjects || []).filter(s => !s.coming_soon && flowers(s.subject_id).length);
  const flowers = sid => (DATA().topics || []).filter(t => t.subject_id === sid && questionsFor(t).length);
  /* ---------- storage: own key, never the practice record ---------- */
  function load() { try { const o = JSON.parse(localStorage.getItem(DIAG_KEY) || "{}"); return { attempts: Array.isArray(o.attempts) ? o.attempts : [], current: o.current || null }; } catch (e) { return { attempts: [], current: null }; } }
  let st = load();
  function save() { try { localStorage.setItem(DIAG_KEY, JSON.stringify(st)); } catch (e) {} }
  /* ---------- choosing ---------- */
  function rnd(n) { if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } return Math.floor(Math.random() * n); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  const isAuto = q => q.mode === "choice" || q.mode === "exact" || (q.mode === "multi" && !q.parts.some(p => p.kind === "parent"));
  const base = q => (parseFloat(q.marks) || 1) + 0.5 * Math.max(0, (q.parts || []).length - 1) + (String(q.stem || "").length >= 150 ? 1 : 0) + (isAuto(q) ? 0 : 1);
  // equal base scores: the longer question (stem + options + part prompts) counts as a little harder; it never outweighs the base score
  const textLen = q => String(q.stem || "").length + (q.options || []).join("").length + (q.parts || []).map(p => p.prompt || "").join("").length;
  const score = q => base(q) + Math.min(9999, textLen(q)) / 1e5;
  const splitOf = (lo, hi) => base(lo) < base(hi) ? "score" : score(lo) < score(hi) ? "length" : "same";
  // banks with difficulty tags (五年级): easier = from the easiest tag present, harder = from the hardest tag present (auto-marked first)
  const LV = { easy: 0, medium: 1, hard: 2 }, lvOf = q => (q && Object.prototype.hasOwnProperty.call(LV, q.diff)) ? LV[q.diff] : null;
  function pickTagged(pool) {
    if (pool.length < 2 || pool.some(q => lvOf(q) === null)) return null;
    const lo = Math.min.apply(null, pool.map(lvOf)), hi = Math.max.apply(null, pool.map(lvOf)); if (lo === hi) return null;
    const E = pool.filter(q => lvOf(q) === lo), H = pool.filter(q => lvOf(q) === hi), e = E[rnd(E.length)], h = H[rnd(H.length)];
    return [{ q: e.id, lv: "easy", split: "tag", flag: !isAuto(e) }, { q: h.id, lv: "hard", split: "tag", flag: !isAuto(h) }];
  }
  function pickTwo(qs) {
    const auto = qs.filter(isAuto);
    if (!qs.length) return [];
    const tagged = auto.length >= 2 ? pickTagged(auto) : null; if (tagged) return tagged;
    if (qs.length === 1) return [{ q: qs[0].id, lv: "only", split: "single", flag: !isAuto(qs[0]) }];
    if (auto.length === 1) {
      const a1 = auto[0], par = qs.filter(q => !isAuto(q)), diff = par.filter(q => score(q) !== score(a1)), p1 = (diff.length ? diff : par)[rnd((diff.length ? diff : par).length)];
      const lo = score(a1) <= score(p1) ? [a1, p1] : [p1, a1], split = splitOf(lo[0], lo[1]);
      return [{ q: lo[0].id, lv: "easy", split, flag: !isAuto(lo[0]) }, { q: lo[1].id, lv: "hard", split, flag: !isAuto(lo[1]) }];
    }
    const pool = auto.length >= 2 ? auto : qs, s = pool.slice().sort((a, b) => score(a) - score(b)), k = Math.max(1, Math.floor(s.length / 3));
    let E = s.slice(0, k), H = s.slice(s.length - k);
    if (score(s[0]) < score(s[s.length - 1]) && score(E[E.length - 1]) >= score(H[0])) { E = s.filter(q => score(q) === score(s[0])); H = s.filter(q => score(q) === score(s[s.length - 1])); }
    const e = E[rnd(E.length)]; let Hs = H.filter(q => q !== e); if (!Hs.length) Hs = pool.filter(q => q !== e); const h = Hs[rnd(Hs.length)], split = splitOf(e, h);
    return [{ q: e.id, lv: "easy", split, flag: !isAuto(e) }, { q: h.id, lv: "hard", split, flag: !isAuto(h) }];
  }
  function build(sid) {
    const items = [], few = [];
    flowers(sid).forEach(t => { const two = pickTwo(questionsFor(t)); if (two.length < 2 || two.some(x => x.flag)) few.push(t.topic_id); two.forEach(x => items.push(Object.assign({ kp: t.topic_id }, x))); });
    shuffle(items);
    items.forEach(it => { const q = byId(it.q); if (q.mode === "choice") it.perm = shuffle(q.options.map((_, k) => k)); });
    return { id: "d" + Date.now().toString(36) + rnd(1e6).toString(36), subj: sid, started: Date.now(), finished: null, i: 0, items, few };
  }
  /* ---------- grading ---------- */
  const filled = v => String(v == null ? "" : v).trim() !== "";
  function resultOf(it) {
    const q = byId(it.q), r = it.resp || {}; if (!q) return "blank";
    if (q.mode === "choice") return typeof r.pick === "number" ? (r.pick === q.answer_index ? "right" : "wrong") : "blank";
    const vals = r.vals || []; if (!vals.some(filled)) return "blank";
    if (!isAuto(q)) return it.pm || "pending";
    if (q.mode === "exact") return G().checkExact(q, vals[0]) || "blank";
    const ps = q.parts.map((p, k) => G().checkExact(p, vals[k] || "") === "right"), n = ps.filter(Boolean).length;
    return n === ps.length ? "right" : n ? "partial" : "wrong";
  }
  const credit = r => r === "right" ? 1 : r === "partial" ? 0.5 : r === "pending" ? null : 0;
  function summary(a) {
    const by = {}, order = []; a.items.forEach(it => { if (!by[it.kp]) { by[it.kp] = []; order.push(it.kp); } by[it.kp].push(it); });
    const kps = order.map(kp => {
      const its = by[kp], rs = its.map(resultOf); let cat;
      if (rs.indexOf("pending") >= 0) cat = "pending";
      else if (its.length === 1) cat = rs[0] === "right" ? "both" : "none";
      else { const e = rs[its.findIndex(x => x.lv === "easy")] === "right", h = rs[its.findIndex(x => x.lv === "hard")] === "right"; cat = e && h ? "both" : e ? "easy" : h ? "hard" : "none"; }
      return { kp, cat, single: its.length === 1, items: its, rs };
    });
    let got = 0, n = 0, pend = 0; a.items.forEach(it => { const c = credit(resultOf(it)); if (c === null) pend++; else { got += c; n++; } });
    return { kps, pct: n ? Math.round(100 * got / n) : 0, pend };
  }
  /* ---------- views (inside the garden's #modal) ---------- */
  const box = () => document.querySelector("#modal");
  const dateOf = ms => { const d = new Date(ms), p = n => ("0" + n).slice(-2); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()); };
  const CAT_ICON = { both: "🌸", easy: "🌱", hard: "🪴", none: "💧", pending: "⏳" };
  let view = { name: "home" }, pmOn = false;
  function shell(sid, kicker, title, body, backAttr) {
    I.setPage(sid || null);
    document.documentElement.lang = I.ui() === "en" ? "en" : "zh-Hans";
    const b = box(); b.hidden = false; document.body.classList.add("modal-open");
    b.innerHTML = "<div class=\"modal-backdrop\" data-close=\"1\"></div><div class=\"modal-card practice-mode dg-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\">" +
      "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"" + T("aria.close") + "\">×</button><div class=\"modal-lang\">" + I.toggleHTML(sid || null) + "</div>" +
      "<div class=\"practice-head\">" + (backAttr ? "<button class=\"practice-back\" type=\"button\" " + backAttr + ">" + (backAttr.indexOf("pause") >= 0 ? T("dg.q.pause") : T("dg.r.back")) + "</button>" : "") +
      "<div class=\"titles\"><div class=\"kicker\">" + esc(kicker) + "</div><h2 id=\"md-title\">" + title + "</h2></div></div>" + body + "</div>";
    window.__modalRerender = () => render();
    b.onclick = onClick; b.oninput = onInput; b.onkeydown = onKey;
  }
  function render() { st = load(); if (view.name === "q") qView(); else if (view.name === "r") reportView(view.id); else if (view.name === "all") overview(); else home(); }
  function plan(sid) { let k = 0, n = 0; flowers(sid).forEach(t => { const c = Math.min(2, questionsFor(t).length); k++; n += c; }); return { k, n }; }
  function home() {
    view = { name: "home" }; const cur = st.current; let h = "<p class=\"dg-lead\">" + T("dg.lead") + "</p>";
    if (cur && !cur.finished) h += "<button type=\"button\" class=\"btn-submit dg-resume\" data-dg=\"resume\">" + T("dg.resume", { s: esc(sName(cur.subj)), a: cur.items.filter(x => x.resp).length, n: cur.items.length }) + "</button><button type=\"button\" class=\"dg-link\" data-dg=\"discard\">" + T("dg.discard") + "</button>";
    h += "<div class=\"dg-subjs\">" + subjects().map(s => { const p = plan(s.subject_id); return "<button type=\"button\" class=\"dg-subj\" data-dg-start=\"" + esc(s.subject_id) + "\"><b>" + esc(sName(s.subject_id)) + "</b><span>" + T("dg.subj.meta", { k: p.k, n: p.n, m: Math.ceil(p.n * 1.2) }) + "</span><em>" + T("dg.start") + " →</em></button>"; }).join("") + "</div>";
    const hs = st.attempts.slice().reverse();
    h += "<h3 class=\"dg-h3\">" + T("dg.hist") + "</h3>" + (hs.length ? "<button type=\"button\" class=\"dg-link\" data-dg=\"all\">" + T("dg.overview") + " →</button>" + hs.map(a => { const m = summary(a); return "<button type=\"button\" class=\"dg-hrow\" data-dg-report=\"" + esc(a.id) + "\">" + T("dg.hist.row", { d: dateOf(a.finished), s: esc(sName(a.subj)), p: m.pct }) + (m.pend ? T("dg.hist.pending", { n: m.pend }) : "") + " →</button>"; }).join("") : "<p class=\"dg-note\">" + T("dg.hist.none") + "</p>");
    shell(null, T("dg.kicker"), T("dg.title"), h, null);
  }
  function respHTML(it, q) {
    const r = it.resp || {};
    if (q.mode === "choice") return "<ol class=\"opts\" role=\"list\">" + it.perm.map((k, pos) => "<li><button type=\"button\" class=\"opt" + (r.pick === k ? " dg-on" : "") + "\" data-dg-pick=\"" + k + "\"><b>(" + (pos + 1) + ")</b> " + G().richText(q.options[k]) + "</button></li>").join("") + "</ol>";
    const v = r.vals || [];
    if (q.mode === "exact") return "<div class=\"exact\"><input type=\"text\" class=\"exact-in dg-in\" data-k=\"0\" autocomplete=\"off\" placeholder=\"" + T("q.typeHere") + "\" value=\"" + esc(v[0] || "") + "\"></div>";
    if (q.mode === "parent") return "<div class=\"open-box\"><textarea class=\"open-in dg-in\" data-k=\"0\" rows=\"4\" placeholder=\"" + T("q.writeHere") + "\">" + esc(v[0] || "") + "</textarea><p class=\"open-note\">" + T("dg.q.write") + "</p></div>";
    return "<div class=\"multi-box\">" + q.parts.map((p, i) => "<label class=\"part-row part-in-row\"><span class=\"part-l\">" + esc(p.label || "") + "</span>" + (p.label ? "" : "<span class=\"part-p\">" + esc(p.prompt) + "</span>") +
      (p.kind === "parent" ? "<textarea class=\"part-in dg-in\" data-k=\"" + i + "\" rows=\"2\" placeholder=\"" + T("q.partHere") + "\">" + esc(v[i] || "") + "</textarea>"
        : "<input class=\"part-in dg-in\" data-k=\"" + i + "\" type=\"text\" autocomplete=\"off\" placeholder=\"" + T(p.label ? "q.partAnswer" : "q.partWhich") + "\" value=\"" + esc(v[i] || "") + "\">") + "</label>").join("") +
      (q.parts.some(p => p.kind === "parent") ? "<p class=\"open-note\">" + T("dg.q.write") + "</p>" : "") + "</div>";
  }
  function passageFig(q) {
    const b = B(), ps = q.passage && b.passages ? b.passages[q.passage] : null;
    return (ps ? "<details class=\"q-passage\" open><summary>" + T("q.readFirst") + "<b>" + esc(ps.title || "") + "</b></summary><div class=\"pbody\">" + G().passageHTML(ps.text) + "</div></details>" : "") +
      (q.figure ? "<div class=\"q-fig\"><img src=\"" + esc(q.figure) + "\" alt=\"" + T("q.fig") + "\" decoding=\"async\"></div>" : "");
  }
  function qView(left) {
    const a = st.current; if (!a || a.finished) { home(); return; }
    view = { name: "q" }; a.i = Math.max(0, Math.min(a.i || 0, a.items.length - 1));
    const it = a.items[a.i], q = byId(it.q), t = topicOf(it.kp), n = a.items.length, last = a.i === n - 1, done = a.items.filter(x => x.resp).length;
    I.setPage(t.subject_id);
    let h = "<div class=\"dg-progress\"><i style=\"width:" + Math.round(100 * done / n) + "%\"></i></div><div class=\"practice-meta\">" + G().metaHTML(q) + "</div>" + passageFig(q) +
      "<div class=\"q-stem\" data-q=\"" + esc(q.id) + "\">" + G().richText(q.stem) + "</div>" + respHTML(it, q) + (it.resp ? "<p class=\"dg-saved\">" + T("dg.q.saved") + "</p>" : "");
    if (left) h += "<div class=\"dg-confirm\"><p>" + T("dg.q.left", { n: left }) + "</p><button type=\"button\" class=\"btn-submit\" data-dg=\"finish-sure\">" + T("dg.q.sure") + "</button> <button type=\"button\" class=\"dg-link\" data-dg=\"finish-no\">" + T("dg.q.back") + "</button></div>";
    h += "<div class=\"practice-nav\"><button class=\"btn-nav\" type=\"button\" data-dg-nav=\"-1\"" + (a.i ? "" : " disabled") + ">" + T("q.prev") + "</button><div class=\"idx\">" + T("dg.q.of", { i: a.i + 1, n }) + "</div>" +
      "<button class=\"btn-nav dg-next\" type=\"button\" data-dg-nav=\"1\">" + (last ? T("dg.q.finish") : it.resp ? T("q.next") : T("dg.q.skip")) + "</button></div>";
    shell(t.subject_id, T("dg.kicker") + " · " + sName(a.subj), esc(tName(t)), h, "data-dg=\"pause\"");
  }
  function itemHTML(it, idx) {
    const q = byId(it.q), r = resultOf(it), resp = it.resp || {};
    const rk = { right: "dg.r.right", partial: "dg.r.partial", wrong: "dg.r.wrong", blank: "dg.r.blank", pending: "dg.r.waiting" }[r];
    const lab = s => String(s || "").replace(/\{\{o:(\d+)\}\}/g, (_, k) => { const p = it.perm ? it.perm.indexOf(Number(k)) : Number(k); return p >= 0 ? "(" + (p + 1) + ")" : ""; });
    let mine = "";
    if (q.mode === "choice") mine = typeof resp.pick === "number" ? "(" + (it.perm.indexOf(resp.pick) + 1) + ") " + G().richText(q.options[resp.pick]) : "";
    else mine = (resp.vals || []).map((v, k) => filled(v) ? (q.parts ? "<b>" + esc(q.parts[k].label || q.parts[k].prompt || "") + "</b> " : "") + esc(v) : "").filter(Boolean).join("<br>");
    let ans;
    if (q.mode === "multi") ans = "<ul class=\"part-ans\">" + q.parts.map(p => "<li><b>" + esc(p.label || p.prompt) + "</b> " + G().richText(p.answer) + (p.kind === "parent" && p.marking_points && p.marking_points.length ? "<ul class=\"mp\">" + p.marking_points.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") + "</li>").join("") + "</ul>";
    else if (q.mode === "choice") ans = "(" + (it.perm.indexOf(q.answer_index) + 1) + ") " + G().richText(q.options[q.answer_index]);
    else ans = G().richText(lab(q.answer));
    const mp = q.mode === "parent" && q.marking_points && q.marking_points.length ? "<div class=\"k k2\">" + T("q.markingParent") + "</div><ul class=\"mp\">" + q.marking_points.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "";
    const steps = lab(q.explanation).split("\n").filter(x => x.trim());
    const canMark = !isAuto(q) && (resp.vals || []).some(filled);
    const marks = canMark ? "<div class=\"dg-pm\"><b>" + T("dg.r.mark") + ":</b> " + ["right", "partial", "wrong"].map(m => "<button type=\"button\" class=\"" + (it.pm === m ? "on" : "") + "\" data-dg-pm=\"" + idx + ":" + m + "\">" + T("mark." + m) + "</button>").join("") + "</div>" : "";
    return "<details class=\"dg-item r-" + r + "\"" + (r === "pending" ? " open" : "") + "><summary><span class=\"dg-lv\">" + T(it.lv === "easy" ? "dg.r.easyQ" : it.lv === "hard" ? "dg.r.hardQ" : "dg.r.onlyQ") + "</span><span class=\"dg-st st-" + r + "\">" + T(rk) + "</span>" +
      (it.flag ? "<span class=\"dg-flag\">" + T("dg.r.parentFlag") + "</span>" : "") + (it.split === "same" ? "<span class=\"dg-flag\">" + T("dg.r.sameFlag") + "</span>" : "") + "</summary>" +
      "<div class=\"answer-box\"><div class=\"practice-meta\">" + G().metaHTML(q) + "</div>" + passageFig(q) + "<div class=\"q-stem\">" + G().richText(q.stem) + "</div>" +
      (mine ? "<div class=\"k\">" + T("q.mine") + "</div><div class=\"mine\">" + mine + "</div>" : "") +
      "<div class=\"k k2\">" + T(isAuto(q) ? "q.answer" : "q.modelAnswer") + "</div><div class=\"v\">" + ans + "</div>" + mp +
      (steps.length ? "<div class=\"k k2\">" + T("q.steps") + "</div><ol class=\"steps\">" + steps.map(x => "<li>" + G().richText(x) + "</li>").join("") + "</ol>" : "") + marks + "</div></details>";
  }
  function weakList(m) {
    const ord = { none: 0, hard: 1, easy: 2 }, weak = m.kps.filter(k => k.cat in ord).sort((x, y) => ord[x.cat] - ord[y.cat]);
    if (!weak.length) return "<p class=\"dg-good\">" + T("dg.r.weakNone") + "</p>";
    const groups = {}, gorder = [];
    weak.forEach(k => { const t = topicOf(k.kp), g = I.term("strand", t.strand_zh); if (!groups[g]) { groups[g] = []; gorder.push(g); } groups[g].push(k); });
    return gorder.map(g => "<div class=\"dg-g\"><div class=\"dg-gh\">" + esc(g) + "</div>" + groups[g].map(k => "<div class=\"dg-w c-" + k.cat + "\">" + CAT_ICON[k.cat] + " <span class=\"dg-fn\">" + esc(tName(topicOf(k.kp))) + "</span> <small>" + T("dg.cat." + k.cat) + "</small></div>").join("") + "</div>").join("");
  }
  function reportView(id) {
    const a = st.attempts.find(x => x.id === id); if (!a) { home(); return; }
    if (!view || view.name !== "r" || view.id !== id) pmOn = false;
    view = { name: "r", id }; I.setPage(a.subj);
    const m = summary(a), cnt = c => m.kps.filter(k => k.cat === c).length;
    let h = "<p class=\"dg-note\">" + T("dg.r.when", { d: dateOf(a.finished), k: m.kps.length, n: a.items.length }) + "</p>" +
      "<div class=\"dg-score\"><div class=\"dg-ring\" style=\"--p:" + m.pct + "\"><b>" + m.pct + "%</b><i>" + T("dg.r.overall") + "</i></div><div class=\"dg-cats\">" +
      ["both", "easy", "hard", "none", "pending"].filter(c => c !== "pending" || cnt(c)).map(c => "<div class=\"dg-c c-" + c + "\"><span>" + CAT_ICON[c] + " " + T("dg.cat." + c) + "</span><b>" + cnt(c) + "</b></div>").join("") + "</div></div>" +
      (m.pend ? "<p class=\"dg-pendnote\">" + T("dg.r.pending", { n: m.pend }) + "</p>" : "") +
      "<h3 class=\"dg-h3\">" + T("dg.r.weak") + "</h3>" + weakList(m);
    const needMark = a.items.some(it => !isAuto(byId(it.q)) && it.resp && (it.resp.vals || []).some(filled));
    if (needMark) h += pmOn ? "<p class=\"dg-pmnote\">" + T("dg.r.marking") + "</p>" : "<button type=\"button\" class=\"btn-submit dg-pmbtn\" data-dg=\"mark\">🔒 " + T("dg.r.mark") + "</button>";
    const groups = {}, gorder = [];
    m.kps.forEach(k => { const t = topicOf(k.kp), g = I.term("strand", t.strand_zh); if (!groups[g]) { groups[g] = []; gorder.push(g); } groups[g].push(k); });
    h += "<h3 class=\"dg-h3\">" + T("dg.r.all") + "</h3>" + gorder.map(g => "<div class=\"dg-g\"><div class=\"dg-gh\">" + esc(g) + "</div>" + groups[g].map(k => "<div class=\"dg-kp c-" + k.cat + "\"><div class=\"dg-kh\">" + CAT_ICON[k.cat] + " <span class=\"dg-fn\">" + esc(tName(topicOf(k.kp))) + "</span> <small>" + T("dg.cat." + k.cat) + (k.single ? T("dg.cat.single") : "") + "</small></div>" +
      k.items.slice().sort((x, y) => (x.lv === "easy" ? 0 : 1) - (y.lv === "easy" ? 0 : 1)).map(it => itemHTML(it, a.items.indexOf(it))).join("") + "</div>").join("") + "</div>").join("");
    h += "<p class=\"dg-note dg-rule\">" + (window.GARDEN_DIAG_KEY ? T("dg.r.ruleTag") : T("dg.r.rule")) + "</p><div class=\"dg-actions\"><button type=\"button\" class=\"btn-submit\" data-dg=\"print\">" + T("dg.r.print") + "</button><button type=\"button\" class=\"dg-link\" data-dg=\"download\">" + T("dg.r.save") + "</button></div>";
    shell(a.subj, T("dg.kicker"), T("dg.r.title", { s: esc(sName(a.subj)) }), h, "data-dg=\"home\"");
    box().querySelector(".dg-card").classList.toggle("pm-on", pmOn);
  }
  function overview() {
    view = { name: "all" }; const latest = {}, order = []; st.attempts.forEach(a => { if (!latest[a.subj]) order.push(a.subj); latest[a.subj] = a; });
    const h = order.length ? order.map(sid => { const a = latest[sid], m = summary(a); return "<div class=\"dg-g\"><button type=\"button\" class=\"dg-hrow\" data-dg-report=\"" + esc(a.id) + "\"><b>" + T("dg.ov.row", { s: esc(sName(sid)), p: m.pct, d: dateOf(a.finished) }) + "</b> →</button>" + weakList(m) + "</div>"; }).join("") : "<p class=\"dg-note\">" + T("dg.ov.none") + "</p>";
    shell(null, T("dg.kicker"), T("dg.ov.title"), h, "data-dg=\"home\"");
  }
  /* ---------- events ---------- */
  function grab() { const a = st.current; if (!a || a.finished || view.name !== "q") return; const it = a.items[a.i], ins = [...box().querySelectorAll(".dg-in")]; if (!ins.length) return;
    const vals = ins.map(x => x.value); it.resp = vals.some(filled) ? { vals } : null; save(); }
  function finish() { const a = st.current; a.finished = Date.now(); delete a.i; st.attempts.push(a); st.attempts = st.attempts.slice(-MAX_HIST); st.current = null; save(); reportView(a.id); }
  function onInput(e) { if (e.target.classList.contains("dg-in")) grab(); }
  function onKey(e) { if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.classList.contains("dg-in")) { e.preventDefault(); const n = box().querySelector("[data-dg-nav='1']"); if (n) n.click(); } }
  function onClick(e) {
    const el = e.target;
    if (el.dataset && el.dataset.close) { window.closeModal(); return; }
    st = load(); const a = st.current, it = a && !a.finished && view.name === "q" ? a.items[a.i] : null;
    const go = el.closest("[data-dg-start]"); if (go) { st.current = build(go.dataset.dgStart); save(); qView(); return; }
    const pk = el.closest("[data-dg-pick]"); if (pk && it) { it.resp = { pick: Number(pk.dataset.dgPick) }; save(); qView(); return; }
    const nv = el.closest("[data-dg-nav]"); if (nv && it && !nv.disabled) { grab(); const d = Number(nv.dataset.dgNav);
      if (d > 0 && a.i === a.items.length - 1) { const left = a.items.filter(x => !x.resp).length; if (left) { qView(left); return; } finish(); return; }
      a.i = Math.max(0, a.i + d); save(); qView(); const c = box().querySelector(".modal-card"); if (c) c.scrollTop = 0; return; }
    const rp = el.closest("[data-dg-report]"); if (rp) { reportView(rp.dataset.dgReport); return; }
    const pm = el.closest("[data-dg-pm]"); if (pm && pmOn && view.name === "r") { const p = pm.dataset.dgPm.split(":"), at = st.attempts.find(x => x.id === view.id); at.items[Number(p[0])].pm = p[1]; save(); reportView(view.id); return; }
    const b = el.closest("[data-dg]"); if (!b) return; const k = b.dataset.dg;
    if (k === "resume") qView();
    else if (k === "discard") { st.current = null; save(); home(); }
    else if (k === "pause") { grab(); home(); }
    else if (k === "home") home();
    else if (k === "all") overview();
    else if (k === "finish-sure") finish();
    else if (k === "finish-no") { const j = a.items.findIndex(x => !x.resp); if (j >= 0) a.i = j; save(); qView(); }
    else if (k === "print") window.print();
    else if (k === "mark") { const id = view.id; window.withParentPin(() => { st = load(); view = { name: "r", id }; pmOn = true; reportView(id); }, "dg.pmLabel"); }
    else if (k === "download") { const at = st.attempts.find(x => x.id === view.id), m = summary(at);
      const out = { app: "anna-garden", kind: "check-up-report", subject: at.subj, finished: dateOf(at.finished), overall_pct: m.pct, waiting_for_parent: m.pend,
        flowers: m.kps.map(k => { const t = topicOf(k.kp); return { id: k.kp, group: t.strand_zh, name_zh: t.name_zh, name_en: t.name_en, result: k.cat, questions: k.items.map((x, j) => ({ id: x.q, level: x.lv, result: k.rs[j] })) }; }) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" })), l = document.createElement("a");
      l.href = url; l.download = "garden-check-up-" + at.subj + "-" + dateOf(at.finished).replace(/[^0-9]/g, "") + ".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  const css = document.createElement("style");
  css.textContent = ".dg-lead{line-height:1.6;margin:4px 0 12px}.dg-subjs{display:grid;gap:10px;margin:8px 0}.dg-subj{display:grid;grid-template-columns:1fr auto;gap:2px 10px;text-align:left;padding:14px 16px;border-radius:18px;border:2px solid #c9dc9a;background:linear-gradient(135deg,#f3fae6,#fffef6);font-size:1rem;cursor:pointer}" +
    ".dg-subj b{font-size:1.1rem;color:#2f5a2a}.dg-subj span{grid-column:1;font-size:.85rem;opacity:.75}.dg-subj em{grid-column:2;grid-row:1/3;align-self:center;font-style:normal;font-weight:800;background:#f0c43a;color:#3d2a04;border-radius:999px;padding:8px 14px}" +
    ".dg-h3{margin:18px 0 6px;font-size:1rem;color:#35582a}.dg-link{background:none;border:0;color:#35582a;text-decoration:underline;padding:8px 0;font-size:.9rem;cursor:pointer}.dg-hrow{display:block;width:100%;text-align:left;background:#fff;border:1px solid #e4dfcf;border-radius:12px;padding:10px 12px;margin:6px 0;font-size:.95rem;cursor:pointer}" +
    ".dg-note{opacity:.75;font-size:.9rem}.dg-resume{display:block;width:100%;margin:6px 0}.dg-progress{height:8px;background:#eef3e3;border-radius:6px;overflow:hidden;margin:2px 0 10px}.dg-progress i{display:block;height:100%;background:linear-gradient(90deg,#8cc36a,#f0c43a)}" +
    ".opt.dg-on{border-color:#2f7d5a;background:#e3f3ea;box-shadow:0 0 0 2px #2f7d5a33}.dg-saved{color:#2f7d5a;font-weight:800;margin:8px 0}.dg-confirm{background:#fff4d6;border-radius:14px;padding:10px 14px;margin:10px 0}" +
    ".dg-score{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:10px 0}.dg-ring{--p:0;flex:0 0 120px;height:120px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#fffef6 78%,transparent 79%),conic-gradient(#5aa35a calc(var(--p)*1%),#e9eedc 0)}.dg-ring b{font-size:1.6rem;color:#2f5a2a}.dg-ring i{font-style:normal;font-size:.75rem;opacity:.7}" +
    ".dg-cats{flex:1;min-width:200px;display:grid;gap:6px}.dg-c{display:flex;justify-content:space-between;gap:8px;border-radius:12px;padding:7px 12px;font-size:.9rem;background:#f4f4ee}.c-both{background:#fde7f0}.c-easy{background:#eaf6dc}.c-hard{background:#fff0d6}.c-none{background:#e2f0fb}.c-pending{background:#efeefe}" +
    ".dg-pendnote,.dg-pmnote{background:#efeefe;border-radius:12px;padding:8px 12px;font-size:.9rem}.dg-good{font-weight:800;color:#2f7d5a}.dg-g{margin:8px 0}.dg-gh{font-weight:800;font-size:.9rem;color:#35582a;margin:8px 0 4px}.dg-w{border-radius:12px;padding:7px 12px;margin:4px 0}.dg-w small,.dg-kh small{opacity:.7}" +
    ".dg-kp{border:1px solid #e4dfcf;border-radius:14px;padding:8px 12px;margin:6px 0;background:#fff}.dg-kp.c-both,.dg-kp.c-easy,.dg-kp.c-hard,.dg-kp.c-none,.dg-kp.c-pending{background:#fff;border-left:6px solid #e4dfcf}.dg-kp.c-both{border-left-color:#f19ac0}.dg-kp.c-easy{border-left-color:#8cc36a}.dg-kp.c-hard{border-left-color:#e9a93a}.dg-kp.c-none{border-left-color:#5aa0d8}.dg-kp.c-pending{border-left-color:#8e86e8}" +
    ".dg-kh{font-weight:800;margin-bottom:4px}.dg-item summary{cursor:pointer;display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:5px 0;font-size:.9rem}.dg-lv{background:#eef3e3;border-radius:8px;padding:1px 8px}.dg-st{font-weight:800}.st-right{color:#2f8f4e}.st-partial{color:#b7860b}.st-wrong,.st-blank{color:#c0392b}.st-pending{color:#5b52c9}.dg-flag{font-size:.75rem;background:#ffe5d9;border-radius:8px;padding:1px 7px}" +
    ".dg-pm{margin-top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.dg-pm button{min-height:40px;padding:0 14px;border-radius:999px;border:2px solid #c9dc9a;background:#fff;font-weight:800}.dg-pm button.on{background:#2f7d5a;color:#fff;border-color:#2f7d5a}.dg-card:not(.pm-on) .dg-pm{display:none}" +
    ".dg-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0 18px}.dg-rule{margin-top:16px}" +
    "@media print{body>*:not(#modal){display:none!important}#modal{position:static!important}#modal .modal-backdrop,#modal .modal-x,#modal .modal-lang,#modal .practice-back,#modal .dg-actions,#modal .dg-pmbtn,#modal .dg-pm{display:none!important}#modal .modal-card{max-height:none!important;overflow:visible!important;box-shadow:none!important;margin:0!important;width:100%!important}#modal details.dg-item>*{display:block}}";
  document.head.appendChild(css);
  function open() { const b = box(); if (b && !b.hidden && window.closeModal) window.closeModal(); st = load(); home(); }
  function bindButton() { const b = document.getElementById("btn-diag"); if (b && !b.dataset.dgBound) { b.dataset.dgBound = "1"; b.addEventListener("click", open); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindButton); else bindButton();
  window.GardenDiag = { open, _pickTwo: pickTwo, _build: build, _summary: summary, _result: resultOf, _isAuto: isAuto, _score: score, _base: base, _flowers: flowers, _questionsFor: questionsFor, _subjects: subjects };   // tests read the _ ones
})();
