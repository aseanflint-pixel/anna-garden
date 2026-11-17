/* Practice-view logic for 安安's knowledge garden.
   Wraps the existing openModal so the garden layout and demo progress stay the same.
*/
(function () {
  "use strict";

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function topicIdsOf(t) {
    const ids = [];
    function add(id) {
      if (id && ids.indexOf(id) === -1) ids.push(id);
    }
    add(t.topic_id);
    (t.learning_outcomes || []).forEach(function (lo) { add(lo.topic_id); });
    return ids;
  }

  function bank() {
    return window.PRACTICE_BANK || null;
  }

  function questionsFor(t, filterId) {
    const b = bank();
    if (!b || !b.questions) return [];
    const ids = filterId ? [filterId] : topicIdsOf(t);
    const seen = {};
    const list = [];
    ids.forEach(function (id) {
      const idxs = (b.byTopic && b.byTopic[id]) || [];
      idxs.forEach(function (i) {
        if (seen[i]) return;
        seen[i] = true;
        const q = b.questions[i];
        if (q) list.push(q);
      });
    });
    return list;
  }

  function loLabel(t, topicId) {
    const lo = (t.learning_outcomes || []).find(function (x) { return x.topic_id === topicId; });
    if (lo && lo.text_zh) return lo.text_zh;
    if (topicId === t.topic_id) return t.name_zh;
    return topicId;
  }

  function countsByTopic(t) {
    const b = bank();
    const out = {};
    topicIdsOf(t).forEach(function (id) {
      out[id] = b && b.byTopic && b.byTopic[id] ? b.byTopic[id].length : 0;
    });
    return out;
  }

  function enhancePracticeButton(id) {
    const box = document.querySelector("#modal");
    if (!box) return;
    const prac = box.querySelector("#btn-practice");
    const note = box.querySelector(".practice-note");
    if (!prac) return;
    const t = DATA && DATA.topics ? DATA.topics.find(function (x) { return x.topic_id === id; }) : null;
    if (!t) return;

    const neu = prac.cloneNode(true);
    prac.parentNode.replaceChild(neu, prac);

    if (!bank()) {
      neu.disabled = true;
      neu.textContent = "题库还没有加载出来";
      if (note) {
        note.hidden = false;
        note.textContent = "请把这个页面和 assets 文件夹放在一起打开。";
      }
      return;
    }

    const qs = questionsFor(t);
    if (qs.length === 0) {
      neu.disabled = true;
      neu.textContent = "这个知识点还没有通过核对的真题";
      if (note) {
        note.hidden = false;
        note.textContent = "题库里暂时没有已核对通过、标在这个知识点上的题目。";
      }
      return;
    }

    neu.disabled = false;
    neu.innerHTML = "练习真题<span class=\"btn-practice-count\">" + qs.length + " 道已核对</span>";
    neu.addEventListener("click", function () {
      openPractice(t, null, 0);
    });
  }

  function renderFilters(t, filterId, counts, total) {
    const ids = topicIdsOf(t);
    if (ids.length <= 1) return "";
    const chips = [
      "<button type=\"button\" data-filter=\"\" aria-pressed=\"" + (!filterId ? "true" : "false") + "\">全部 <span class=\"n\">" + total + "</span></button>"
    ];
    ids.forEach(function (id) {
      const n = counts[id] || 0;
      if (!n) return;
      const pressed = filterId === id ? "true" : "false";
      chips.push(
        "<button type=\"button\" data-filter=\"" + esc(id) + "\" aria-pressed=\"" + pressed + "\" title=\"" + esc(id) + "\">" +
          esc(loLabel(t, id)) + " <span class=\"n\">" + n + "</span></button>"
      );
    });
    return "<div class=\"practice-filters\" role=\"tablist\" aria-label=\"按小知识点筛选\">" + chips.join("") + "</div>";
  }

  function metaLine(q) {
    const chips = [];
    if (q.level) chips.push(q.level);
    if (q.subject_zh) chips.push(q.subject_zh);
    else if (q.subject) chips.push(q.subject);
    chips.push(q.school || "");
    if (q.year) chips.push(String(q.year));
    if (q.exam) chips.push(q.exam);
    if (q.paper) chips.push(q.paper);
    if (q.q_label) chips.push(q.q_label);
    if (q.marks) chips.push(q.marks + " 分");
    if (q.type_zh) chips.push(q.type_zh);
    return chips.filter(Boolean).map(function (c) {
      return "<span class=\"chip\">" + esc(c) + "</span>";
    }).join("");
  }

  function renderPractice(t, filterId, index, revealed) {
    const all = questionsFor(t, null);
    const qs = questionsFor(t, filterId);
    const counts = countsByTopic(t);
    const safeIndex = qs.length ? Math.max(0, Math.min(index, qs.length - 1)) : 0;
    const q = qs[safeIndex];
    const box = document.querySelector("#modal");

    if (!qs.length) {
      box.innerHTML =
        "<div class=\"modal-backdrop\" data-close=\"1\"></div>" +
        "<div class=\"modal-card practice-mode\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\">" +
          "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"关闭\">×</button>" +
          "<div class=\"practice-head\">" +
            "<button class=\"practice-back\" type=\"button\" data-practice-back=\"1\">← 返回</button>" +
            "<div class=\"titles\"><div class=\"kicker\">练习真题</div><h2 id=\"md-title\">" + esc(t.name_zh) + "</h2></div>" +
          "</div>" +
          renderFilters(t, filterId, counts, all.length) +
          "<p class=\"practice-empty\">这个小知识点还没有通过核对的真题，换一个看看吧。</p>" +
        "</div>";
      bindPractice(t, filterId, 0);
      return;
    }

    const img = q.image
      ? "<img src=\"" + esc(q.image) + "\" alt=\"" + esc((q.school || "") + " " + (q.year || "") + " " + (q.q_label || q.question || "题目")) + "\" loading=\"eager\" decoding=\"async\">"
      : "<div class=\"q-missing\">这道题的图片还没有准备好。</div>";

    const answerBlock = revealed
      ? "<div class=\"answer-box\">" +
          "<div class=\"k\">核对通过的答案</div>" +
          "<div class=\"v\">" + esc(q.answer || "（没有写下答案）") + "</div>" +
          (q.explanation ? "<div class=\"exp\">" + esc(q.explanation) + "</div>" : "") +
        "</div>"
      : "";

    box.innerHTML =
      "<div class=\"modal-backdrop\" data-close=\"1\"></div>" +
      "<div class=\"modal-card practice-mode\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"md-title\">" +
        "<button class=\"modal-x\" type=\"button\" data-close=\"1\" aria-label=\"关闭\">×</button>" +
        "<div class=\"practice-head\">" +
          "<button class=\"practice-back\" type=\"button\" data-practice-back=\"1\">← 返回</button>" +
          "<div class=\"titles\">" +
            "<div class=\"kicker\">练习真题 · " + esc(t.topic_id) + "</div>" +
            "<h2 id=\"md-title\">" + esc(t.name_zh) + "</h2>" +
          "</div>" +
        "</div>" +
        "<p class=\"practice-note-ok\">这些都是已经核对通过的真题。先自己做，做好了再点开答案。</p>" +
        renderFilters(t, filterId, counts, all.length) +
        "<div class=\"practice-meta\">" + metaLine(q) + "</div>" +
        "<div class=\"q-frame\">" + img + "</div>" +
        "<div class=\"practice-nav\">" +
          "<button class=\"btn-nav\" type=\"button\" data-nav=\"-1\"" + (safeIndex === 0 ? " disabled" : "") + ">上一题</button>" +
          "<div class=\"idx\">第 " + (safeIndex + 1) + " 道，共 " + qs.length + " 道</div>" +
          "<button class=\"btn-nav\" type=\"button\" data-nav=\"1\"" + (safeIndex === qs.length - 1 ? " disabled" : "") + ">下一题</button>" +
        "</div>" +
        "<button class=\"btn-reveal" + (revealed ? " is-open" : "") + "\" type=\"button\" data-reveal=\"1\" aria-expanded=\"" + (revealed ? "true" : "false") + "\">" +
          (revealed ? "收起答案" : "看看答案") +
        "</button>" +
        answerBlock +
      "</div>";
    bindPractice(t, filterId, safeIndex, revealed);
  }

  let practiceKeyHandler = null;

  function bindPractice(t, filterId, index, revealed) {
    const box = document.querySelector("#modal");
    box.hidden = false;
    document.body.classList.add("modal-open");

    box.onclick = function (e) {
      if (e.target.dataset.close) {
        closeModal();
        return;
      }
      if (e.target.closest("[data-practice-back]")) {
        openModal(t.topic_id);
        return;
      }
      const nav = e.target.closest("[data-nav]");
      if (nav && !nav.disabled) {
        const next = index + Number(nav.dataset.nav);
        renderPractice(t, filterId, next, false);
        return;
      }
      const chip = e.target.closest("[data-filter]");
      if (chip && chip.closest(".practice-filters")) {
        const fid = chip.dataset.filter || null;
        renderPractice(t, fid, 0, false);
        return;
      }
      if (e.target.closest("[data-reveal]")) {
        renderPractice(t, filterId, index, !revealed);
      }
    };

    if (practiceKeyHandler) {
      document.removeEventListener("keydown", practiceKeyHandler, true);
    }
    practiceKeyHandler = function (e) {
      const card = document.querySelector(".modal-card.practice-mode");
      if (!card) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const qs = questionsFor(t, filterId);
        if (index < qs.length - 1) renderPractice(t, filterId, index + 1, false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (index > 0) renderPractice(t, filterId, index - 1, false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        openModal(t.topic_id);
      }
    };
    document.addEventListener("keydown", practiceKeyHandler, true);
  }

  function openPractice(t, filterId, index) {
    renderPractice(t, filterId, index || 0, false);
  }

  const origOpen = window.openModal;
  window.openModal = function (id) {
    if (practiceKeyHandler) {
      document.removeEventListener("keydown", practiceKeyHandler, true);
      practiceKeyHandler = null;
    }
    origOpen(id);
    enhancePracticeButton(id);
  };

  const origClose = window.closeModal;
  window.closeModal = function () {
    if (practiceKeyHandler) {
      document.removeEventListener("keydown", practiceKeyHandler, true);
      practiceKeyHandler = null;
    }
    origClose();
  };
})();
