'use strict';
$(document).ready(function(){
  $('.main-header__login').modaal();
  $('.product__add').modaal({
    content_source: '#modal-basket'
  });
  $('.slider__wrapper').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 2,
    prevArrow: '.slider__btn--left',
    nextArrow: '.slider__btn--right',
    dots: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
        }
      }
    ]
  });
});
