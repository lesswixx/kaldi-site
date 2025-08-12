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

/* ===== Слайдеры внутри модалок услуг/преимуществ ===== */
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

    function go(i){ index = (i + slides.length) % slides.length; track.style.transform = `translateX(-${index*100}%)`; }
    prev && prev.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index-1); });
    next && next.addEventListener('click', (ev)=>{ ev.stopPropagation(); go(index+1); });

    let down=false,x0=0,pid=null;
    sl.addEventListener('pointerdown', e=>{down=true;x0=e.clientX;pid=e.pointerId;sl.setPointerCapture?.(pid);});
    const up = e=>{
      if(!down) return;
      const dx=(e.clientX??0)-x0;
      if(Math.abs(dx)>40) go(index+(dx<0?1:-1));
      down=false; pid && sl.releasePointerCapture?.(pid);
    };
    sl.addEventListener('pointerup', up);
    sl.addEventListener('pointercancel', up);

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

  function fetchWeather(lat, lon){
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
      .then(r=>r.json())
      .then(d=>{
        const t = Math.round(d?.current?.temperature_2m ?? NaN);
        const code = d?.current?.weather_code ?? null;
        tempEl.textContent = isFinite(t) ? `${t}°` : '—°';
        condEl.textContent = weatherName(code);
      })
      .catch(()=>{ tempEl.textContent='—°'; condEl.textContent='Погода'; });
  }
  function weatherName(code){
    const map = {0:'Ясно',1:'Преим. ясно',2:'Перем. облачно',3:'Пасмурно',45:'Туман',48:'Иней',51:'Морось',61:'Дождь',71:'Снег',80:'Ливни'};
    return map[code] || 'Погода';
  }

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude, longitude} = pos.coords;
        fetchWeather(latitude, longitude);
        cityEl.textContent = 'Ваше местоположение';
      },
      ()=>{
        const lat = Number(box.dataset.fallbackLat), lon = Number(box.dataset.fallbackLon);
        fetchWeather(lat, lon);
        cityEl.textContent = 'База отдыха';
      },
      {timeout: 3000}
    );
  } else {
    const lat = Number(box.dataset.fallbackLat), lon = Number(box.dataset.fallbackLon);
    fetchWeather(lat, lon);
    cityEl.textContent = 'База отдыха';
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
/* ===== Инициализация всего ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  initSimpleSliders();
  initFeatureModals();
  initRoomSorting();
  initAutoGallery();
  initWeather();
  initAboutAndGalleryModals(); 
});
