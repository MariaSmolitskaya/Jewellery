'use strict';


$(document).ready(function() {
  $('.main-header__login').modaal();
  $('.product__add').modaal({
    content_source: '#modal-basket'
  });
  $('.main__filters-btn').modaal({
    content_source: '.filters',
    hide_close: true
  });
  $('.slider__wrapper').on('init', function(event, slick) {
    $(this).append('<div class="slick-dots-mobile"><p><span id="current">1</span> of <span id="total">'+ slick.slideCount +'</span></p></div>');
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
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      }
    ]
  });
  $('.slider__wrapper').on('afterChange', function(event, slick, currentSlide, nextSlide){
      $('.slick-dots-mobile #current').html(currentSlide + 1);
    });
  $('.questions').accordion({
    heightStyle: 'content',
    header: '> .questions__item > h3',
    collapsible: true
  });
  $('.filters__form').accordion({
    active: 0,
    heightStyle: 'content',
    header: '> .filters__box > h2',
    collapsible: true
  });
});
