document.addEventListener('DOMContentLoaded', function () {

  const sourceWords = [
    "مدرسة","سيارة","مكتبة","بطريق","كمبيوتر","قطة","شمس","حاسوب","بيت",
    "زرافة","طاولة","دراجة","مطر","هاتف","مظلة","طائرة","سفينة","ملعقة",
    "حديقة","دب","هدية","مسرح","نافذة","شمعة","كتاب","مستشفى","طبيب",
    "صابون","حقيبة","بستان","جزيرة","مشروع","رياضة","تعليم","فراشة",
    "خروف","سلحفاة","نعامة","قهوة","ساعة","باب","شاطئ","شجرة","زيتون",
    "عصفور","وردة","ورق","مسبح","أرنب"
  ];

  const colors = [
    {bg:'#ffe47f'},{bg:'#ffd6e5'},{bg:'#e3f9fd'},{bg:'#dfcdfa'},
    {bg:'#caffec'},{bg:'#fff2ba'},{bg:'#ffe49d'},{bg:'#b1ffd0'}
  ];

  const arabicChars = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

  const gridSize = 8;
  let levelIndex = 0;
  let grid = [];
  let wordPositions = [];
  let levelWords = [];
  let foundWords = [];
  let selectedCells = [];
  let isMouseDown = false;

  const ws = document.getElementById('wordsearch');
  const nextBtn = document.getElementById('next-btn');
  const audio = document.getElementById('success-audio');

  function generateLevelWords(levelIdx) {
    let count = Math.min(5 + levelIdx, 10);
    return sourceWords
      .filter(w => w.length >= 4 && w.length <= gridSize)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

  function renderLevel() {
    ws.innerHTML = "";
    document.getElementById('msg').textContent = "";

    foundWords = [];
    selectedCells = [];
    wordPositions = [];
    levelWords = [];

    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    document.getElementById('level-info').textContent = `المستوى: ${levelIndex + 1}`;

    let generatedWords = generateLevelWords(levelIndex);

    generatedWords.forEach(word => {
      let directions = [
        {dr:0, dc:1},{dr:1, dc:0},{dr:1, dc:1},{dr:-1, dc:1}
      ];

      let placed = false;

      for (let t = 0; t < 100 && !placed; t++) {
        let dir = directions[Math.floor(Math.random()*directions.length)];
        let row = Math.floor(Math.random()*gridSize);
        let col = Math.floor(Math.random()*gridSize);

        let coords = [];
        let ok = true;

        for (let i = 0; i < word.length; i++) {
          let r = row + dir.dr * i;
          let c = col + dir.dc * i;
          if (r<0||c<0||r>=gridSize||c>=gridSize ||
             (grid[r][c] && grid[r][c] !== word[i])) {
            ok = false;
            break;
          }
          coords.push({row:r,col:c});
        }

        if (ok) {
          coords.forEach((p,i)=>grid[p.row][p.col]=word[i]);
          wordPositions.push({word, coords, wIdx: levelWords.length});
          levelWords.push(word);
          placed = true;
        }
      }
    });

    for (let i=0;i<gridSize;i++)
      for (let j=0;j<gridSize;j++)
        if (!grid[i][j])
          grid[i][j] = arabicChars[Math.floor(Math.random()*arabicChars.length)];

    ws.style.gridTemplateColumns = `repeat(${gridSize}, 38px)`;

    grid.flat().forEach((char, idx) => {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = char;
      cell.dataset.key = Math.floor(idx/gridSize)+","+idx%gridSize;
      cell.onmousedown = ()=>handleDown(cell);
      cell.onmouseenter = ()=>handleEnter(cell);
      cell.onmouseup = handleUp;
      ws.appendChild(cell);
    });

    document.getElementById('words-list').innerHTML =
      `<div class="words-row">${levelWords.map((w,i)=>`<span id="word-${i}">${w}</span>`).join('')}</div>`;

    nextBtn.disabled = true;
  }

  function handleDown(cell){
    isMouseDown = true;
    selectedCells = [cell.dataset.key];
    cell.classList.add('selected');
  }

  function handleEnter(cell){
    if(!isMouseDown) return;
    if(!selectedCells.includes(cell.dataset.key)){
      cell.classList.add('selected');
      selectedCells.push(cell.dataset.key);
    }
  }

  function handleUp(){
    if(selectedCells.length) checkWord();
    ws.querySelectorAll('.selected').forEach(c=>c.classList.remove('selected'));
    selectedCells = [];
    isMouseDown = false;
  }

  function checkWord(){
    wordPositions.forEach(({word,coords,wIdx})=>{
      if(foundWords.includes(wIdx)) return;
      let keys = coords.map(c=>`${c.row},${c.col}`);
      if(JSON.stringify(keys) === JSON.stringify(selectedCells)){
        foundWords.push(wIdx);
        coords.forEach(c=>{
          ws.children[c.row*gridSize+c.col]
            .classList.add(`found${wIdx%8}`);
        });
        document.getElementById(`word-${wIdx}`).classList.add('word-found');
        audio && audio.play();
      }
    });

    if(foundWords.length === levelWords.length){
      document.getElementById('msg').textContent = "🎉 أنهيت هذا المستوى!";
      nextBtn.disabled = false;
    }
  }

  function nextLevel(){
    levelIndex++;
    renderLevel();
  }

  nextBtn.addEventListener('click', nextLevel);
  renderLevel();

});
