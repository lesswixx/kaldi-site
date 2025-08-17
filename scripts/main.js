// === Единый main.js — без дублирования, с защитой от кэша и “капризных” мобильных браузеров ===
(() => {
  'use strict';

  // ===== Утилиты =====
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"'`=\\/]/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;','\\':'&#92;'
    })[s] || s);
  }
  function formatPrice(n){ n = Number(n||0); return n.toLocaleString('ru-RU'); }
  function queryParam(name){ try { return new URL(location.href).searchParams.get(name); } catch { return null; } }

  // ===== Активное меню =====
  function setActiveNavLinks(){
    const current = location.pathname.split('/').pop() || 'index.html';
    $$('.nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current) a.classList.add('active');
      if ((current === 'index.html') && (href === 'index.html' || href === '#about')) a.classList.add('active');
    });
  }

  // ===== Заглушка бронирования (если нужно) =====
  window.bookingStub = function(e){
    e && e.preventDefault();
    alert('Онлайн-бронирование скоро будет доступно. Оставьте заявку в контактах или позвоните нам.');
  };

  // ===== Burger / мобильное меню =====
  function ensureNavMask(){
    if (!$('.nav-mask')) {
      const m = document.createElement('div');
      m.className = 'nav-mask';
      document.body.appendChild(m);
    }
  }

  // Встроенный off-canvas на случай, когда media-query не срабатывает (веб-вью Telegram/VK и т.п.)
  function ensureInlineMobileNav(nav){
    if (!nav) return false;
    const mqMobile = window.matchMedia('(max-width: 900px)').matches;
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /(Mobile|iP(hone|od|ad)|Android|Windows Phone)/i.test(ua);
    const likelyMobileButWide = isTouch && isMobileUA && !mqMobile && window.innerWidth <= 1024;

    if (!likelyMobileButWide) return false;
    if (!nav.dataset.inlineMobile) {
      nav.dataset.inlineMobile = '1';
      Object.assign(nav.style, {
        position: 'fixed', top: '0', right: '-100%',
        height: '100vh', width: '78vw',
        background: 'var(--white, #fff)', padding: '70px 18px 18px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'right .28s ease', zIndex: '1001',
        boxShadow: '-12px 0 36px rgba(0,0,0,.12)'
      });
    }
    return true;
  }

  // SVG-иконка бургера (два слоя: burger & close). Меняем их opacity — центр идеальный
function ensureBurgerSVG(burger){
  if (!burger) return;
  if (burger.querySelector('svg.burger-svg')) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class','burger-svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('width','24');
  svg.setAttribute('height','24');
  svg.setAttribute('aria-hidden','true');

  const makeLine = (x1,y1,x2,y2) => {
    const l = document.createElementNS(svgNS,'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    return l;
  };

  // Слой “бургер”: три ровные горизонтальные линии
  const gBurger = document.createElementNS(svgNS,'g');
  gBurger.setAttribute('class','icon-burger');
  gBurger.appendChild(makeLine(4,6,20,6));
  gBurger.appendChild(makeLine(4,12,20,12));
  gBurger.appendChild(makeLine(4,18,20,18));

  // Слой “крестик”: две диагонали, сходятся точно в центре (12,12)
  const gClose = document.createElementNS(svgNS,'g');
  gClose.setAttribute('class','icon-close');
  gClose.appendChild(makeLine(6,6,18,18));
  gClose.appendChild(makeLine(18,6,6,18));

  svg.appendChild(gBurger);
  svg.appendChild(gClose);
  burger.appendChild(svg);
}
// Прячем бургер на десктопе; показываем на моб/тач (включая in-app браузеры)
function syncBurgerVisibility(){
  const burger = document.querySelector('.burger');
  if (!burger) return;

  const mqMobile = window.matchMedia('(max-width: 900px)').matches;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const show = mqMobile || (isTouch && window.innerWidth <= 1024);

  if (show) {
    if (getComputedStyle(burger).display === 'none') burger.style.display = 'flex';
  } else {
    burger.style.display = ''; // пусть CSS прячет по умолчанию
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded','false');
  }
}


  // Показываем бургер на тач-устройствах, даже если ширина “десктопная”
  function forceBurgerVisibility(){
    const burger = $('.burger');
    if (!burger) return;
    const mqMobile = window.matchMedia('(max-width: 900px)').matches;
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /(Mobile|iP(hone|od|ad)|Android|Windows Phone)/i.test(ua);
    const likelyMobileButWide = isTouch && isMobileUA && window.innerWidth <= 1024;
    try {
      const disp = getComputedStyle(burger).display;
      if ((mqMobile || likelyMobileButWide) && disp === 'none') {
        burger.style.display = 'flex';
        burger.style.zIndex = '3000';
      }
    } catch {}
  }

  function initMobileMenu(){
    if (document.body.dataset.burgerInited) return;
    document.body.dataset.burgerInited = '1';

    ensureNavMask();
    const burger = $('.burger');
    const nav    = $('.nav');
    const mask   = $('.nav-mask');

    ensureInlineMobileNav(nav);
    ensureBurgerSVG(burger);

    if (!burger || !nav) return;

    const open  = () => {
      document.body.classList.add('nav-open');
      burger.setAttribute('aria-expanded','true');
      if(nav.dataset.inlineMobile==='1'){ nav.style.right='0'; }
    };
    const close = () => {
      document.body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded','false');
      if(nav.dataset.inlineMobile==='1'){ nav.style.right='-100%'; }
    };

    on(burger, 'click', () => (document.body.classList.contains('nav-open') ? close() : open()));
    on(mask,   'click', close);
    $$('.nav a').forEach(a => on(a, 'click', close));
    on(window, 'keydown', e => { if (e.key === 'Escape') close(); });
    on(window, 'resize',  () => { if (window.innerWidth > 900) close(); });
  }

  // ===== Лайтбокс (защитный, сам создаёт недостающие узлы) =====
  function initGlobalLightbox(){
    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.className = 'lightbox';
      lb.innerHTML = `
        <button class="lb-close" aria-label="Закрыть">×</button>
        <button class="lb-prev" aria-label="Предыдущее фото">‹</button>
        <img class="lb-img" alt="">
        <button class="lb-next" aria-label="Следующее фото">›</button>
      `;
      document.body.appendChild(lb);
    } else {
      if (!lb.querySelector('.lb-close')) { const b=document.createElement('button'); b.className='lb-close'; b.setAttribute('aria-label','Закрыть'); b.textContent='×'; lb.appendChild(b); }
      if (!lb.querySelector('.lb-prev'))  { const b=document.createElement('button'); b.className='lb-prev';  b.setAttribute('aria-label','Предыдущее фото'); b.textContent='‹'; lb.appendChild(b); }
      if (!lb.querySelector('.lb-next'))  { const b=document.createElement('button'); b.className='lb-next';  b.setAttribute('aria-label','Следующее фото'); b.textContent='›'; lb.appendChild(b); }
      if (!lb.querySelector('.lb-img'))   { const i=document.createElement('img');    i.className='lb-img'; i.alt=''; lb.appendChild(i); }
    }

    // Если кто-то оставил style="display:none" — контроль делаем через .active
    lb.style.removeProperty('display');

    const img     = lb.querySelector('.lb-img');
    const btnPrev = lb.querySelector('.lb-prev');
    const btnNext = lb.querySelector('.lb-next');
    const btnClose= lb.querySelector('.lb-close');

    let group = 'default';
    let items = [];
    let index = 0;

    function collect(groupName){
      group = groupName || 'default';
      items = $$(`[data-lightbox-src][data-lb-group="${group}"]`);
      if (!items.length) {
        items = $$('[data-lightbox-src]:not([data-lb-group])');
        group = 'default';
      }
    }
    function show(i){
      if (!items.length || !img) return;
      index = (i + items.length) % items.length;
      const src = items[index].getAttribute('data-lightbox-src');
      img.src = src;
      lb.classList.add('active');
      document.body.classList.add('modal-open');
      lb.tabIndex = -1;
      lb.focus();
    }
    function close(){
      lb.classList.remove('active');
      document.body.classList.remove('modal-open');
    }

    on(document, 'click', (e)=>{
      const t = e.target.closest('[data-lightbox-src]');
      if (!t) return;
      const g = t.getAttribute('data-lb-group') || 'default';
      collect(g);
      const i = items.indexOf(t);
      show(i >= 0 ? i : 0);
    });

    if (btnPrev)  on(btnPrev, 'click', ()=> show(index-1));
    if (btnNext)  on(btnNext, 'click', ()=> show(index+1));
    if (btnClose) on(btnClose,'click', close);
    on(lb, 'click', (e)=>{ if (e.target === lb) close(); });

    on(document, 'keydown', (e)=>{
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft')  show(index-1);
      if (e.key === 'ArrowRight') show(index+1);
    });

    let down=false, x0=0;
    on(lb, 'pointerdown', (e)=>{ down=true; x0=e.clientX; });
    const up = (e)=>{
      if(!down) return;
      const dx = (e.clientX ?? 0) - x0;
      if (Math.abs(dx) > 40) (dx < 0 ? show(index+1) : show(index-1));
      down=false;
    };
    on(lb, 'pointerup', up);
    on(lb, 'pointercancel', up);
  }

  // ===== Слайдеры карточек (.slider>.slides>.slide) =====
  function initSimpleSliders(){
    $$('.slider').forEach(slider => {
      if (slider.dataset.inited) return;
      slider.dataset.inited = '1';

      const track  = $('.slides', slider);
      if(!track) return;
      const slides = $$('.slide', slider);
      const interval = Number(slider.dataset.speed || 2200);
      let i = 0, timer = null;

      const go = (n) => { i = (n + slides.length) % slides.length; track.style.transform = `translateX(-${i*100}%)`; };
      const start = () => { if(!timer) timer = setInterval(()=>go(i+1), interval); };
      const stop  = () => { if(timer){ clearInterval(timer); timer=null; } };

      on(slider, 'mouseenter', start);
      on(slider, 'mouseleave', stop);
      on(slider, 'focusin',   start);
      on(slider, 'focusout',  stop);
      on(slider, 'touchstart', stop, {passive:true});

      let sx=0, sy=0, tracking=false, axis=null;
      const THRESH=40;
      function startSwipe(x,y){ sx=x; sy=y; tracking=true; axis=null; }
      function moveSwipe(x,y,e){
        if(!tracking) return;
        if(axis==null) axis = Math.abs(x-sx) > Math.abs(y-sy) ? 'x' : 'y';
        if(axis==='x') e.preventDefault();
      }
      function endSwipe(x){
        if(!tracking) return;
        const dx=x-sx;
        if(Math.abs(dx)>THRESH) (dx<0 ? go(i+1) : go(i-1));
        tracking=false; axis=null;
      }
      on(slider, 'touchstart', e=>startSwipe(e.touches[0].clientX,e.touches[0].clientY), {passive:true});
      on(slider, 'touchmove',  e=>moveSwipe(e.touches[0].clientX,e.touches[0].clientY,e), {passive:false});
      on(slider, 'touchend',   e=>endSwipe(e.changedTouches[0].clientX), {passive:true});
      on(slider, 'pointerdown', e=>startSwipe(e.clientX,e.clientY));
      on(slider, 'pointermove', e=>moveSwipe(e.clientX,e.clientY,e));
      on(slider, 'pointerup',   e=>endSwipe(e.clientX));

      go(0);
    });
  }

  // ===== Модалки карточек услуг/преимуществ + слайдер внутри =====
  function initFeatureModals(){
    $$('[data-modal-open], [data-service-open]').forEach(card => {
      if (card.dataset.modalBound) return;
      card.dataset.modalBound = '1';

      const attr = card.hasAttribute('data-modal-open') ? 'data-modal-open' : 'data-service-open';
      on(card, 'click', () => {
        const id = card.getAttribute(attr);
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.classList.add('show');
        modal.setAttribute('tabindex','-1');
        modal.focus();

        initModalSliders(modal);

        const close = ()=> { modal.classList.remove('show'); };
        on(modal, 'click', (e)=>{ if (e.target === modal || e.target.hasAttribute('data-modal-close')) close(); });
        const esc = (e)=>{ if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); } };
        document.addEventListener('keydown', esc, {once:true});
      });
    });
  }

  function initModalSliders(root){
    const scope = root || document;
    $$('.modal__slider[data-slider]', scope).forEach(sl => {
      if (sl.dataset.inited) return;
      sl.dataset.inited = '1';

      const track  = $('.modal__slides', sl);
      const slides = $$('.modal__slide', sl);
      const prev   = $('.modal__prev', sl);
      const next   = $('.modal__next', sl);
      let i = 0;

      const go = (n) => { i = (n + slides.length) % slides.length; track.style.transform = `translateX(-${i*100}%)`; };

      on(prev, 'click', (ev)=>{ ev.stopPropagation(); go(i-1); });
      on(next, 'click', (ev)=>{ ev.stopPropagation(); go(i+1); });

      let sx=0, sy=0, tracking=false, axis=null;
      const THRESH=40;
      function startSwipe(x,y){ sx=x; sy=y; tracking=true; axis=null; }
      function moveSwipe(x,y,e){
        if(!tracking) return;
        if(axis==null) axis = Math.abs(x-sx) > Math.abs(y-sy) ? 'x' : 'y';
        if(axis==='x') e.preventDefault();
      }
      function endSwipe(x){
        if(!tracking) return;
        const dx=x-sx;
        if(Math.abs(dx)>THRESH) (dx<0 ? go(i+1) : go(i-1));
        tracking=false; axis=null;
      }
      on(sl, 'touchstart', e=>startSwipe(e.touches[0].clientX,e.touches[0].clientY), {passive:true});
      on(sl, 'touchmove',  e=>moveSwipe(e.touches[0].clientX,e.touches[0].clientY,e), {passive:false});
      on(sl, 'touchend',   e=>endSwipe(e.changedTouches[0].clientX), {passive:true});
      on(sl, 'pointerdown', e=>startSwipe(e.clientX,e.clientY));
      on(sl, 'pointermove', e=>moveSwipe(e.clientX,e.clientY,e));
      on(sl, 'pointerup',   e=>endSwipe(e.clientX));

      on(sl, 'click', (e)=>{
        if(e.target.closest('.modal__prev, .modal__next')) return;
        const r = sl.getBoundingClientRect();
        (e.clientX - r.left < r.width/2) ? go(i-1) : go(i+1);
      });

      sl.closest('.modal')?.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowLeft')  go(i-1);
        if(e.key === 'ArrowRight') go(i+1);
      });

      go(0);
    });
  }

  // ===== Автогалерея (gallery.html) =====
  function initAutoGallery(){
    const wrap = $('#galleryAuto');
    if(!wrap) return;
    const prefix = wrap.dataset.prefix || 'assets/gallery/photo-';
    const start  = Number(wrap.dataset.start || 1);
    const max    = Number(wrap.dataset.max || 500);

    let miss = 0;
    const make = (i)=>{
      if(i>max || miss>=3) return;
      const img = new Image();
      img.onload = ()=>{
        const thumb = new Image();
        thumb.src = `${prefix}${i}.jpg`;
        thumb.alt = `Фото ${i}`;
        thumb.setAttribute('data-lightbox-src', `${prefix}${i}.jpg`);
        thumb.setAttribute('data-lb-group', 'gallery');
        wrap.appendChild(thumb);
        miss = 0;
        make(i+1);
      };
      img.onerror = ()=>{ miss += 1; make(i+1); };
      img.src = `${prefix}${i}.jpg`;
    };
    make(start);
  }

  // ===== Погода (Open-Meteo) в hero =====
  function initWeather(){
    const box = $('#weather');
    if(!box) return;

    const tempEl = $('#wTemp');
    const condEl = $('#wCond');
    const cityEl = $('#wCity');

    const FALLBACK_LAT = Number(box.dataset.fallbackLat) || 55.66;
    const FALLBACK_LON = Number(box.dataset.fallbackLon) || 61.30;

    const codeName = code => ({
      0:'Ясно',1:'Преим. ясно',2:'Перем. облачно',3:'Пасмурно',
      45:'Туман',48:'Иней',51:'Морось',53:'Морось',55:'Морось',
      61:'Дождь',63:'Дождь',65:'Сильный дождь',
      71:'Снег',73:'Снег',75:'Сильный снег',
      80:'Ливни',81:'Ливни',82:'Сильные ливни',
      95:'Гроза',96:'Гроза',99:'Гроза'
    }[code] || 'Погода');

    function fetchWeather(lat, lon, label){
      if (label && cityEl) cityEl.textContent = label;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(d => {
          const cw = d.current_weather || {};
          const t  = Math.round(cw.temperature ?? NaN);
          if (tempEl) tempEl.textContent = Number.isFinite(t) ? `${t}°` : '—°';
          if (condEl) condEl.textContent = codeName(cw.weathercode);
        })
        .catch(()=>{
          if (tempEl) tempEl.textContent = '—°';
          if (condEl) condEl.textContent = 'Погода';
        });
    }

    let usedGeo = false;
    if (navigator.geolocation && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.geolocation.getCurrentPosition(
        pos => { usedGeo = true; fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Ваше местоположение'); },
        ()  => { fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха'); },
        { timeout: 3000, maximumAge: 600000 }
      );
      setTimeout(()=>{ if(!usedGeo) fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха'); }, 1500);
    } else {
      fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха');
    }
  }

  // ===== Rooms list (rooms.html) из JSON + сортировка =====
  function rebindRoomSorting(){
    const list = $('#rooms-list');
    if(!list) return;
    $$('.sort-btn').forEach(btn => {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });
    initRoomSorting();
  }
  function initRoomsFromJSON(){
    const list = $('#rooms-list');
    if(!list) return;
    const src = list.dataset.roomsSrc || 'assets/data/rooms.json';
    fetch(src).then(r=>r.json()).then(data=>{
      const arr = data.rooms || data;
      list.innerHTML = '';
      arr.forEach(room=>{
        const imgs = (room.listGallery && room.listGallery.length ? room.listGallery : (room.gallery||[])).slice(0,3);
        const aHref = `room.html?room=${encodeURIComponent(room.slug)}`;
        const card = document.createElement('article');
        card.className = 'card room-card';
        card.setAttribute('data-price', Number(room.priceFrom||0));
        card.innerHTML = `
          <a class="slider-link" href="${aHref}" aria-label="${escapeHtml(room.title)}">
            <div class="slider" data-speed="2000">
              <div class="slides">
                ${imgs.map(src=>`<div class="slide"><img src="${src}" alt=""></div>`).join('')}
              </div>
            </div>
          </a>
          <h3>${escapeHtml(room.title)}</h3>
          <p>${escapeHtml(room.subtitle || '')}</p>
          <p><strong>от ${formatPrice(room.priceFrom)} ₽ / ночь</strong></p>
          <a class="btn" href="${aHref}">Подробнее</a>
        `;
        list.appendChild(card);
      });
      rebindRoomSorting();
      initSimpleSliders();
    }).catch(()=>{
      list.innerHTML = '<div class="card">Не удалось загрузить список номеров.</div>';
    });
  }
  function initRoomSorting(){
    const list = $('#rooms-list');
    if(!list) return;
    const items = Array.from(list.children);
    const byPrice = (a,b)=> Number(a.dataset.price||0) - Number(b.dataset.price||0);
    $$('.sort-btn').forEach(btn => {
      on(btn, 'click', ()=>{
        const dir = btn.getAttribute('data-sort');
        const sorted = items.slice().sort(byPrice);
        if(dir==='desc') sorted.reverse();
        list.innerHTML = '';
        sorted.forEach(el=>list.appendChild(el));
      });
    });
  }

  // ===== Room details (room.html) из JSON =====
  function initRoomDetailsFromJSON(){
    const wrap = $('#room-details');
    if(!wrap) return;

    const slug = queryParam('room') || queryParam('slug') || queryParam('id');
    const src  = (wrap.dataset.roomsSrc || 'assets/data/rooms.json');
    fetch(src).then(r=>r.json()).then(data=>{
      const arr  = data.rooms || data || [];
      const room = arr.find(r => String(r.slug) === String(slug)) || arr[0];
      if(!room){
        wrap.innerHTML = '<div class="card">Номер не найден.</div>';
        return;
      }
      document.title = `${room.title} — Калды`;
      const titleEl = $('#room-title');
      if (titleEl) titleEl.textContent = room.title || 'Номер';

      const gal = $('#room-gallery');
      if (gal) gal.innerHTML = (room.gallery||[]).map(src => `<img src="${src}" alt="${escapeHtml(room.title)}">`).join('');

      const desc = $('#room-description');
      if (desc) desc.textContent = room.description || '';

      const ul = $('#room-features');
      if (ul) ul.innerHTML = (room.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('');

      const price = $('#room-price');
      if (price) price.textContent = `Цена: от ${formatPrice(room.priceFrom)} ₽ / ночь`;

      initRoomGalleryModals();
    }).catch(()=>{
      wrap.innerHTML = '<div class="card">Не удалось загрузить данные номера.</div>';
    });
  }
  function initRoomGalleryModals(){
    const imgs = $$('.room-gallery img');
    if(!imgs.length) return;
    imgs.forEach((img, index, all) => {
      on(img, 'click', ()=>{
        const sources = Array.from(all).map(i=>i.src);
        let currentIndex = index;
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
          <div class="modal__dialog">
            <button class="modal__close" data-modal-close>&times;</button>
            <div class="modal__slider" data-slider>
              <div class="modal__slides">
                ${sources.map(src=>`<div class="modal__slide"><img src="${src}" alt=""></div>`).join('')}
              </div>
              <button class="modal__prev" aria-label="Назад">&#10094;</button>
              <button class="modal__next" aria-label="Вперёд">&#10095;</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        initModalSliders(modal);
        const track = $('.modal__slides', modal);
        track.style.transform = `translateX(-${currentIndex*100}%)`;
        on(modal, 'click', e=>{ if(e.target === modal || e.target.hasAttribute('data-modal-close')) modal.remove(); });
      });
    });
  }

  // ===== Модалки для фотографий из “О нас” и обычной галереи =====
  function initAboutAndGalleryModals(){
    $$('.about-photos img, .gallery img').forEach((img, index, allImgs)=>{
      on(img, 'click', ()=>{
        const imgs = Array.from(allImgs).map(i=>i.src);
        let currentIndex = index;
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
          <div class="modal__dialog">
            <button class="modal__close" data-modal-close>&times;</button>
            <div class="modal__slider" data-slider>
              <div class="modal__slides">
                ${imgs.map(src=>`<div class="modal__slide"><img src="${src}" alt=""></div>`).join('')}
              </div>
              <button class="modal__prev" aria-label="Назад">&#10094;</button>
              <button class="modal__next" aria-label="Вперёд">&#10095;</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        initModalSliders(modal);
        const track = $('.modal__slides', modal);
        track.style.transform = `translateX(-${currentIndex*100}%)`;
        on(modal, 'click', e=>{ if(e.target === modal || e.target.hasAttribute('data-modal-close')) modal.remove(); });
      });
    });
  }

  // ===== Инициализация =====
  document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLinks();
    initMobileMenu();
    initGlobalLightbox();
    initSimpleSliders();
    initFeatureModals();
    initRoomSorting();
    initAutoGallery();
    initWeather();
    initAboutAndGalleryModals();
    initRoomsFromJSON();
    initRoomDetailsFromJSON();
    forceBurgerVisibility();
    on(window, 'resize', forceBurgerVisibility);
  });
})();
