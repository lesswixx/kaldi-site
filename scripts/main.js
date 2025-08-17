// === Калды — единый main.js (без дублирования) ===
// Файл совместим с текущей вёрсткой: ничего править в HTML не нужно.
// Просто убери инлайновые <script> из страниц и подключи этот файл.

(() => {
  'use strict';

  // ===== ВСПОМОГАТЕЛЬНОЕ =====
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"'`=\/]/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;','\\':'&#92;'
    })[s] || s);
  }
  function formatPrice(n){
    n = Number(n||0);
    return n.toLocaleString('ru-RU');
  }
  function queryParam(name){
    try { return new URL(location.href).searchParams.get(name); } catch { return null; }
  }

  // ===== Активное меню =====
  function setActiveNavLinks(){
    const current = location.pathname.split('/').pop() || 'index.html';
    $$('.nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current) a.classList.add('active');
      if ((current === 'index.html') && (href === 'index.html' || href === '#about')) a.classList.add('active');
    });
  }

  // ===== Заглушка бронирования =====
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
  function initMobileMenu(){
    if (document.body.dataset.burgerInited) return;
    document.body.dataset.burgerInited = '1';

    ensureNavMask();
    const burger = $('.burger');
    const nav    = $('.nav');
    const mask   = $('.nav-mask');
    if (!burger || !nav) return;

    const open  = () => { document.body.classList.add('nav-open');  burger.setAttribute('aria-expanded','true'); };
    const close = () => { document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded','false'); };

    on(burger, 'click', () => (document.body.classList.contains('nav-open') ? close() : open()));
    on(mask,   'click', close);
    $$('.nav a').forEach(a => on(a, 'click', close));
    on(window, 'keydown', e => { if (e.key === 'Escape') close(); });
    on(window, 'resize',  () => { if (window.innerWidth > 900) close(); });
  }

  // ===== Универсальный лайтбокс (работает с двумя вариантами разметки) =====
  function initGlobalLightbox(){
    if (document.body.dataset.lbInited) return;
    document.body.dataset.lbInited = '1';

    let lb = $('#lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.className = 'lightbox';
      lb.innerHTML = `
        <button class="lb-close lightbox-close" aria-label="Закрыть">×</button>
        <button class="lb-prev lightbox-prev" aria-label="Предыдущее фото">‹</button>
        <img class="lb-img lightbox-img" alt="">
        <button class="lb-next lightbox-next" aria-label="Следующее фото">›</button>
      `;
      document.body.appendChild(lb);
    }
    // Селекторы совместимости
    const img  = $('.lb-img', lb)  || $('.lightbox-img', lb);
    const bPrev= $('.lb-prev', lb) || $('.lightbox-prev', lb);
    const bNext= $('.lb-next', lb) || $('.lightbox-next', lb);
    const bClose=$('.lb-close', lb)|| $('.lightbox-close', lb);

    // Если в разметке было style="display:none" — уберём, чтобы .active управлял показом
    lb.style.removeProperty('display');

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
      if (!items.length) return;
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

    // Делегирование по документу
    on(document, 'click', (e)=>{
      const t = e.target.closest('[data-lightbox-src]');
      if (!t) return;
      const g = t.getAttribute('data-lb-group') || 'default';
      collect(g);
      const i = items.indexOf(t);
      show(i >= 0 ? i : 0);
    });

    on(bPrev, 'click', ()=> show(index-1));
    on(bNext, 'click', ()=> show(index+1));
    on(bClose,'click', close);
    on(lb, 'click', (e)=>{ if (e.target === lb) close(); });

    on(document, 'keydown', (e)=>{
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft')  show(index-1);
      if (e.key === 'ArrowRight') show(index+1);
    });

    // Свайп
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

  // ===== Слайдер для карточек домиков (hover-автоплей + свайп) =====
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

      // свайп
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

  // ===== Модалки преимуществ/услуг с фотослайдером =====
  function initFeatureModals(){
    // поддерживаем и data-modal-open, и data-service-open
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

      // свайп (тач + pointer)
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

      // клик по левой/правой половине
      on(sl, 'click', (e)=>{
        if(e.target.closest('.modal__prev, .modal__next')) return;
        const r = sl.getBoundingClientRect();
        (e.clientX - r.left < r.width/2) ? go(i-1) : go(i+1);
      });

      // стрелки с клавиатуры
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

  // ===== Погода (Open-Meteo) в hero-card =====
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

    // Гео — по HTTPS или localhost, но не ждём вечно
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

  // ===== JSON → список номеров (rooms.html) =====
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

  // ===== JSON → страница конкретного номера (room.html) =====
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
      gal.innerHTML = (room.gallery||[]).map(src => `<img src="${src}" alt="${escapeHtml(room.title)}">`).join('');

      const desc = $('#room-description');
      if (desc) desc.textContent = room.description || '';

      const ul = $('#room-features');
      ul.innerHTML = (room.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('');

      const price = $('#room-price');
      if (price) price.textContent = `Цена: от ${formatPrice(room.priceFrom)} ₽ / ночь`;

      // Включим модальную галерею для изображений комнаты
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
                ${sources.map(src=>`
                  <div class="modal__slide"><img src="${src}" alt=""></div>
                `).join('')}
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

  // ===== Модалки для фотографий из «О нас» и обычной галереи =====
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
                ${imgs.map(src=>`
                  <div class="modal__slide"><img src="${src}" alt=""></div>
                `).join('')}
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

  // ===== Инициализация всего =====
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
  });
})();
