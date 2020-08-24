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
  $('.questions').accordion({
    heightStyle: 'content',
    header: '> .questions__item > h3',
    collapsible: true
  });
  $('.filters').accordion({
    active: 0,
    heightStyle: 'content',
    header: '> .filters__box > h2',
    collapsible: true
  });
  $('.main-header__button-burger').click(function () {
    $('.main-header__bottom').slideToggle();
    $('.main-header').toggleClass('.main-header--open');
  });
});
