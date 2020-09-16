'use strict';

document.addEventListener('DOMContentLoaded', () => {
  var formLogin = document.querySelector('.modal-login__button');
  var inputEmail = document.querySelector('.modal-login__input');
  inputEmail.value = localStorage.getItem('email') || '';
  formLogin.addEventListener('click', function (e) {
    localStorage.setItem('email', inputEmail.value);
  });
})
