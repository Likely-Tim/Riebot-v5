let index = 0;
showSlides();

function showSlides() {
  const slides = document.getElementsByClassName('slide') as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = 'none';
  }
  slides[index].style.display = 'block';
  index++;
  if (slides.length === index) {
    index = 0;
  }
  setTimeout(showSlides, 3000);
}
