// ===== Активное меню =====
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = location.pathname.split('/').pop();
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
    if ((currentPage === '' || currentPage === 'index.html') && (href === 'index.html' || href === '#about')) {
      link.classList.add('active');
    }
  });
});

// ===== Заглушка бронирования =====
function bookingStub(e){
  e && e.preventDefault();
  alert('Онлайн-бронирование скоро будет доступно. Оставьте заявку в контактах или позвоните нам.');
}

/* -----------------------------------------------------------
   ЕДИНЫЙ ЛАЙТБОКС (стрелки, крестик, Esc, свайп)
   Работает с элементами, имеющими:
   - data-lightbox-src="путь_к_картинке"
   - data-lb-group="имя_группы" (опционально; по умолчанию "default")
----------------------------------------------------------- */
(function initGlobalLightbox(){
  const lb = document.getElementById('lightbox');
  if(!lb) return;
  const img = lb.querySelector('.lb-img');
  const btnPrev = lb.querySelector('.lb-prev');
  const btnNext = lb.querySelector('.lb-next');
  const btnClose = lb.querySelector('.lb-close');

  let group = 'default';
  let items = [];
  let index = 0;

  function collect(groupName){
    group = groupName || 'default';
    items = Array.from(document.querySelectorAll(`[data-lightbox-src][data-lb-group="${group}"]`));
    if(items.length===0){ // fallback: все без группы
      items = Array.from(document.querySelectorAll('[data-lightbox-src]:not([data-lb-group])'));
      group = 'default';
    }
  }
  function show(i){
    if(items.length===0) return;
    index = (i + items.length) % items.length;
    img.src = items[index].getAttribute('data-lightbox-src');
    lb.classList.add('active');
    lb.focus();
  }
  function close(){ lb.classList.remove('active'); }

  // делегирование кликов по документу
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-lightbox-src]');
    if(!t) return;
    const g = t.getAttribute('data-lb-group') || 'default';
    collect(g);
    const i = items.indexOf(t);
    show(i>=0 ? i : 0);
  });

  btnPrev.addEventListener('click', ()=>show(index-1));
  btnNext.addEventListener('click', ()=>show(index+1));
  btnClose.addEventListener('click', close);

  // клик по фону — закрыть
  lb.addEventListener('click', (e)=>{ if(e.target === lb) close(); });

  // клавиатура
  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('active')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(index-1);
    if(e.key === 'ArrowRight') show(index+1);
  });

  // свайп
  let down=false,x0=0;
  lb.addEventListener('pointerdown', e=>{down=true;x0=e.clientX;});
  const up = e=>{
    if(!down) return;
    const dx=(e.clientX??0)-x0;
    if(Math.abs(dx)>40) dx<0 ? show(index+1) : show(index-1);
    down=false;
  };
  lb.addEventListener('pointerup', up);
  lb.addEventListener('pointercancel', up);
})();

/* ===== Слайдер на карточках домиков (без стрелок/точек, автоплей на hover) ===== */
function initSimpleSliders(){
  document.querySelectorAll('.slider').forEach(slider=>{
    const track = slider.querySelector('.slides');
    if(!track) return;
    const slides = slider.querySelectorAll('.slide');
    const interval = Number(slider.dataset.speed || 2200);
    let index = 0, timer = null;

    function go(i){ index = (i + slides.length) % slides.length; track.style.transform = `translateX(-${index*100}%)`; }
    function start(){ if(!timer) timer = setInterval(()=>go(index+1), interval); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }

    slider.addEventListener('mouseenter', start);
    slider.addEventListener('mouseleave', stop);
    slider.addEventListener('focusin', start);
    slider.addEventListener('focusout', stop);
    slider.addEventListener('touchstart', stop, {passive:true});

    let down=false,x0=0;
    slider.addEventListener('pointerdown', e=>{down=true;x0=e.clientX;slider.setPointerCapture?.(e.pointerId);});
    const up = e=>{
      if(!down) return;
      const dx=(e.clientX??0)-x0;
      if(Math.abs(dx)>40) go(index+(dx<0?1:-1));
      down=false;
    };
    slider.addEventListener('pointerup', up);
    slider.addEventListener('pointercancel', up);

    go(0);
  });
}

/* ===== Модалки преимуществ (со слайдером) ===== */
function initFeatureModals(){
  document.querySelectorAll('[data-modal-open]').forEach(card=>{
    card.classList.add('feature-card');
    card.addEventListener('click', ()=>{
      const id = card.getAttribute('data-modal-open');
      const modal = document.getElementById(id);
      if(!modal) return;

      modal.classList.add('show');
      modal.setAttribute('tabindex','-1');
      modal.focus();

      initModalSliders(modal);

      const close = ()=> modal.classList.remove('show');
      modal.addEventListener('click', (e)=>{ if(e.target === modal || e.target.hasAttribute('data-modal-close')) close(); });
      document.addEventListener('keydown', function esc(e){
        if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); }
      }, {once:true});
    });
  });
}
function initModalSliders(root){
  const scope = root || document;
  scope.querySelectorAll('[data-slider]').forEach(sl=>{
    if(sl.dataset.inited) return;
    sl.dataset.inited = '1';

    const track  = sl.querySelector('.modal__slides');
    const slides = sl.querySelectorAll('.modal__slide');
    const prev   = sl.querySelector('.modal__prev');
    const next   = sl.querySelector('.modal__next');
    let index = 0;

    function go(i){ 
      index = (i + slides.length) % slides.length; 
      track.style.transform = `translateX(-${index*100}%)`; 
    }

    prev && prev.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index-1); });
    next && next.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index+1); });

    // ---- Свайп (Pointer + Touch) ----
    let startX = 0;
    let isTouch = false;

    function onStart(x){
      startX = x;
      isTouch = true;
    }
    function onEnd(x){
      if(!isTouch) return;
      const dx = x - startX;
      if(Math.abs(dx) > 40){
        if(dx < 0) go(index+1);
        else go(index-1);
      }
      isTouch = false;
    }

    // Touch
    sl.addEventListener('touchstart', e => onStart(e.touches[0].clientX), {passive:true});
    sl.addEventListener('touchend', e => onEnd(e.changedTouches[0].clientX), {passive:true});

    // Pointer (мышь/стилус)
    sl.addEventListener('pointerdown', e=> onStart(e.clientX));
    sl.addEventListener('pointerup', e=> onEnd(e.clientX));

    // ---- Клик для перелистывания ----
    sl.addEventListener('click', (e)=>{
      if(e.target.closest('.modal__prev, .modal__next')) return;
      const rect = sl.getBoundingClientRect();
      (e.clientX - rect.left < rect.width/2) ? go(index-1) : go(index+1);
    });

    sl.closest('.modal')?.addEventListener('keydown', function onKey(e){
      if(e.key === 'ArrowLeft')  go(index-1);
      if(e.key === 'ArrowRight') go(index+1);
    });

    go(0);
  });
}

/* ===== Слайдеры внутри модалок услуг/преимуществ ===== */
// function initModalSliders(root){
//   const scope = root || document;
//   scope.querySelectorAll('[data-slider]').forEach(sl=>{
//     if(sl.dataset.inited) return;
//     sl.dataset.inited = '1';

//     const track  = sl.querySelector('.modal__slides');
//     const slides = sl.querySelectorAll('.modal__slide');
//     const prev   = sl.querySelector('.modal__prev');
//     const next   = sl.querySelector('.modal__next');
//     let index = 0;

//     function go(i){ index = (i + slides.length) % slides.length; track.style.transform = `translateX(-${index*100}%)`; }
//     prev && prev.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index-1); });
//     next && next.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index+1); });

//     let down=false,x0=0,pid=null;
//     sl.addEventListener('pointerdown', e=>{down=true;x0=e.clientX;pid=e.pointerId;sl.setPointerCapture?.(pid);});
//     const up = e=>{
//       if(!down) return;
//       const dx=(e.clientX??0)-x0;
//       if(Math.abs(dx)>40) go(index+(dx<0?1:-1));
//       down=false; pid && sl.releasePointerCapture?.(pid);
//     };
//     sl.addEventListener('pointerup', up);
//     sl.addEventListener('pointercancel', up);

//     sl.addEventListener('click', (e)=>{
//       if(e.target.closest('.modal__prev, .modal__next')) return;
//       const rect = sl.getBoundingClientRect();
//       (e.clientX - rect.left < rect.width/2) ? go(index-1) : go(index+1);
//     });

//     sl.closest('.modal')?.addEventListener('keydown', function onKey(e){
//       if(e.key === 'ArrowLeft')  go(index-1);
//       if(e.key === 'ArrowRight') go(index+1);
//     });

//     go(0);
//   });
// }

/* ===== Сортировка по цене на странице домиков ===== */
function initRoomSorting(){
  const list = document.getElementById('rooms-list');
  if(!list) return;
  const items = Array.from(list.children);
  const byPrice = (a,b)=> Number(a.dataset.price||0) - Number(b.dataset.price||0);

  document.querySelectorAll('.sort-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const dir = btn.getAttribute('data-sort');
      const sorted = items.slice().sort(byPrice);
      if(dir==='desc') sorted.reverse();
      list.innerHTML = '';
      sorted.forEach(el=>list.appendChild(el));
    });
  });
}

/* ===== Автогалерея ===== */
function initAutoGallery(){
  const wrap = document.getElementById('galleryAuto');
  if(!wrap) return;
  const prefix = wrap.dataset.prefix || 'assets/gallery/photo-';
  const start = Number(wrap.dataset.start || 1);
  const max = Number(wrap.dataset.max || 500);

  let miss = 0;
  const make = (i)=>{
    if(i>max || miss>=3) return;
    const img = new Image();
    img.onload = ()=>{
      const thumb = new Image();
      thumb.src = `${prefix}${i}.jpg`;
      thumb.alt = `Фото ${i}`;
      thumb.setAttribute('data-lightbox-src', `${prefix}${i}.jpg`);
      thumb.setAttribute('data-lb-group', 'gallery');   // <— группа для листания
      wrap.appendChild(thumb);
      miss = 0;
      make(i+1);
    };
    img.onerror = ()=>{ miss += 1; make(i+1); };
    img.src = `${prefix}${i}.jpg`;
  };
  make(start);
}

/* ===== Виджет погоды (Open-Meteo) ===== */
function initWeather(){
  const box = document.getElementById('weather');
  if(!box) return;

  const tempEl = document.getElementById('wTemp');
  const condEl = document.getElementById('wCond');
  const cityEl = document.getElementById('wCity');

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

  // сетевой запрос с таймаутом
  function fetchWeather(lat, lon, label){
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 5000);

    // показываем подпись сразу, чтобы не висело "Загрузка…"
    if (label) cityEl.textContent = label;

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {signal: ctrl.signal})
      .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
      .then(d => {
        const cw = d.current_weather || {};
        const t  = Math.round(cw.temperature ?? NaN);
        tempEl.textContent = Number.isFinite(t) ? `${t}°` : '—°';
        condEl.textContent = codeName(cw.weathercode);
      })
      .catch(() => {
        tempEl.textContent = '—°';
        condEl.textContent = 'Погода';
      })
      .finally(()=> clearTimeout(timer));
  }

  // если есть https/localhost — пробуем геолокацию, но не ждём её вечно
  let usedGeo = false;
  if (navigator.geolocation && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        usedGeo = true;
        fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Ваше местоположение');
      },
      () => { fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха'); },
      { timeout: 3000, maximumAge: 600000 }
    );
    // подстраховка: если пользователь не отвечает на запрос доступа — грузим fallback через 1.5с
    setTimeout(()=> { if(!usedGeo) fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха'); }, 1500);
  } else {
    fetchWeather(FALLBACK_LAT, FALLBACK_LON, 'База отдыха');
  }
}

function initAboutAndGalleryModals(){
  document.querySelectorAll('.about-photos img, .gallery img').forEach((img, index, allImgs)=>{
    img.addEventListener('click', ()=>{
      // создаём список всех фото для перелистывания
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
                <div class="modal__slide">
                  <img src="${src}" alt="">
                </div>
              `).join('')}
            </div>
            <button class="modal__prev">&#10094;</button>
            <button class="modal__next">&#10095;</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      initModalSliders(modal);

      // Показать нужный слайд
      const track = modal.querySelector('.modal__slides');
      track.style.transform = `translateX(-${currentIndex*100}%)`;

      // Закрытие
      modal.addEventListener('click', e=>{
        if(e.target === modal || e.target.hasAttribute('data-modal-close')){
          modal.remove();
        }
      });
    });
  });
}
/* ====== JSON → список номеров (rooms.html) ====== */
function escapeHtml(str){
  return String(str||'').replace(/[&<>"'`=\/]/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
  })[s] || s);
}
function formatPrice(n){
  n = Number(n||0);
  return n.toLocaleString('ru-RU');
}
// Перепривязка обработчиков сортировки (после рендера JSON)
function rebindRoomSorting(){
  const list = document.getElementById('rooms-list');
  if(!list) return;
  document.querySelectorAll('.sort-btn').forEach(btn=>{
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  // если у тебя уже есть initRoomSorting — дергаем его,
  // иначе добавь простую реализацию ниже
  if (typeof initRoomSorting === 'function') {
    initRoomSorting();
  } else {
    document.querySelectorAll('.sort-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const dir = btn.dataset.sort;
        const list = document.getElementById('rooms-list');
        const cards = Array.from(list.children);
        cards.sort((a,b)=>{
          const pa = Number(a.getAttribute('data-price')||0);
          const pb = Number(b.getAttribute('data-price')||0);
          return dir === 'asc' ? pa - pb : pb - pa;
        });
        list.innerHTML = '';
        cards.forEach(c=>list.appendChild(c));
      });
    });
  }
}
function initRoomsFromJSON(){
  const list = document.getElementById('rooms-list');
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
    // сортировка и слайдеры после наполнения
    rebindRoomSorting();
    if (typeof initSimpleSliders === 'function') initSimpleSliders();
  }).catch(()=>{
    list.innerHTML = '<div class="card">Не удалось загрузить список номеров.</div>';
  });
}

/* ====== JSON → страница комнаты (room.html) ====== */
function queryParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function initRoomDetailsFromJSON(){
  const wrap = document.getElementById('room-details');
  if(!wrap) return;
  const slug = queryParam('room') || queryParam('slug') || queryParam('id');
  const src = (wrap.dataset.roomsSrc || 'assets/data/rooms.json');
  fetch(src).then(r=>r.json()).then(data=>{
    const arr = data.rooms || data;
    const room = arr.find(r => String(r.slug) === String(slug)) || arr[0];
    if(!room){
      wrap.innerHTML = '<div class="card">Номер не найден.</div>';
      return;
    }
    document.title = `${room.title} — Калды`;
    const titleEl = document.getElementById('room-title');
    if(titleEl) titleEl.textContent = room.title;

    const gal = document.getElementById('room-gallery');
    gal.innerHTML = (room.gallery||[]).map(src => `<img src="${src}" alt="${escapeHtml(room.title)}">`).join('');
    initRoomGalleryModals();

    const desc = document.getElementById('room-description');
    if(desc) desc.textContent = room.description || '';

    const ul = document.getElementById('room-features');
    ul.innerHTML = (room.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('');

    const price = document.getElementById('room-price');
    if(price) price.textContent = `Цена: от ${formatPrice(room.priceFrom)} ₽ / ночь`;
  }).catch(()=>{
    wrap.innerHTML = '<div class="card">Не удалось загрузить данные номера.</div>';
  });
}

/* Простая модалка-галерея для изображений комнаты */
function initRoomGalleryModals(){
  const imgs = document.querySelectorAll('.room-gallery img');
  if(!imgs.length) return;
  imgs.forEach((img, index, all)=>{
    img.addEventListener('click', ()=>{
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
                <div class="modal__slide">
                  <img src="${src}" alt="">
                </div>
              `).join('')}
            </div>
          </div>
          <button class="modal__prev">&#10094;</button>
          <button class="modal__next">&#10095;</button>
        </div>
      `;
      document.body.appendChild(modal);
      if (typeof initModalSliders === 'function') initModalSliders(modal);
      const track = modal.querySelector('.modal__slides');
      track.style.transform = `translateX(-${currentIndex*100}%)`;
      modal.addEventListener('click', e=>{
        if(e.target === modal || e.target.hasAttribute('data-modal-close')) modal.remove();
      });
    });
  });
}
/* === Burger menu (mobile) — без автодобавления элементов === */
function initMobileMenu(){
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  const mask = document.querySelector('.nav-mask');
  if (!burger || !nav) return;

  const open  = () => { document.body.classList.add('nav-open');  burger.setAttribute('aria-expanded','true'); if(nav.dataset.inlineMobile==='1'){ nav.style.right='0'; }};
  const close = () => { document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded','false'); if(nav.dataset.inlineMobile==='1'){ nav.style.right='-100%'; }};

  burger.addEventListener('click', () => {
    document.body.classList.contains('nav-open') ? close() : open();
  });
  mask && mask.addEventListener('click', close);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
}



/* ===== Инициализация всего ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  initMobileMenu(); 
  initSimpleSliders();
  initFeatureModals();
  initRoomSorting();
  initAutoGallery();
  initWeather();
  initAboutAndGalleryModals(); 
  initRoomsFromJSON();
  initRoomDetailsFromJSON();
    forceBurgerVisibility();
    on(window, "resize", forceBurgerVisibility);
});
