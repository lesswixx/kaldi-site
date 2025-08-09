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