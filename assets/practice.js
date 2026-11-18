/* Practice view for 安安's knowledge garden — original question bank (text + drawn figures).
   Choice items and exact-value items are checked automatically; other items use 做对了 / 做错了;
   open-ended items are typed in, saved, and wait for a parent to mark them (家长确认). */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  // escaped text, but keep <u>…</u> underlines used in some stems and passages
  function richText(s) {
    return esc(s).replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>").replace(/\n/g, "<br>");
  }
  function passageHTML(p) {
    let s = esc(p).replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>");
    s = s.replace(/^(Word box|词语框|词语表)[:：]?\s*(.*)$/gm, function (_, a, b) {
      return "<div class=\"wbox\">" + b.split(/\s*\|\s*/).map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div>";
    });
    s = s.replace(/\[(\d+)\] /g, "<b class=\"pn\">$1</b> ");
    return s.split(/\n\n/).map(function (x) { return "<p>" + x.replace(/\n/g, "<br>") + "</p>"; }).join("");
  }

  function bank() { return window.PRACTICE_BANK || null; }
  function api() { return window.AnnaProgress || null; }

  function topicIdsOf(t) {
    const ids = [];
    function add(id) { if (id && ids.indexOf(id) === -1) ids.push(id); }
    add(t.topic_id);
    (t.learning_outcomes || []).forEach(function (lo) { add(lo.topic_id); });
    return ids;
  }
  function matchesSubject(t, q) {
    const subj = (t && t.bank_subject) || "";
    return !subj || !q || q.subject === subj;
  }
  function questionsFor(t, filterId) {
    const b = bank();
    if (!b || !b.questions) return [];
    const ids = filterId ? [filterId] : topicIdsOf(t);
    const seen = {}; const list = [];
    ids.forEach(function (id) {
      ((b.byTopic && b.byTopic[id]) || []).forEach(function (i) {
        if (seen[i]) return; seen[i] = true;
        const q = b.questions[i];
        if (q && matchesSubject(t, q)) list.push(q);
      });
    });
    return list;
  }
  function loLabel(t, topicId) {
    const lo = (t.learning_outcomes || []).find(function (x) { return x.topic_id === topicId; });
    if (lo && lo.text_zh) return lo.text_zh;
    return topicId === t.topic_id ? t.name_zh : topicId;
  }
  function countsByTopic(t) {
    const out = {};
    topicIdsOf(t).forEach(function (id) { out[id] = questionsFor(t, id).length; });
    return out;
  }

  /* ---------- answer checking ---------- */
  function norm(s) {
    return String(s == null ? "" : s).normalize("NFKC").toLowerCase()
      .replace(/\s+/g, " ").trim()
      .replace(/ /g, function (m, off, str) { return (/\d/.test(str[off - 1] || "") && /\d/.test(str[off + 1] || "")) ? " " : ""; })
      .replace(/[。.!！]+$/, "");
  }
  function numOf(s) {
    const m = norm(s).replace(/[$,]/g, "").replace(/(\d) (?=\d)/g, "$1").match(/^(-?\d+(?:\.\d+)?) ?([a-z°%]*[23]?|元|分|个|ℓ)$/);
    return m ? { n: Number(m[1]), unit: m[2] || "" } : null;
  }
  /* exact value of what she typed: whole number, decimal, fraction a/b, mixed number "a b/c";
     "$", thousands spaces/commas, "about"/"≈" and a trailing unit or count word are allowed */
  const MEASURE = ["cm", "m", "km", "mm", "kg", "g", "ml", "l", "cm2", "m2", "cm3", "°", "%", "h", "min", "s", "°c"];
  function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
  function valOf(input) {
    let s = String(input == null ? "" : input).normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim().replace(/[。.]+$/, "");
    s = s.replace(/^(about|approximately|approx\.?|约|≈|~)\s*/, "").replace(/\$/g, "").trim();
    let m, kind, n, d, dp = 0, rest, fn = 0, fd = 1;
    if ((m = s.match(/^(\d+) (\d+) ?\/ ?(\d+)\s*(.*)$/))) {
      fn = +m[2]; fd = +m[3]; if (!fd) return null;
      kind = "mixed"; n = +m[1] * fd + fn; d = fd; rest = m[4];
    } else if ((m = s.match(/^(\d+) ?\/ ?(\d+)\s*(.*)$/))) {
      fn = +m[1]; fd = +m[2]; if (!fd) return null;
      kind = "frac"; n = fn; d = fd; rest = m[3];
    } else if ((m = s.match(/^(\d{1,3}(?:[ ,]\d{3})+|\d+)?(?:\.(\d+))?\s*(.*)$/)) && (m[1] || m[2])) {
      const w = (m[1] || "0").replace(/[ ,]/g, ""); dp = (m[2] || "").length;
      kind = dp ? "dec" : "int"; d = Math.pow(10, dp); n = Number(w) * d + Number(m[2] || 0); rest = m[3];
    } else return null;
    rest = (rest || "").replace(/\s+/g, "").replace(/²/g, "2").replace(/³/g, "3").replace(/ℓ/g, "l");
    let unit = "";
    if (rest) {
      if (MEASURE.indexOf(rest) >= 0) unit = rest;
      else if (rest === "元" || /^[a-z][a-z']*$/.test(rest)) unit = ""; // count word: boxes, pizzas, dollars
      else return null;
    }
    return { n: n, d: d, kind: kind, dp: dp, unit: unit, wrote: !!rest, measure: MEASURE.indexOf(rest) >= 0, fn: fn, fd: fd };
  }
  function valOk(q, x) {
    if (x.n * q.val[1] !== q.val[0] * x.d) return false;              // numerically equal?
    // a written unit must be the right one (a bare number is fine)
    const want = q.unit ? String(q.unit).replace(/ℓ/g, "l") : "";
    if (x.measure && x.unit !== want) return false;
    if (want && x.wrote && !x.measure) return false;                    // "50 boxes" when the answer is 50 cm
    const forms = q.forms || [];
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (f === "mixed" && !(x.kind === "mixed" && x.fn < x.fd && x.fn > 0)) return false;
      if (f === "improper" && !(x.kind === "frac" && x.fn >= x.fd)) return false;
      if (f === "fraction" && !(x.kind === "frac" || x.kind === "mixed")) return false;
      if (f === "simplest" && !((x.kind === "frac" || x.kind === "mixed") && gcd(x.fn, x.fd) === 1 && (x.kind === "frac" || x.fn < x.fd))) return false;
      if (f === "decimal" && !(x.kind === "dec" || x.kind === "int")) return false;
      if (f === "round" && (x.kind === "frac" || x.kind === "mixed" || (q.dp && x.dp !== q.dp))) return false;
    }
    return true;
  }
  function checkExact(q, input) {
    const v = norm(input);
    if (!v) return null;
    if (q.numset) { // a list of numbers in any order (e.g. all the factors): same numbers, each once
      const got = (String(input).match(/\d+/g) || []).map(Number).sort(function (a, b) { return a - b; });
      return got.length === q.numset.length && got.every(function (x, i) { return x === q.numset[i]; }) ? "right" : "wrong";
    }
    if (q.rem) { // quotient and remainder asked for: "1250 r 2", "1 250 remainder 2", "quotient 1250, remainder 2"
      const t = String(input).normalize("NFKC").replace(/(\d)[ ,](?=\d{3}\b)/g, "$1");
      const ns = (t.match(/\d+/g) || []).map(Number);
      if (ns.length === 2 && /r|remainder|余/i.test(t) && ns[0] === q.rem[0] && ns[1] === q.rem[1]) return "right";
    }
    if ((q.accept || []).some(function (a) { return norm(a) === v; })) return "right";
    if (q.val) {
      // Lu: 数值相等就算对，除非题目指定了形式
      const x = valOf(input);
      return x && valOk(q, x) ? "right" : "wrong";   // e.g. "10 r 2" is not a number of boxes
    }
    if (typeof q.num === "number") {
      const x = numOf(input);
      // a bare number is fine; if she writes a unit it must be the right one
      if (x && Math.abs(x.n - q.num) < 1e-9 && (!x.unit || !q.unit || x.unit === q.unit)) return "right";
    }
    return "wrong";
  }

  const session = {}; // qid -> { pick, typed, result } for this practice session only

  /* ---------- practice sessions: random order each time ----------
     Every time a flower's practice starts, the questions are put in a fresh random order (no fixed seed):
     not-yet-done first, then tried-but-not-right, then already right; groups are shuffled within each tier.
     Questions that share a reading passage or a notice/figure stay together, in their original order.
     Choice options are also shuffled per session; checking uses the option itself, never its position. */
  const orders = {}; // topic_id -> { ids:[qid], perms:{qid:[original option index in display order]} }
  function rnd(n) {
    if (window.crypto && window.crypto.getRandomValues) { const a = new Uint32Array(1); window.crypto.getRandomValues(a); return a[0] % n; }
    return Math.floor(Math.random() * n);
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); const x = arr[i]; arr[i] = arr[j]; arr[j] = x; }
    return arr;
  }
  function tierOf(t, q) {
    const A = api(); if (!A) return 0;
    if (q.mode === "parent" || q.mode === "multi") {
      const rec = A.getOpen(q.id);
      if (!rec) return 0;
      return rec.status === "right" ? 2 : 1;
    }
    const m = A.getMark(t.topic_id, q.id);
    if (!m) return 0;
    return m === "right" ? 2 : 1;
  }
  function lastFirstGet(id) { try { return sessionStorage.getItem("anna-garden.first." + id); } catch (e) { return null; } }
  function lastFirstSet(id, qid) { try { sessionStorage.setItem("anna-garden.first." + id, qid); } catch (e) {} }
  function startSession(t) {
    const qs = questionsFor(t, null);
    qs.forEach(function (q) { delete session[q.id]; });
    const groups = []; const byKey = {};
    qs.forEach(function (q) {
      const key = q.grp ? "g:" + q.grp : "q:" + q.id;
      if (!byKey[key]) { byKey[key] = []; groups.push(byKey[key]); }
      byKey[key].push(q);
    });
    const tiers = [[], [], []];
    groups.forEach(function (g) {
      const tier = Math.min.apply(null, g.map(function (q) { return tierOf(t, q); }));
      tiers[tier].push(g);
    });
    tiers.forEach(shuffle);
    // do not start with the same question as the previous session when there is another choice in the first tier
    const first = tiers.find(function (x) { return x.length; }) || [];
    const prev = lastFirstGet(t.topic_id);
    if (first.length > 1 && prev && first[0][0].id === prev) { const j = 1 + rnd(first.length - 1); const x = first[0]; first[0] = first[j]; first[j] = x; }
    const ids = [];
    tiers.forEach(function (tier) { tier.forEach(function (g) { g.forEach(function (q) { ids.push(q.id); }); }); });
    const perms = {};
    qs.forEach(function (q) {
      if (q.mode !== "choice") return;
      const p = q.options.map(function (_, i) { return i; });
      perms[q.id] = q.fixed ? p : shuffle(p);
    });
    orders[t.topic_id] = { ids: ids, perms: perms };
    if (ids.length) lastFirstSet(t.topic_id, ids[0]);
    return orders[t.topic_id];
  }
  function sessionList(t, filterId) {
    const o = orders[t.topic_id] || startSession(t);
    const b = bank();
    const allow = filterId ? {} : null;
    if (filterId) questionsFor(t, filterId).forEach(function (q) { allow[q.id] = true; });
    return o.ids.filter(function (id) { return !allow || allow[id]; }).map(function (id) { return b.questions[b.idIndex[id]]; });
  }
  function permOf(t, q) {
    const o = orders[t.topic_id];
    return (o && o.perms[q.id]) || q.options.map(function (_, i) { return i; });
  }
  // {{o:k}} in an explanation / answer = original option k → the label it has on screen now
  function labelize(text, t, q) {
    if (!q || q.mode !== "choice") return text;
    const p = permOf(t, q);
    return String(text || "").replace(/\{\{o:(\d+)\}\}/g, function (_, k) { const pos = p.indexOf(Number(k)); return pos >= 0 ? "(" + (pos + 1) + ")" : ""; });
  }
  window.__gardenSession = { orders: orders, labelize: labelize }; // read by the headless tests only

  /* ---------- rendering ---------- */
  function filtersHTML(t, filterId, counts, total) {
    const ids = topicIdsOf(t).filter(function (id) { return counts[id]; });
    if (ids.length <= 1) return "";
    const chips = ["<button type=\"button\" data-filter=\"\" aria-pressed=\"" + (!filterId) + "\">全部 <span class=\"n\">" + total + "</span></button>"];
    ids.forEach(function (id) {
      chips.push("<button type=\"button\" data-filter=\"" + esc(id) + "\" aria-pressed=\"" + (filterId === id) + "\">" + esc(loLabel(t, id)) + " <span class=\"n\">" + counts[id] + "</span></button>");
    });
    return "<div class=\"practice-filters\" role=\"tablist\" aria-label=\"按小知识点筛选\">" + chips.join("") + "</div>";
  }
  function metaHTML(q) {
    const chips = [q.level, q.subject_zh, q.marks ? q.marks + " 分" : "", q.type_zh];
    let h = chips.filter(Boolean).map(function (c) { return "<span class=\"chip\">" + esc(c) + "</span>"; }).join("");
    if (q.mode === "parent" || (q.mode === "multi" && q.parts.some(function (p) { return p.kind === "parent"; }))) h += "<span class=\"chip chip-parent\">家长批改</span>";
    return h;
  }
  function answerBoxHTML(q, t) {
    const b = bank();
    const steps = labelize(String(q.explanation || ""), t, q).split("\n").filter(function (x) { return x.trim(); });
    let h = "<div class=\"answer-box\">";
    if (q.mode === "multi") {
      h += "<div class=\"k\">" + (q.parts.some(function (p) { return p.kind === "parent"; }) ? "参考答案" : "答案") + "</div><ul class=\"part-ans\">" + q.parts.map(function (p) {
        return "<li><b>" + esc(p.label || p.prompt) + "</b> " + richText(p.answer) +
          (p.kind === "parent" && p.marking_points && p.marking_points.length ? "<ul class=\"mp\">" + p.marking_points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</li>";
      }).join("") + "</ul>";
    } else
    h += "<div class=\"k\">" + (q.mode === "parent" ? "参考答案" : "答案") + "</div><div class=\"v\">" + richText(labelize(q.answer || "", t, q)) + "</div>";
    if (q.mode === "parent" && q.marking_points && q.marking_points.length) {
      h += "<div class=\"k k2\">评分要点（家长对照）</div><ul class=\"mp\">" + q.marking_points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }
    if (steps.length) {
      h += "<div class=\"k k2\">解题思路</div><ol class=\"steps\">" + steps.map(function (x) { return "<li>" + richText(x) + "</li>"; }).join("") + "</ol>";
    }
    if (q.explanation_figure) h += "<div class=\"q-fig\"><img src=\"" + esc(q.explanation_figure) + "\" alt=\"讲解图\"></div>";
    return h + "</div>";
  }
  function interactionHTML(t, q, revealed) {
    const A = api();
    const s = session[q.id] || {};
    const mark = A ? A.getMark(t.topic_id, q.id) : null;
    if (q.mode === "choice") {
      const done = typeof s.pick === "number" || s.result === "revealed";
      let h = "<ol class=\"opts\" role=\"list\">";
      permOf(t, q).forEach(function (i, pos) {
        const o = q.options[i];
        let cls = "";
        if (done || revealed) {
          if (i === q.answer_index) cls = " is-right";
          else if (done && i === s.pick) cls = " is-wrong";
        }
        h += "<li><button type=\"button\" class=\"opt" + cls + "\" data-pick=\"" + i + "\"" + (done ? " disabled" : "") + "><b>(" + (pos + 1) + ")</b> " + richText(o) + "</button></li>";
      });
      h += "</ol>";
      if (s.result === "revealed") h += "<p class=\"result no\">先看了答案，这次不算做对。</p>";
      else if (done) h += resultHTML(t, s.result);
      return h;
    }
    if (q.mode === "exact") {
      const done = !!s.result;
      let h = "<div class=\"exact\"><input type=\"text\" class=\"exact-in\" inputmode=\"text\" autocomplete=\"off\" placeholder=\"在这里写答案\" value=\"" + esc(s.typed || "") + "\"" + (done ? " disabled" : "") + ">" +
        "<button type=\"button\" class=\"btn-check\" data-check=\"1\"" + (done ? " disabled" : "") + ">检查答案</button></div>";
      if (s.result === "revealed") h += "<p class=\"result no\">先看了答案，这次不算做对。</p>";
      else if (done) {
        h += resultHTML(t, s.result);
        if (s.result === "wrong") h += "<button type=\"button\" class=\"btn-override\" data-override=\"1\">我的写法不一样，其实是对的</button>";
      }
      return h;
    }
    if (q.mode === "multi") return multiHTML(t, q);
    if (q.mode === "parent") {
      const rec = A ? A.getOpen(q.id) : null;
      if (rec && rec.revealed) return revealedHTML();
      if (rec) {
        const label = { pending: "待家长确认", right: "家长批改：对", partial: "家长批改：部分对", wrong: "家长批改：不对" }[rec.status] || "待家长确认";
        return "<div class=\"open-done status-" + esc(rec.status) + "\"><div class=\"k\">我的答案</div><div class=\"mine\">" + esc(rec.text) + "</div>" +
          "<div class=\"open-status\">" + label + "</div>" +
          (rec.status === "pending" ? "<p class=\"open-note\">请爸爸妈妈点上面的「家长确认」来批改。批改以前，这题不算进花朵的进度。对算一题，部分对算半题。</p>" : "") +
          "<button type=\"button\" class=\"btn-redo\" data-redo=\"1\">重新写一次</button></div>";
      }
      return "<div class=\"open-box\"><textarea class=\"open-in\" rows=\"4\" placeholder=\"把你的答案写在这里\">" + esc(s.typed || "") + "</textarea>" +
        "<button type=\"button\" class=\"btn-submit\" data-submit=\"1\">交给家长批改</button>" +
        "<p class=\"open-note\">这题没有唯一的标准答案。写好交出去，爸爸妈妈会对照参考答案帮你批改。</p></div>";
    }
    // self-report
    if (!revealed) return "";
    return "<div class=\"self-check\"><p>对一下答案，你做对了吗？</p><div class=\"self-check-row\" role=\"group\">" +
      "<button type=\"button\" data-mark=\"right\" aria-pressed=\"" + (mark === "right") + "\">做对了</button>" +
      "<button type=\"button\" data-mark=\"wrong\" aria-pressed=\"" + (mark === "wrong") + "\">做错了</button></div></div>";
  }
  function revealedHTML() {
    return "<div class=\"open-done status-wrong\"><div class=\"open-status\">先看了答案，这次不算做对。</div>" +
      "<button type=\"button\" class=\"btn-redo\" data-redo=\"1\">重新做一次</button></div>";
  }
  const PART_LABEL = { pending: "待家长确认", right: "对", partial: "部分对", wrong: "不对" };
  function multiHTML(t, q) {
    const A = api(); const rec = A ? A.getOpen(q.id) : null; const s = session[q.id] || {};
    if (rec && rec.revealed) return revealedHTML();
    if (rec && rec.parts) {
      let h = "<div class=\"open-done multi-done status-" + esc(rec.status) + "\">";
      q.parts.forEach(function (p, i) {
        const r = rec.parts[i] || {};
        const st = r.auto ? (r.status === "right" ? "✔ 对" : "✘ 不对") : (r.status === "pending" ? "待家长确认" : "家长批改：" + PART_LABEL[r.status]);
        h += "<div class=\"part-row\"><div class=\"part-l\">" + esc(p.label) + (p.label && p.prompt ? " " : "") + esc(p.label ? "" : p.prompt) + "</div>" +
          "<div class=\"mine\">" + esc(r.text || "") + "</div><div class=\"part-st st-" + esc(r.status) + "\">" + st + "</div></div>";
      });
      const overall = rec.status === "pending" ? "还有小题等家长批改，批改完才算进花朵。" :
        { right: "整题：对", partial: "整题：部分对（算半题）", wrong: "整题：不对" }[rec.status];
      h += "<div class=\"open-status\">" + overall + "</div>";
      if (rec.status !== "pending" && A) h += "<p class=\"open-note\">这朵花现在 " + A.percentFor(t.topic_id) + "%。</p>";
      return h + "<button type=\"button\" class=\"btn-redo\" data-redo=\"1\">重新做一次</button></div>";
    }
    let h = "<div class=\"multi-box\">";
    q.parts.forEach(function (p, i) {
      const v = (s.typed && s.typed[i]) || "";
      const lab = "<span class=\"part-l\">" + esc(p.label || "") + "</span>" + (p.label ? "" : "<span class=\"part-p\">" + esc(p.prompt) + "</span>");
      h += "<label class=\"part-row part-in-row\">" + lab +
        (p.kind === "parent"
          ? "<textarea class=\"part-in\" data-part=\"" + i + "\" rows=\"2\" placeholder=\"写下这一小题的答案\">" + esc(v) + "</textarea>"
          : "<input class=\"part-in\" data-part=\"" + i + "\" type=\"text\" autocomplete=\"off\" inputmode=\"" + (p.label ? "text" : "numeric") + "\" placeholder=\"" + (p.label ? "答案" : "第几") + "\" value=\"" + esc(v) + "\">") +
        "</label>";
    });
    const anyParent = q.parts.some(function (p) { return p.kind === "parent"; });
    h += "<p class=\"pin-err part-err\" role=\"alert\"></p><button type=\"button\" class=\"btn-submit\" data-submit-multi=\"1\">" + (anyParent ? "提交（能自动判的先判，其余交给家长）" : "检查答案") + "</button></div>";
    return h;
  }
  function answeredNow(t, q) {
    const A = api(); const s = session[q.id] || {};
    if (q.mode === "choice") return typeof s.pick === "number" || s.result === "revealed";
    if (q.mode === "exact") return !!s.result;
    if (q.mode === "parent" || q.mode === "multi") return !!(A && A.getOpen(q.id));
    return true;
  }
  function resultHTML(t, result) {
    const A = api(); const pct = A ? A.percentFor(t.topic_id) : 0;
    return result === "right"
      ? "<p class=\"result ok\">✔ 答对了！这朵花现在 " + pct + "%。</p>"
      : "<p class=\"result no\">✘ 还不对，看看下面的答案和讲解。这朵花现在 " + pct + "%。</p>";
  }

  function renderPractice(t, filterId, index, revealed) {
    const all = questionsFor(t, null);
    const qs = sessionList(t, filterId);
    const counts = countsByTopic(t);
    const i = qs.length ? Math.max(0, Math.min(index, qs.length - 1)) : 0;
    const q = qs[i];
    const box = document.querySelector("#modal");
    const head = "<div class=\"modal-backdrop\" data-close=\"1\"></div><div class=\"modal-card practice-mode\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\">" +
      "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"关闭\">×</button>" +
      "<div class=\"practice-head\"><button class=\"practice-back\" type=\"button\" data-practice-back=\"1\">← 返回</button>" +
      "<div class=\"titles\"><div class=\"kicker\">练习题</div><h2 id=\"md-title\">" + esc(t.name_zh) + "</h2></div></div>";
    if (!q) {
      box.innerHTML = head + filtersHTML(t, filterId, counts, all.length) + "<p class=\"practice-empty\">这里还没有题目，换一个看看吧。</p></div>";
      bind(t, filterId, 0, false); return;
    }
    const b = bank();
    const ps = q.passage && b.passages ? b.passages[q.passage] : null;
    const passage = ps ? "<details class=\"q-passage\" open><summary>" + (q.subject === "Mathematics" || q.subject === "Science" || q.subject === "English" ? "Read first: " : "先读材料：") + "<b>" + esc(ps.title || "") + "</b></summary><div class=\"pbody\">" + passageHTML(ps.text) + "</div></details>" : "";
    const fig = q.figure ? "<div class=\"q-fig\"><img src=\"" + esc(q.figure) + "\" alt=\"题目的图\" decoding=\"async\"></div>" : "";
    const showAns = revealed || (session[q.id] && session[q.id].result) || ((q.mode === "parent" || q.mode === "multi") && api() && api().getOpen(q.id));
    const askFirst = !showAns && !answeredNow(t, q);
    box.innerHTML = head +
      filtersHTML(t, filterId, counts, all.length) +
      "<div class=\"practice-meta\">" + metaHTML(q) + "</div>" +
      passage + fig +
      "<div class=\"q-stem\" data-q=\"" + esc(q.id) + "\">" + richText(q.stem) + "</div>" +
      interactionHTML(t, q, revealed) +
      "<button class=\"btn-reveal" + (showAns ? " is-open" : "") + (askFirst ? " ask-first" : "") + "\" type=\"button\" data-reveal=\"1\">" + (showAns ? "收起答案" : (askFirst ? "先作答；不会做也可以看答案和讲解" : "看看答案和讲解")) + "</button>" +
      (showAns ? answerBoxHTML(q, t) : "") +
      "<div class=\"practice-nav\"><button class=\"btn-nav\" type=\"button\" data-nav=\"-1\"" + (i === 0 ? " disabled" : "") + ">上一题</button>" +
      "<div class=\"idx\">第 " + (i + 1) + " 道，共 " + qs.length + " 道</div>" +
      "<button class=\"btn-nav\" type=\"button\" data-nav=\"1\"" + (i === qs.length - 1 ? " disabled" : "") + ">下一题</button></div></div>";
    bind(t, filterId, i, !!showAns);
  }

  let keyHandler = null;
  function bind(t, filterId, index, revealed) {
    const box = document.querySelector("#modal");
    box.hidden = false; document.body.classList.add("modal-open");
    const q = sessionList(t, filterId)[index];
    const A = api();
    box.onclick = function (e) {
      if (e.target.dataset && e.target.dataset.close) { closeModal(); return; }
      if (e.target.closest("[data-practice-back]")) { openModal(t.topic_id); return; }
      const nav = e.target.closest("[data-nav]");
      if (nav && !nav.disabled) { renderPractice(t, filterId, index + Number(nav.dataset.nav), false); return; }
      const chip = e.target.closest("[data-filter]");
      if (chip) { renderPractice(t, chip.dataset.filter || null, 0, false); return; }
      if (!q) return;
      const pick = e.target.closest("[data-pick]");
      if (pick && !pick.disabled) {
        const k = Number(pick.dataset.pick);
        const res = k === q.answer_index ? "right" : "wrong";
        session[q.id] = { pick: k, result: res };
        if (A) A.markQuestion(t.topic_id, q.id, res);
        renderPractice(t, filterId, index, true); return;
      }
      if (e.target.closest("[data-check]")) {
        const inp = box.querySelector(".exact-in");
        const typed = inp ? inp.value : "";
        const res = checkExact(q, typed);
        if (!res) { inp && inp.focus(); return; }
        session[q.id] = { typed: typed, result: res };
        if (A) A.markQuestion(t.topic_id, q.id, res);
        renderPractice(t, filterId, index, true); return;
      }
      if (e.target.closest("[data-override]")) {
        session[q.id] = Object.assign({}, session[q.id], { result: "right" });
        if (A) A.markQuestion(t.topic_id, q.id, "right");
        renderPractice(t, filterId, index, true); return;
      }
      if (e.target.closest("[data-submit]")) {
        const ta = box.querySelector(".open-in");
        const text = ta ? ta.value.trim() : "";
        if (!text) { ta && ta.focus(); return; }
        if (A) A.submitOpen(t.topic_id, q.id, text);
        renderPractice(t, filterId, index, true); return;
      }
      if (e.target.closest("[data-redo]")) {
        const rec = A ? A.getOpen(q.id) : null;
        session[q.id] = { typed: rec ? rec.text : "" };
        if (A) A.withdrawOpen(q.id);
        renderPractice(t, filterId, index, false); return;
      }
      if (e.target.closest("[data-submit-multi]")) {
        const ins = [...box.querySelectorAll(".part-in")];
        const empty = ins.find(function (x) { return !x.value.trim(); });
        if (empty) { empty.focus(); const er = box.querySelector(".part-err"); if (er) er.textContent = "每一小题都要写答案。"; return; }
        const answers = q.parts.map(function (p, i) {
          const v = ins[i].value.trim();
          return { text: v, result: p.kind === "exact" ? checkExact(p, v) : null };
        });
        session[q.id] = {};
        if (A) A.submitMulti(t.topic_id, q.id, answers);
        renderPractice(t, filterId, index, true); return;
      }
      const rv = e.target.closest("[data-reveal]");
      if (rv && !revealed && !answeredNow(t, q)) {
        // answering comes first; looking at the answer without answering counts as not correct
        if (!rv.dataset.sure) { rv.dataset.sure = "1"; rv.textContent = "先看答案的话，这题这次算没做对。确定要看吗？"; rv.classList.add("is-warn"); return; }
        if (q.mode === "choice" || q.mode === "exact") { session[q.id] = { result: "revealed" }; if (A) A.markQuestion(t.topic_id, q.id, "wrong"); }
        else if (A) A.revealUnanswered(t.topic_id, q.id);
        renderPractice(t, filterId, index, true); return;
      }
      const mk = e.target.closest("[data-mark]");
      if (mk) { if (A) A.markQuestion(t.topic_id, q.id, mk.dataset.mark); renderPractice(t, filterId, index, true); return; }
      if (e.target.closest("[data-reveal]")) renderPractice(t, filterId, index, !revealed);
    };
    const ta = box.querySelector(".open-in, .exact-in");
    if (ta && q) ta.addEventListener("input", function () { session[q.id] = Object.assign({}, session[q.id], { typed: ta.value }); });
    box.querySelectorAll(".part-in").forEach(function (el) {
      el.addEventListener("input", function () { const s = Object.assign({ typed: {} }, session[q.id]); s.typed = Object.assign({}, s.typed); s.typed[el.dataset.part] = el.value; session[q.id] = s; });
    });
    if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
    keyHandler = function (e) {
      if (!document.querySelector(".modal-card.practice-mode")) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); const c = box.querySelector("[data-check], [data-submit-multi]"); if (c) c.click(); }
        return;
      }
      const n = sessionList(t, filterId).length;
      if (e.key === "ArrowRight" && index < n - 1) { e.preventDefault(); renderPractice(t, filterId, index + 1, false); }
      else if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); renderPractice(t, filterId, index - 1, false); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); openModal(t.topic_id); }
    };
    document.addEventListener("keydown", keyHandler, true);
  }

  /* ---------- 家长确认 ---------- */
  function findQ(qid) {
    const b = bank(); if (!b || !b.idIndex) return null;
    const i = b.idIndex[qid]; return typeof i === "number" ? b.questions[i] : null;
  }
  function renderParentList() {
    const A = api(); const box = document.querySelector("#modal");
    const list = A ? A.openList() : [];
    const pending = list.filter(function (x) { return x.status === "pending"; });
    const done = list.filter(function (x) { return x.status !== "pending" && !x.revealed; }).slice(0, 20);
    function partsCard(x, q) {
      // one block per part: her answer, that part's reference answer and marking points; auto parts are already checked
      return q.parts.map(function (p, i) {
        const r = x.parts[i] || {};
        let h = "<div class=\"pc-part\"><div class=\"pc-part-h\">" + esc(p.label || p.prompt) + (p.label && p.prompt ? " <span class=\"pc-prompt\">" + esc(p.prompt) + "</span>" : "") + "</div>" +
          "<div class=\"k\">安安的答案</div><div class=\"mine\">" + esc(r.text || "") + "</div>" +
          "<div class=\"k\">参考答案</div><div class=\"ref\">" + richText(p.answer) + "</div>" +
          (p.marking_points && p.marking_points.length ? "<div class=\"k\">评分要点</div><ul class=\"mp\">" + p.marking_points.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "");
        if (r.auto) h += "<div class=\"pc-done\">已自动判：" + (r.status === "right" ? "对" : "不对") + "</div>";
        else if (r.status === "pending") h += "<div class=\"pc-row\"><button type=\"button\" data-judge=\"right\" data-part=\"" + i + "\">对</button><button type=\"button\" data-judge=\"partial\" data-part=\"" + i + "\">部分对</button><button type=\"button\" data-judge=\"wrong\" data-part=\"" + i + "\">不对</button></div>";
        else h += "<div class=\"pc-done\">已批改：" + ({ right: "对", partial: "部分对", wrong: "不对" })[r.status] + "</div>";
        return h + "</div>";
      }).join("");
    }
    function card(x, withButtons) {
      const q = findQ(x.qid); if (!q) return "";
      const t = (window.GARDEN_DATA.topics || []).find(function (y) { return y.topic_id === x.topic; });
      const b = bank(); const ps = q.passage && b.passages ? b.passages[q.passage] : null;
      const lab = { right: "对", partial: "部分对", wrong: "不对" }[x.status];
      return "<section class=\"pc-card\" data-qid=\"" + esc(x.qid) + "\">" +
        "<div class=\"pc-meta\">" + esc(q.subject_zh) + " · " + esc(t ? t.name_zh : "") + " · " + esc(q.marks ? q.marks + " 分" : "") + "</div>" +
        (ps ? "<details class=\"q-passage\"><summary>材料：<b>" + esc(ps.title || "") + "</b></summary><div class=\"pbody\">" + passageHTML(ps.text) + "</div></details>" : "") +
        (q.figure ? "<div class=\"q-fig\"><img src=\"" + esc(q.figure) + "\" alt=\"题目的图\"></div>" : "") +
        "<div class=\"q-stem small\">" + richText(q.stem) + "</div>" +
        (x.parts && q.parts ? partsCard(x, q) :
        "<div class=\"k\">安安的答案</div><div class=\"mine\">" + esc(x.text) + "</div>" +
        "<div class=\"k\">参考答案</div><div class=\"ref\">" + richText(q.answer) + "</div>") +
        (!x.parts && q.marking_points && q.marking_points.length ? "<div class=\"k\">评分要点</div><ul class=\"mp\">" + q.marking_points.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "") +
        (x.parts ? (withButtons ? "" : "<div class=\"pc-done\">整题：" + lab + " <button type=\"button\" class=\"pc-undo\" data-judge=\"pending\">改回待确认</button></div>") :
        withButtons ? "<div class=\"pc-row\"><button type=\"button\" data-judge=\"right\">对</button><button type=\"button\" data-judge=\"partial\">部分对</button><button type=\"button\" data-judge=\"wrong\">不对</button></div>"
          : "<div class=\"pc-done\">已批改：" + lab + " <button type=\"button\" class=\"pc-undo\" data-judge=\"pending\">改回待确认</button></div>") +
        "</section>";
    }
    box.innerHTML = "<div class=\"modal-backdrop\" data-close=\"1\"></div><div class=\"modal-card practice-mode parent-mode\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pc-title\">" +
      "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"关闭\">×</button>" +
      "<div class=\"practice-head\"><div class=\"titles\"><div class=\"kicker\">给爸爸妈妈</div><h2 id=\"pc-title\">家长确认</h2></div></div>" +
      "<p class=\"practice-note-ok\">这些是安安写的开放题答案（分小题的题目每一小题分开批改，能自动判的小题已经判好）。对照参考答案和评分要点，点「对 / 部分对 / 不对」。「对」算一题，「部分对」算半题，「不对」不算。看完请点右上角 × 关闭，关闭后要重新输入密码。</p>" +
      (pending.length ? pending.map(function (x) { return card(x, true); }).join("") : "<p class=\"practice-empty\">现在没有等待批改的答案。</p>") +
      (done.length ? "<h3 class=\"pc-h\">最近批改过的</h3>" + done.map(function (x) { return card(x, false); }).join("") : "") +
      "</div>";
    box.hidden = false; document.body.classList.add("modal-open");
    box.onclick = function (e) {
      if (e.target.dataset && e.target.dataset.close) { closeModal(); return; }
      const j = e.target.closest("[data-judge]");
      if (j && A) { if (!A.isParentUnlocked()) { renderPinEnter(); return; } A.confirmOpen(j.closest("[data-qid]").dataset.qid, j.dataset.judge, j.dataset.part); renderParentList(); }
    };
  }
  /* ---------- 家长密码 ---------- */
  let afterUnlock = null;
  function parentShell(title, body) {
    const box = document.querySelector("#modal");
    box.innerHTML = "<div class=\"modal-backdrop\" data-close=\"1\"></div><div class=\"modal-card practice-mode parent-mode pin-mode\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pc-title\">" +
      "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"关闭\">×</button>" +
      "<div class=\"practice-head\"><div class=\"titles\"><div class=\"kicker\">给爸爸妈妈</div><h2 id=\"pc-title\">" + esc(title) + "</h2></div></div>" + body + "</div>";
    box.hidden = false; document.body.classList.add("modal-open");
    return box;
  }
  function pinInput(name, label) {
    return "<label class=\"pin-l\">" + esc(label) + "<input class=\"pin-in\" name=\"" + name + "\" type=\"password\" inputmode=\"numeric\" pattern=\"[0-9]*\" maxlength=\"4\" autocomplete=\"off\"></label>";
  }
  const WHY = { format: "密码要是 4 位数字。", mismatch: "两次输入的密码不一样。", phrase: "家长确认语不对。", storage: "这台设备存不住密码。", locked: "请先输入原来的密码。" };
  function done() { const f = afterUnlock || renderParentList; afterUnlock = null; f(); }
  function renderPinSetup() {
    const box = parentShell("设置家长密码",
      "<p class=\"pin-note\">第一次打开「家长确认」，请爸爸妈妈设一个 <b>4 位数字密码</b>。以后批改开放题都要先输入这个密码，安安自己不能批改。</p>" +
      pinInput("pin", "新密码（4 位数字）") + pinInput("again", "再输入一次") +
      "<p class=\"pin-note pin-phrase\">忘记密码时：点「忘记密码？」，输入家长确认语 <b>我是家长</b>，再设新密码。已经交上来的答案和批改结果不会丢。请记住这句话，不要告诉安安。</p>" +
      "<p class=\"pin-err\" role=\"alert\"></p><button type=\"button\" class=\"btn-submit\" data-pin-save=\"1\">保存密码</button>");
    wirePin(box, function () {
      const r = api().setPin(val(box, "pin"), val(box, "again"));
      if (r.ok) { toast2("家长密码已经设好"); done(); } else showErr(box, WHY[r.why] || "没有设好，再试一次。");
    }, "[data-pin-save]");
  }
  function renderPinEnter(why) {
    const box = parentShell("输入家长密码",
      "<p class=\"pin-note\">" + esc(why || "批改开放题以前，请输入家长密码。") + "</p>" + pinInput("pin", "家长密码") +
      "<p class=\"pin-err\" role=\"alert\"></p><button type=\"button\" class=\"btn-submit\" data-pin-ok=\"1\">确定</button>" +
      "<button type=\"button\" class=\"pin-forgot\" data-pin-forgot=\"1\">忘记密码？</button>");
    wirePin(box, function () {
      const r = api().unlockParent(val(box, "pin"));
      if (r.ok) { done(); return; }
      box.querySelector("[name=pin]").value = "";
      showErr(box, r.why === "wait" ? "试错太多次了，请 " + r.wait + " 秒后再试。" : "密码不对" + (r.left ? "，还可以试 " + r.left + " 次。" : "。"));
    }, "[data-pin-ok]");
  }
  function renderPinForgot() {
    const box = parentShell("重设家长密码",
      "<p class=\"pin-note\">请输入设密码时看到的<b>家长确认语</b>（四个字），再设一个新密码。已经交上来的答案和批改结果都会保留。</p>" +
      "<label class=\"pin-l\">家长确认语<input class=\"pin-in pin-phrase-in\" name=\"phrase\" type=\"text\" autocomplete=\"off\"></label>" +
      pinInput("pin", "新密码（4 位数字）") + pinInput("again", "再输入一次") +
      "<p class=\"pin-err\" role=\"alert\"></p><button type=\"button\" class=\"btn-submit\" data-pin-reset=\"1\">重设密码</button>" +
      "<button type=\"button\" class=\"pin-forgot\" data-pin-back=\"1\">← 我想起来了</button>");
    wirePin(box, function () {
      const r = api().resetPin(val(box, "phrase"), val(box, "pin"), val(box, "again"));
      if (r.ok) { toast2("新的家长密码已经设好"); done(); } else showErr(box, WHY[r.why] || "没有设好，再试一次。");
    }, "[data-pin-reset]");
  }
  function val(box, name) { const el = box.querySelector("[name=\"" + name + "\"]"); return el ? el.value.trim() : ""; }
  function showErr(box, msg) { const el = box.querySelector(".pin-err"); if (el) el.textContent = msg; }
  function toast2(msg) { const el = document.querySelector("#toast"); if (!el) return; el.textContent = msg; el.hidden = false; setTimeout(function () { el.hidden = true; }, 2200); }
  function wirePin(box, submit, sel) {
    const first = box.querySelector(".pin-in"); if (first) setTimeout(function () { first.focus(); }, 30);
    box.onclick = function (e) {
      if (e.target.dataset && e.target.dataset.close) { afterUnlock = null; closeModal(); return; }
      if (e.target.closest(sel)) { submit(); return; }
      if (e.target.closest("[data-pin-forgot]")) { renderPinForgot(); return; }
      if (e.target.closest("[data-pin-back]")) { renderPinEnter(); return; }
    };
    box.onkeydown = function (e) { if (e.key === "Enter" && e.target.classList.contains("pin-in")) { e.preventDefault(); submit(); } };
  }
  function openParent(fn, why) {
    const A = api(); if (!A) return;
    afterUnlock = fn || null;
    if (!A.hasPin()) renderPinSetup();
    else if (!A.isParentUnlocked()) renderPinEnter(why);
    else done();
  }
  window.openParentReview = function () { openParent(null); };
  window.withParentPin = function (fn, label) {
    openParent(function () { closeModal(); fn(); }, label ? "「" + label + "」需要家长密码。" : null);
  };
  document.addEventListener("visibilitychange", function () { if (document.hidden && api()) api().lockParent(); });

  function enhancePracticeButton(id) {
    const box = document.querySelector("#modal");
    const prac = box && box.querySelector("#btn-practice");
    if (!prac) return;
    const t = DATA.topics.find(function (x) { return x.topic_id === id; });
    if (!t) return;
    const neu = prac.cloneNode(true);
    prac.parentNode.replaceChild(neu, prac);
    const qs = questionsFor(t);
    if (!bank() || !qs.length) { neu.disabled = true; neu.textContent = bank() ? "这里还没有题目" : "题库还没有加载出来"; return; }
    const open = qs.filter(function (q) { return q.mode === "parent" || (q.mode === "multi" && q.parts.some(function (p) { return p.kind === "parent"; })); }).length;
    neu.disabled = false;
    neu.innerHTML = "练习题<span class=\"btn-practice-count\">" + qs.length + " 道" + (open ? "（其中 " + open + " 道由家长批改）" : "") + "</span>";
    neu.addEventListener("click", function () { startSession(t); renderPractice(t, null, 0, false); });
  }

  const origOpen = window.openModal;
  window.openModal = function (id) {
    if (keyHandler) { document.removeEventListener("keydown", keyHandler, true); keyHandler = null; }
    origOpen(id); enhancePracticeButton(id);
  };
  const origClose = window.closeModal;
  window.closeModal = function () {
    if (keyHandler) { document.removeEventListener("keydown", keyHandler, true); keyHandler = null; }
    const box = document.querySelector("#modal"); if (box) box.onkeydown = null;
    if (api()) api().lockParent(); // 家长确认 locks again whenever the window is closed
    origClose();
  };
})();
