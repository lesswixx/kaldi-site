document.addEventListener('DOMContentLoaded', function() {
  const currentPage = location.pathname.split('/').pop();
  document.querySelectorAll('.nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
    if ((currentPage === '' || currentPage === 'index.html') && link.getAttribute('href') === 'index.html') {
      link.classList.add('active');
    }
  });
});

function bookingStub(e){
  e && e.preventDefault();
  alert('Онлайн-бронирование скоро будет доступно. Оставьте заявку в контактах или позвоните нам.');
}

// Lightbox for gallery
document.addEventListener('click', function(e){
  const target = e.target.closest('[data-lightbox-src]');
  if(target){
    const src = target.getAttribute('data-lightbox-src');
    const lb = document.getElementById('lightbox');
    lb.querySelector('img').src = src;
    lb.classList.add('active');
  }
});
function lightboxClose(){
  document.getElementById('lightbox').classList.remove('active');
}
// === SimpleSlider — автопрокрутка на hover, без стрелок/точек ===
function initSimpleSliders(){
  document.querySelectorAll('.slider').forEach(slider=>{
    const track = slider.querySelector('.slides');
    if(!track) return;
    const slides = slider.querySelectorAll('.slide');
    const interval = Number(slider.dataset.speed || 2200);

    let index = 0, timer = null;

    function go(i){
      if(!slides.length) return;
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index*100}%)`;
    }
    function start(){ if(!timer) timer = setInterval(()=>go(index+1), interval); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }

    // автоплей только при наведении/фокусе
    slider.addEventListener('mouseenter', start);
    slider.addEventListener('mouseleave', stop);
    slider.addEventListener('focusin', start);
    slider.addEventListener('focusout', stop);
    slider.addEventListener('touchstart', stop, {passive:true}); // на мобильных — без автоплея

    // свайп (по желанию)
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
document.addEventListener('DOMContentLoaded', initSimpleSliders);
