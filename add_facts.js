const fs = require('fs');

function updateLoadingScreen(filename, factsArray) {
  let content = fs.readFileSync(filename, 'utf8');

  // 1. Add CSS for facts
  if (!content.includes('.fact-text')) {
    const cssTarget = '.progress-text {';
    const cssNew = `.fact-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.95rem;
      margin-top: 15px;
      min-height: 45px;
      transition: opacity 0.5s ease-in-out;
      opacity: 0;
    }
    .fact-text.visible {
      opacity: 1;
    }
    .progress-text {`;
    content = content.replace(cssTarget, cssNew);
  }

  // 2. Add HTML element for facts
  if (!content.includes('id="fact-text"')) {
    const htmlTarget = '<div id="progress-text" class="progress-text">0%</div>';
    const htmlNew = `<div id="progress-text" class="progress-text">0%</div>
      <div id="fact-text" class="fact-text"></div>`;
    content = content.replace(htmlTarget, htmlNew);
  }

  // 3. Add JS logic for rotating facts
  if (!content.includes('const facts = [')) {
    const jsTarget = "const progressText = document.getElementById('progress-text');";
    const jsNew = `const progressText = document.getElementById('progress-text');
    const factText = document.getElementById('fact-text');
    
    const facts = ${JSON.stringify(factsArray)};
    
    let currentFactIndex = 0;
    let factInterval;
    
    function showNextFact() {
      if(factText) {
        factText.classList.remove('visible');
        setTimeout(() => {
          factText.textContent = facts[currentFactIndex];
          factText.classList.add('visible');
          currentFactIndex = (currentFactIndex + 1) % facts.length;
        }, 500); // Wait for fade out
      }
    }
    
    // Start showing facts immediately
    showNextFact();
    factInterval = setInterval(showNextFact, 4000); // Change fact every 4 seconds
    `;
    content = content.replace(jsTarget, jsNew);
  }

  // 4. Stop the interval when loading is finished
  if (!content.includes('clearInterval(factInterval);')) {
    // When progress hits 100, we clear the interval
    const finishTarget = "loadingScreen.classList.add('fade-out');";
    const finishNew = `clearInterval(factInterval);\n        loadingScreen.classList.add('fade-out');`;
    content = content.replace(finishTarget, finishNew);
    
    const errorTarget = "progressText.textContent = 'خطأ في التحميل';";
    const errorNew = `progressText.textContent = 'خطأ في التحميل';\n        clearInterval(factInterval);`;
    content = content.replace(errorTarget, errorNew);
  }

  fs.writeFileSync(filename, content);
  console.log('Updated ' + filename);
}

const wingedBullsFacts = [
  "هل تعلم؟ الثيران المجنحة (لاماسو) كانت توضع على بوابات القصور الآشورية لحمايتها.",
  "جاري تحميل المجسم ثلاثي الأبعاد... قد يستغرق هذا بضع ثوانٍ بسبب دقة التفاصيل العالية.",
  "قصر اسرحدون تم بناؤه في القرن السابع قبل الميلاد.",
  "المجسم يتضمن تفاصيل دقيقة لنقوش مسمارية توثق تاريخ الإمبراطورية الآشورية.",
  "بعد اكتمال التحميل الأول، سيعمل التطبيق بدون إنترنت في المرات القادمة!"
];
updateLoadingScreen('winged_bulls.html', wingedBullsFacts);

const tutunjiFacts = [
  "هل تعلم؟ بيت التوتنجي هو أحد أجمل البيوت التراثية في مدينة الموصل القديمة.",
  "جاري تحميل المجسم ثلاثي الأبعاد... يرجى الانتظار بينما نجهز لك تفاصيل البيت.",
  "يتميز البيت بالزخارف الجصية (الفرش الموصلي) والساحة الداخلية (الحوش).",
  "تم بناء البيت في أواخر العهد العثماني ويعكس روعة العمارة الموصلية.",
  "بعد اكتمال التحميل الأول، سيعمل التطبيق بدون إنترنت في المرات القادمة!"
];
updateLoadingScreen('tutunji_house_iwan.html', tutunjiFacts);

const nuriFacts = [
  "هل تعلم؟ جامع النوري هو أحد أقدم وأهم الجوامع في مدينة الموصل.",
  "جاري تحميل المجسم ثلاثي الأبعاد... هذا المجسم عالي الدقة وقد يأخذ بعض الوقت.",
  "اشتهر الجامع بمئذنته الحدباء المائلة التي تعتبر رمزاً لمدينة الموصل.",
  "تم بناء الجامع في القرن الثاني عشر الميلادي على يد نور الدين زنكي.",
  "بعد اكتمال التحميل الأول، سيعمل التطبيق بدون إنترنت في المرات القادمة!"
];
updateLoadingScreen('al_nuri_crypt.html', nuriFacts);
