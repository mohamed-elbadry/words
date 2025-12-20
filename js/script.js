document.addEventListener('DOMContentLoaded', function () {

  /* =======================
     كلمات حسب القسم
  ======================= */
  const WORD_CATEGORIES = {
    general: {
      name: "معلومات عامة",
      words: [
        "مدرسة","مكتبة","كمبيوتر","شمس","حاسوب","بيت",
        "مستشفى","طبيب","تعليم","رياضة","كتاب","مسرح",
        "حديقة","نافذة","مطبخ","مصباح","طاولة"
      ]
    },
    people: {
      name: "شخصيات عامة",
      words: [
        "عباسالعقاد","أسامهالباز","فاروقجويدة","أحمدزويل",
        "هشامالجخ","عبدالرحمانالأبنودي","محمدصلاح","مصطفيشاهين",
        "عادلإمام","أمكلثوم"
      ]
    },
    football: {
      name: "لاعبين كرة",
      words: [
        "رونالدو","ميسي","صلاح","بنزيما",
        "هازرد","لوكاكو","كيفنديبروين","كرستيانو",
        "نيمار","مبابي",
        "أبوتريكه","الحضري","سيدمعوض","أحمدحسن"
      ]
    }
  };

  /* =======================
     إعدادات عامة
  ======================= */
  const gridSize = 8;
  const arabicChars = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

  let selectedCategory = null;
  let sourceWords = [];

  let levelIndex = 0;
  let grid = [];
  let wordPositions = [];
  let levelWords = [];
  let foundWords = [];
  let selectedCells = [];
  let isMouseDown = false;
  let score = 0;

  const ws = document.getElementById('wordsearch');
  const nextBtn = document.getElementById('next-btn');
  const backBtn = document.getElementById('back-btn');
  const audio = document.getElementById('success-audio');
  const scoreDisplay = document.getElementById('score');

  /* =======================
     اختيار القسم
  ======================= */
  window.selectCategory = function (key) {
    selectedCategory = key;
    sourceWords = WORD_CATEGORIES[key].words.map(w => w.replace(/ /g, "-")); // استبدال المسافات بعلامة داخل الشبكة

    document.getElementById('category-screen').style.display = "none";
    document.querySelector('.container').style.display = "block";

    levelIndex = 0;
    score = 0;
    updateScore();
    renderLevel();
  };

  /* =======================
     تحديث النقاط
  ======================= */
  function updateScore() {
    scoreDisplay.textContent = `النقاط: ${score}`;
  }

  /* =======================
     توليد كلمات المستوى
  ======================= */
  function generateLevelWords(levelIdx) {
    let count = Math.min(5 + levelIdx, 10);
    return sourceWords
      .filter(w => w.length >= 4 && w.length <= gridSize)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

  /* =======================
     رسم المستوى
  ======================= */
  function renderLevel() {
    ws.innerHTML = "";
    document.getElementById('msg').textContent = "";

    foundWords = [];
    selectedCells = [];
    wordPositions = [];
    levelWords = [];

    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));

    document.getElementById('level-info').textContent =
      `${WORD_CATEGORIES[selectedCategory].name} - المستوى ${levelIndex + 1}`;

    let generatedWords = generateLevelWords(levelIndex);

    generatedWords.forEach(word => {
      let directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: -1, dc: 1 }
      ];

      let placed = false;

      for (let t = 0; t < 100 && !placed; t++) {
        let dir = directions[Math.floor(Math.random() * directions.length)];
        let row = Math.floor(Math.random() * gridSize);
        let col = Math.floor(Math.random() * gridSize);

        let coords = [];
        let ok = true;

        for (let i = 0; i < word.length; i++) {
          let r = row + dir.dr * i;
          let c = col + dir.dc * i;

          if (
            r < 0 || c < 0 || r >= gridSize || c >= gridSize ||
            (grid[r][c] && grid[r][c] !== word[i])
          ) {
            ok = false;
            break;
          }
          coords.push({ row: r, col: c });
        }

        if (ok) {
          coords.forEach((p, i) => {
            // استبدال "-" بالفراغ داخل الشبكة
            grid[p.row][p.col] = word[i] === "-" ? " " : word[i];
          });
          wordPositions.push({ word, coords, wIdx: levelWords.length });
          levelWords.push(word);
          placed = true;
        }
      }
    });

    // ملء باقي الخلايا بحروف عشوائية
    for (let i = 0; i < gridSize; i++)
      for (let j = 0; j < gridSize; j++)
        if (!grid[i][j])
          grid[i][j] = arabicChars[Math.floor(Math.random() * arabicChars.length)];

    ws.style.gridTemplateColumns = `repeat(${gridSize}, 38px)`;

    grid.flat().forEach((char, idx) => {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = char;
      cell.dataset.key = Math.floor(idx / gridSize) + "," + idx % gridSize;

      cell.onmousedown = () => handleDown(cell);
      cell.onmouseenter = () => handleEnter(cell);
      cell.onmouseup = handleUp;

      cell.ontouchstart = e => {
        e.preventDefault();
        handleDown(cell);
      };

      cell.ontouchmove = e => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('cell')) handleEnter(el);
      };

      cell.ontouchend = e => {
        e.preventDefault();
        handleUp();
      };

      ws.appendChild(cell);
    });

    // عرض الكلمات بدون "-"
    document.getElementById('words-list').innerHTML =
      `<div class="words-row">
        ${levelWords.map((w, i) => `<span id="word-${i}">${w.replace(/-/g, " ")}</span>`).join('')}
       </div>`;

    nextBtn.disabled = true;
  }

  /* =======================
     التحكم في السحب
  ======================= */
  function handleDown(cell) {
    isMouseDown = true;
    selectedCells = [cell.dataset.key];
    cell.classList.add('selected');
  }

  function handleEnter(cell) {
    if (!isMouseDown) return;
    if (!selectedCells.includes(cell.dataset.key)) {
      cell.classList.add('selected');
      selectedCells.push(cell.dataset.key);
    }
  }

  function handleUp() {
    if (selectedCells.length) checkWord();
    ws.querySelectorAll('.selected').forEach(c => c.classList.remove('selected'));
    selectedCells = [];
    isMouseDown = false;
  }

  /* =======================
     التحقق من الكلمة
  ======================= */
  function checkWord() {
    wordPositions.forEach(({ coords, wIdx }) => {
      if (foundWords.includes(wIdx)) return;

      let keys = coords.map(c => `${c.row},${c.col}`);
      if (JSON.stringify(keys) === JSON.stringify(selectedCells)) {
        foundWords.push(wIdx);
        score += 5; // إضافة نقاط لكل كلمة
        updateScore();

        coords.forEach(c => {
          ws.children[c.row * gridSize + c.col]
            .classList.add(`found${wIdx % 8}`);
        });

        document.getElementById(`word-${wIdx}`).classList.add('word-found');
        audio && audio.play();
      }
    });

    if (foundWords.length === levelWords.length) {
      document.getElementById('msg').textContent = "🎉 أنهيت هذا المستوى!";
      nextBtn.disabled = false;
    }
  }

  /* =======================
     المستوى التالي
  ======================= */
  nextBtn.addEventListener('click', () => {
    levelIndex++;
    renderLevel();
  });

  /* =======================
     العودة للقائمة الرئيسية
  ======================= */
  backBtn.addEventListener('click', () => {
    document.querySelector('.container').style.display = "none";
    document.getElementById('category-screen').style.display = "block";
  });

});
