/* UI language for 安安's knowledge garden (2026-11-20: 调整所有UI页面为可选语言，准备中文和英文两个界面即可。 但是中文科目的页面只能是中文).
   - Every UI string lives in GARDEN_I18N below (zh + en). Page code calls T(key, vars) and never writes UI text itself.
   - The choice is kept in localStorage under LANG_KEY. It never reads or writes the progress key (anna-garden.progress.v1).
   - Chinese-subject pages (华文 / 高级华文) always show Chinese, whatever language is chosen.
   - Question text, options, answers and explanations are content: they stay in their textbook language and are not translated here. */
(function () {
  "use strict";
  var LANG_KEY = "anna-garden.lang.v1";
  var CN_SUBJECTS = { chinese: true, higher_chinese: true };

  var D = {
    zh: {
      "lang.label": "界面语言", "lang.zh": "中文", "lang.en": "English", "lang.cnOnly": "华文页面只用中文",
      "student.name": "安安",
      "page.title": "{name}的知识花园", "page.grade": "小学四年级 · P4", "page.grade5": "小学五年级 · P5", "grade.p4": "四年级", "grade.p5": "五年级", "aria.grade": "选年级",
      "aria.tabs": "学科", "aria.garden": "知识花园", "aria.close": "关闭", "aria.stars": "{n} 颗星", "aria.plot": "{name}，{status}",
      "aria.importFile": "选择进度文件", "aria.lang": "界面语言",
      "save.save": "保存进度", "save.parent": "家长确认", "save.export": "导出进度", "save.import": "导入进度", "save.reset": "重置进度",
      "save.last": "上次保存：{when}", "save.never": "还没有", "save.date": "{m}月{d}日 {hh}:{mm}",
      "foot.syllabus": "知识点名称来自新加坡小学数学、科学、英文和华文大纲。",
      "foot.saved": "练习题都是为{name}原创的。进度保存在这台设备的浏览器里，每做一题自动保存。",
      "reset.title": "要把进度清零吗？", "reset.body": "所有花朵都会变回种子。想留一份备份的话，先点「导出进度」。",
      "reset.no": "再想想", "reset.yes": "确定清零",
      "status.conquered": "已攻克", "status.progress": "进行中 {p}%", "status.todo": "未开始", "status.locked": "未解锁",
      "toast.storage": "这台设备暂时存不住进度", "toast.saved": "已经保存啦 · {time}", "toast.reset": "进度已经清零 · {time}",
      "toast.exported": "进度文件已经下载 · {time}", "toast.imported": "进度已经导入 · {time}",
      "toast.importOld": "这是旧题库的进度文件，新花园从零开始，不能导入。", "toast.importBad": "这个文件读不出来，花园没有改。",
      "err.topics": "知识点没有加载出来", "err.data": "数据没有加载出来。",
      "topic.helpGoal": "做对 {n} 道不同的题，花就会开。也可以直接点「我学会了」。",
      "topic.helpFlagged": "这是你点的「我学会了」。想再练练，就点下面。",
      "topic.helpDone": "做对的题已经够了，这朵花开啦。",
      "topic.helpNone": "这里还没有题目，学会了可以点下面的按钮。",
      "topic.more": "还要再练练", "topic.gotIt": "我学会了", "topic.meter": "这朵花现在 <b>{p}%</b>。", "topic.lead": "这一关你会：",
      "topic.practice": "练习题", "topic.lockedFirst": "先通关前面的知识点", "topic.bankSoon": "题库正在整理中，稍后就能在这里练习对应的练习题啦。",
      "tabs.soon": "即将开放", "soon.body": "这一科的知识点页面还在准备中，先去别的花园看看吧。",
      "vitals.water": "今天可以先给「{name}」浇浇水", "vitals.next": "下一株可以种「{name}」", "vitals.all": "这一科的花都开齐啦！",
      "vitals.learned": "学会了", "vitals.bloomed": "开花 {a}/{b}", "vitals.left": "还剩", "vitals.notYet": "还没开花", "vitals.plants": "株",
      "side.title": "还没开花的种子", "side.sub": "{subject}还有 {n} 个知识点等你浇灌",
      "legend.conquered": "🌼 已攻克（开花）", "legend.progress": "🌿 进行中（嫩芽会长高）", "legend.todo": "🌱 未开始（种子）",
      "q.answer": "答案", "q.modelAnswer": "参考答案", "q.markingParent": "评分要点（家长对照）", "q.marking": "评分要点", "q.steps": "解题思路",
      "q.explFig": "讲解图", "q.fig": "题目的图", "q.revealedNoCount": "先看了答案，这次不算做对。",
      "q.typeHere": "在这里写答案", "q.check": "检查答案", "q.override": "我的写法不一样，其实是对的",
      "q.open.pending": "待家长确认", "q.open.right": "家长批改：对", "q.open.partial": "家长批改：部分对", "q.open.wrong": "家长批改：不对",
      "q.mine": "我的答案", "q.openPendingNote": "请爸爸妈妈点上面的「家长确认」来批改。批改以前，这题不算进花朵的进度。对算一题，部分对算半题。",
      "q.rewrite": "重新写一次", "q.redo": "重新做一次", "q.writeHere": "把你的答案写在这里", "q.sendParent": "交给家长批改",
      "q.openNote": "这题没有唯一的标准答案。写好交出去，爸爸妈妈会对照参考答案帮你批改。",
      "q.selfCheck": "对一下答案，你做对了吗？", "q.gotRight": "做对了", "q.gotWrong": "做错了",
      "mark.right": "对", "mark.partial": "部分对", "mark.wrong": "不对", "mark.pending": "待家长确认",
      "q.autoRight": "✔ 对", "q.autoWrong": "✘ 不对", "q.parentSays": "家长批改：{x}",
      "q.multiPending": "还有小题等家长批改，批改完才算进花朵。",
      "q.whole.right": "整题：对", "q.whole.partial": "整题：部分对（算半题）", "q.whole.wrong": "整题：不对",
      "q.flowerNow": "这朵花现在 {p}%。", "q.partHere": "写下这一小题的答案", "q.partAnswer": "答案", "q.partWhich": "第几",
      "q.submitMulti": "提交（能自动判的先判，其余交给家长）",
      "q.correct": "✔ 答对了！这朵花现在 {p}%。", "q.notYet": "✘ 还不对，看看下面的答案和讲解。这朵花现在 {p}%。",
      "q.back": "← 返回", "q.kicker": "练习题", "q.empty": "这里还没有题目，换一个看看吧。", "q.readFirst": "先读材料：",
      "q.hide": "收起答案", "q.askFirst": "先作答；不会做也可以看答案和讲解", "q.show": "看看答案和讲解",
      "q.prev": "上一题", "q.next": "下一题", "q.idx": "第 {i} 道，共 {n} 道", "q.partEmpty": "每一小题都要写答案。",
      "q.revealWarn": "先看答案的话，这题这次算没做对。确定要看吗？",
      "q.count": "{n} 道", "q.countOpen": "（其中 {n} 道由家长批改）", "q.noneHere": "这里还没有题目", "q.bankNotLoaded": "题库还没有加载出来",
      "pc.kicker": "给爸爸妈妈", "pc.title": "家长确认", "pc.studentAnswer": "{name}的答案", "pc.auto": "已自动判：{x}", "pc.done": "已批改：{x}",
      "pc.undo": "改回待确认", "pc.whole": "整题：{x}", "pc.marks": "{n} 分", "pc.passage": "材料：",
      "pc.intro": "这些是{name}写的开放题答案（分小题的题目每一小题分开批改，能自动判的小题已经判好）。对照参考答案和评分要点，点「对 / 部分对 / 不对」。「对」算一题，「部分对」算半题，「不对」不算。看完请点右上角 × 关闭，关闭后要重新输入密码。",
      "pc.none": "现在没有等待批改的答案。", "pc.recent": "最近批改过的",
      "pc.btn.right": "对", "pc.btn.partial": "部分对", "pc.btn.wrong": "不对",
      "pin.why.format": "密码要是 4 位数字。", "pin.why.mismatch": "两次输入的密码不一样。", "pin.why.phrase": "家长确认语不对。",
      "pin.why.storage": "这台设备存不住密码。", "pin.why.locked": "请先输入原来的密码。", "pin.retry": "没有设好，再试一次。",
      "pin.setTitle": "设置家长密码",
      "pin.setNote": "第一次打开「家长确认」，请爸爸妈妈设一个 <b>4 位数字密码</b>。以后批改开放题都要先输入这个密码，{name}自己不能批改。",
      "pin.new": "新密码（4 位数字）", "pin.again": "再输入一次",
      "pin.phraseNote": "忘记密码时：点「忘记密码？」，输入家长确认语 <b>{phrase}</b>，再设新密码。已经交上来的答案和批改结果不会丢。请记住这句话，不要告诉{name}。",
      "pin.save": "保存密码", "pin.isSet": "家长密码已经设好",
      "pin.enterTitle": "输入家长密码", "pin.enterWhy": "批改开放题以前，请输入家长密码。", "pin.label": "家长密码", "pin.ok": "确定", "pin.forgot": "忘记密码？",
      "pin.wait": "试错太多次了，请 {s} 秒后再试。", "pin.wrong": "密码不对。", "pin.wrongLeft": "密码不对，还可以试 {n} 次。",
      "pin.resetTitle": "重设家长密码", "pin.resetNote": "请输入设密码时看到的<b>家长确认语</b>（四个字），再设一个新密码。已经交上来的答案和批改结果都会保留。",
      "pin.phraseLabel": "家长确认语", "pin.resetBtn": "重设密码", "pin.remember": "← 我想起来了", "pin.newSet": "新的家长密码已经设好",
      "pin.needs": "「{label}」需要家长密码。",
      "pin.setNoteReset": "还没有设过家长密码。要「{label}」，请爸爸妈妈先设一个 <b>4 位数字密码</b>。以后重置或导入进度都要先输入它，{name}自己不能操作。",
      "pin.newSetEnter": "新密码设好了。请输入新密码继续。「我是家长」只能重设密码，不能用来重置进度。",
      "pin.lockedLeft": "输错 5 次，已锁定。请 {t} 后再试。",
      "import.title": "用这个文件覆盖现在的进度吗？", "import.body": "现在的进度会被文件里的进度替换，换了就找不回来。想留一份的话，先点「导出进度」。",
      "import.no": "再想想", "import.yes": "确定覆盖",
    },
    en: {
      "lang.label": "Language", "lang.zh": "中文", "lang.en": "English", "lang.cnOnly": "华文页面只用中文",
      "student.name": "Anan",
      "page.title": "{name}'s Knowledge Garden", "page.grade": "Primary 4 · P4", "page.grade5": "Primary 5 · P5", "grade.p4": "Primary 4", "grade.p5": "Primary 5", "aria.grade": "Choose the year",
      "aria.tabs": "Subjects", "aria.garden": "Knowledge garden", "aria.close": "Close", "aria.stars": "{n} stars", "aria.stars_one": "1 star", "aria.plot": "{name}, {status}",
      "aria.importFile": "Choose a progress file", "aria.lang": "Language",
      "save.save": "Save", "save.parent": "Parent check", "save.export": "Download progress", "save.import": "Load progress", "save.reset": "Start over",
      "save.last": "Last saved: {when}", "save.never": "not yet", "save.date": "{d} {mon} {hh}:{mm}",
      "foot.syllabus": "Topic names come from the Singapore primary Maths, Science, English and Chinese syllabuses.",
      "foot.saved": "Every practice question was written just for {name}. Progress is saved in this device's browser after every question.",
      "reset.title": "Start the garden over?", "reset.body": "Every flower will turn back into a seed. To keep a copy, tap \"Download progress\" first.",
      "reset.no": "Not now", "reset.yes": "Yes, start over",
      "status.conquered": "Bloomed", "status.progress": "Growing {p}%", "status.todo": "Not started", "status.locked": "Locked",
      "toast.storage": "This device can't save progress right now", "toast.saved": "Saved! · {time}", "toast.reset": "Progress cleared · {time}",
      "toast.exported": "Progress file downloaded · {time}", "toast.imported": "Progress loaded · {time}",
      "toast.importOld": "This file is from the old question bank. The new garden starts fresh, so it can't be loaded.",
      "toast.importBad": "This file can't be read. Your garden hasn't changed.",
      "err.topics": "The topics didn't load", "err.data": "The garden didn't load.",
      "topic.helpGoal": "Get {n} different questions right and this flower will bloom. You can also tap \"I've got it\".",
      "topic.helpGoal_one": "Get 1 question right and this flower will bloom. You can also tap \"I've got it\".",
      "topic.helpFlagged": "You tapped \"I've got it\". Want more practice? Tap below.",
      "topic.helpDone": "You got enough questions right. This flower has bloomed!",
      "topic.helpNone": "No questions here yet. If you know this topic, tap the button below.",
      "topic.more": "I want more practice", "topic.gotIt": "I've got it", "topic.meter": "This flower is at <b>{p}%</b>.", "topic.lead": "In this topic, you will learn:",
      "topic.practice": "Practice", "topic.lockedFirst": "Finish the earlier topics first", "topic.bankSoon": "Questions are on the way. Soon you can practise here!",
      "tabs.soon": "Coming soon", "soon.body": "This subject's page isn't ready yet. Visit another garden for now!",
      "vitals.water": "Today, try watering \"{name}\"", "vitals.next": "Next, try planting \"{name}\"", "vitals.all": "Every flower in this subject has bloomed!",
      "vitals.learned": "Learned", "vitals.bloomed": "Bloomed {a}/{b}", "vitals.left": "Still to go", "vitals.notYet": "Not bloomed yet", "vitals.plants": "plants", "vitals.plants_one": "plant",
      "side.title": "Seeds waiting to bloom", "side.sub": "{n} {subject} topics are waiting for water", "side.sub_one": "1 {subject} topic is waiting for water",
      "legend.conquered": "🌼 Bloomed (a flower)", "legend.progress": "🌿 Growing (the sprout gets taller)", "legend.todo": "🌱 Not started (a seed)",
      "q.answer": "Answer", "q.modelAnswer": "Model answer", "q.markingParent": "Marking points (for parents)", "q.marking": "Marking points", "q.steps": "How to solve it",
      "q.explFig": "Explanation picture", "q.fig": "Question picture", "q.revealedNoCount": "You looked at the answer first, so this one doesn't count as right.",
      "q.typeHere": "Type your answer here", "q.check": "Check my answer", "q.override": "I wrote it differently, but I'm right",
      "q.open.pending": "Waiting for a parent to check", "q.open.right": "Parent says: right", "q.open.partial": "Parent says: partly right", "q.open.wrong": "Parent says: not right",
      "q.mine": "My answer", "q.openPendingNote": "Ask Mum or Dad to tap \"Parent check\" at the top to mark it. Until then, it doesn't count toward your flower. Right counts as one question; partly right counts as half.",
      "q.rewrite": "Write it again", "q.redo": "Try again", "q.writeHere": "Write your answer here", "q.sendParent": "Send it to Mum or Dad",
      "q.openNote": "There's more than one good answer here. Send it in, and Mum or Dad will check it against the model answer.",
      "q.selfCheck": "Check the answer. Did you get it right?", "q.gotRight": "I got it right", "q.gotWrong": "I got it wrong",
      "mark.right": "right", "mark.partial": "partly right", "mark.wrong": "not right", "mark.pending": "waiting for a parent",
      "q.autoRight": "✔ Right", "q.autoWrong": "✘ Not right", "q.parentSays": "Parent says: {x}",
      "q.multiPending": "Some parts are waiting for a parent. They count toward your flower once they're checked.",
      "q.whole.right": "Whole question: right", "q.whole.partial": "Whole question: partly right (counts as half)", "q.whole.wrong": "Whole question: not right",
      "q.flowerNow": "This flower is at {p}%.", "q.partHere": "Answer this part", "q.partAnswer": "Answer", "q.partWhich": "Which one?",
      "q.submitMulti": "Submit (some parts are checked now, a parent checks the rest)",
      "q.correct": "✔ Correct! This flower is at {p}%.", "q.notYet": "✘ Not quite. Look at the answer and explanation below. This flower is at {p}%.",
      "q.back": "← Back", "q.kicker": "Practice", "q.empty": "No questions here yet. Try another one!", "q.readFirst": "Read first: ",
      "q.hide": "Hide the answer", "q.askFirst": "Answer first. Stuck? You can still see the answer and explanation", "q.show": "See the answer and explanation",
      "q.prev": "Previous", "q.next": "Next", "q.idx": "Question {i} of {n}", "q.partEmpty": "Please answer every part.",
      "q.revealWarn": "If you look at the answer first, this one won't count as right. Still want to see it?",
      "q.count": "{n} questions", "q.count_one": "1 question", "q.countOpen": " ({n} checked by a parent)", "q.noneHere": "No questions here yet", "q.bankNotLoaded": "The questions haven't loaded yet",
      "pc.kicker": "For Mum and Dad", "pc.title": "Parent check", "pc.studentAnswer": "{name}'s answer", "pc.auto": "Checked automatically: {x}", "pc.done": "Marked: {x}",
      "pc.undo": "Undo", "pc.whole": "Whole question: {x}", "pc.marks": "{n} marks", "pc.marks_one": "1 mark", "pc.passage": "Passage: ",
      "pc.intro": "These are {name}'s answers to open-ended questions. Questions with parts are marked part by part, and parts that can be checked automatically are already done. Compare with the model answer and marking points, then tap Right, Partly right or Not right. Right counts as one question, partly right as half, and not right as zero. When you finish, tap × at the top right to close. You'll need the PIN again next time.",
      "pc.none": "Nothing is waiting to be marked.", "pc.recent": "Recently marked",
      "pc.btn.right": "Right", "pc.btn.partial": "Partly right", "pc.btn.wrong": "Not right",
      "pin.why.format": "The PIN must be 4 digits.", "pin.why.mismatch": "The two PINs don't match.", "pin.why.phrase": "That parent phrase isn't right.",
      "pin.why.storage": "This device can't save the PIN.", "pin.why.locked": "Please enter the current PIN first.", "pin.retry": "That didn't work. Please try again.",
      "pin.setTitle": "Set a parent PIN",
      "pin.setNote": "This is the first time \"Parent check\" is opened. Please choose a <b>4-digit PIN</b>. You'll need it every time you mark open-ended answers, so only a parent can mark them.",
      "pin.new": "New PIN (4 digits)", "pin.again": "Type it again",
      "pin.phraseNote": "If you forget the PIN, tap \"Forgot the PIN?\", type the parent phrase <b>{phrase}</b> (\"I am the parent\", in Chinese), then set a new PIN. Answers already sent in and marks you gave are kept. Please remember this phrase and don't tell {name}.",
      "pin.save": "Save PIN", "pin.isSet": "The parent PIN is set",
      "pin.enterTitle": "Enter the parent PIN", "pin.enterWhy": "Please enter the parent PIN before marking open-ended answers.", "pin.label": "Parent PIN", "pin.ok": "OK", "pin.forgot": "Forgot the PIN?",
      "pin.wait": "Too many tries. Please wait {s} seconds and try again.", "pin.wrong": "Wrong PIN.", "pin.wrongLeft": "Wrong PIN. {n} tries left.", "pin.wrongLeft_one": "Wrong PIN. 1 try left.",
      "pin.resetTitle": "Reset the parent PIN", "pin.resetNote": "Type the <b>parent phrase</b> you saw when you set the PIN (four Chinese characters), then choose a new PIN. Answers already sent in and marks you gave are kept.",
      "pin.phraseLabel": "Parent phrase", "pin.resetBtn": "Reset PIN", "pin.remember": "← I remember it now", "pin.newSet": "The new parent PIN is set",
      "pin.needs": "\"{label}\" needs the parent PIN.",
      "pin.setNoteReset": "No parent PIN has been set yet. To use \"{label}\", a parent must first choose a <b>4-digit PIN</b>. You'll need it every time you start over or load progress, so {name} can't do it by accident.",
      "pin.newSetEnter": "The new PIN is set. Please enter it to continue. The parent phrase can only change the PIN. It can't be used to start over.",
      "pin.lockedLeft": "5 wrong tries. Locked. Please try again in {t}.",
      "import.title": "Replace your progress with this file?", "import.body": "Your current progress will be replaced by what's in the file and can't be brought back. To keep a copy, tap \"Download progress\" first.",
      "import.no": "Not now", "import.yes": "Yes, replace it",
    }
  };
  /* names that come with the syllabus data: subjects, question types, topic groups and strands (zh text → en) */
  var TERMS = {
    subject: { math: ["数学", "Maths"], science: ["科学", "Science"], english: ["英文", "English"], higher_chinese: ["高级华文", "Higher Chinese"], chinese: ["华文", "Chinese"] },
    note: {
      math: ["这些都是为{name}原创的练习题，每道题都有分步讲解。", "Every question here was written just for {name}, and each one has a step-by-step explanation."],
      science: ["原创练习题，图都是按题目画的。开放题写好以后，由家长对照参考答案批改。", "Original practice questions, with pictures drawn for each one. Open-ended answers are checked by a parent against the model answer."],
      english: ["Original practice questions with step-by-step explanations. 开放题由家长批改。", "Original practice questions with step-by-step explanations. Open-ended answers are checked by a parent."],
      higher_chinese: ["原创练习题，短文和通知都是新写的。开放题由家长批改。", "原创练习题，短文和通知都是新写的。开放题由家长批改。"],
      chinese: ["原创练习题，短文和通知都是新写的。开放题由家长批改。", "原创练习题，短文和通知都是新写的。开放题由家长批改。"]
    },
    qtype: { "选择题": "Multiple choice", "简答题": "Short answer", "应用题": "Word problem", "分步题": "Structured", "开放题": "Open-ended", "填空": "Fill in the blanks",
      "改错": "Editing", "句子改写": "Rewriting sentences", "判断对错": "True or false", "选择": "Tick the answer", "排序": "Put in order", "问答题": "Answer the question", "写作": "Writing" },
    group: { "整数": "Whole numbers", "分数": "Fractions", "小数": "Decimals", "面积与体积": "Area and volume", "几何": "Geometry", "数据": "Data",
      "循环": "Cycles", "系统": "Systems", "能量": "Energy", "复习": "Review", "文法": "Grammar", "词汇": "Vocabulary", "填空与改错": "Cloze and editing",
      "造句": "Sentence building", "阅读": "Reading", "语文应用": "Language use", "写作": "Writing", "百分比": "Percentage", "比率": "Rate", "课文字词（暂定）": "Lesson words (provisional)" },
    strand: { "数与代数": "Number and algebra", "测量与几何": "Measurement and geometry", "统计": "Statistics", "循环": "Cycles", "系统": "Systems", "能量": "Energy",
      "三年级复习": "P3 review", "文法": "Grammar", "词汇": "Vocabulary", "填空与改错": "Cloze and editing", "造句": "Synthesis and transformation", "阅读": "Reading comprehension",
      "语文应用": "Language use", "写作": "Writing", "百分比": "Percentage", "比率": "Rate", "课文字词（暂定）": "Lesson words (provisional)" }
  };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function chosen() {
    try { var v = localStorage.getItem(LANG_KEY); return v === "en" ? "en" : "zh"; } catch (e) { return "zh"; }
  }
  var pageSubject = null;              // subject of the page on screen (set by the garden)
  function isCn(sid) { return !!CN_SUBJECTS[sid]; }
  /* language actually shown: Chinese-subject pages are always Chinese */
  function ui(sid) { return isCn(sid === undefined ? pageSubject : sid) ? "zh" : chosen(); }
  function fill(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  function T(key, vars, lang) {
    lang = lang || ui();
    var d = D[lang] || D.zh;
    vars = vars || {};
    if (vars.name === undefined) vars.name = (D[lang] || D.zh)["student.name"];
    var k = (vars.n === 1 && d[key + "_one"] !== undefined) ? key + "_one" : key;
    var s = d[k] !== undefined ? d[k] : D.zh[key];
    if (s === undefined) { if (window.console) console.warn("i18n: missing key", key); return key; }
    return fill(s, vars);
  }
  function term(kind, value, lang) {
    lang = lang || ui();
    var tbl = TERMS[kind] || {};
    if (kind === "subject" || kind === "note") {
      var pair = tbl[value]; if (!pair) return value || "";
      return fill(pair[lang === "en" ? 1 : 0], { name: T("student.name", null, lang) });
    }
    if (lang !== "en") return value || "";
    return tbl[value] !== undefined ? tbl[value] : (value || "");
  }
  function setLang(v) {
    v = v === "en" ? "en" : "zh";
    try { localStorage.setItem(LANG_KEY, v); } catch (e) { /* the choice just isn't remembered */ }
    applyStatic();
    try { document.dispatchEvent(new CustomEvent("garden:lang", { detail: { lang: v } })); } catch (e) { /* old browser */ }
  }
  /* 中文 / English switch; on Chinese-subject pages it stays visible, the page stays Chinese and a note says so */
  function toggleHTML(sid) {
    var c = chosen(), cn = isCn(sid === undefined ? pageSubject : sid), lang = ui(sid);
    return "<div class=\"lang-toggle\" role=\"group\" aria-label=\"" + T("aria.lang", null, lang) + "\">" +
      "<button type=\"button\" data-lang=\"zh\" aria-pressed=\"" + (c === "zh") + "\">" + D.zh["lang.zh"] + "</button>" +
      "<button type=\"button\" data-lang=\"en\" aria-pressed=\"" + (c === "en") + "\">" + D.en["lang.en"] + "</button>" +
      (cn ? "<span class=\"lang-note\">" + D.zh["lang.cnOnly"] + "</span>" : "") + "</div>";
  }
  /* static page text: elements carry data-i18n (text), data-i18n-html, data-i18n-aria, data-i18n-ph */
  function applyStatic() {
    var lang = ui();
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hans";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var badge = el.querySelector(".btn-parent-badge");
      el.textContent = T(el.getAttribute("data-i18n"), null, lang);
      if (badge) el.appendChild(badge);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", T(el.getAttribute("data-i18n-aria"), null, lang)); });
    document.querySelectorAll("[data-lang-slot]").forEach(function (el) { el.innerHTML = toggleHTML(); });
  }
  function dateText(p, lang) {
    lang = lang || ui();
    return T("save.date", { m: p.month, d: p.day, mon: MONTHS[Number(p.month) - 1] || p.month, hh: p.hour, mm: p.minute }, lang);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-lang]") : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    setLang(b.getAttribute("data-lang"));
  }, true);

  window.GARDEN_I18N = { dict: D, terms: TERMS, LANG_KEY: LANG_KEY };
  window.GardenI18n = {
    T: T, term: term, ui: ui, chosen: chosen, setLang: setLang, isCn: isCn, toggleHTML: toggleHTML, applyStatic: applyStatic, dateText: dateText,
    setPage: function (sid) { pageSubject = sid; }, page: function () { return pageSubject; }
  };
})();
