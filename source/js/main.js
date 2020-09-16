'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var formLogin = document.querySelector('.modal-login__button');
  var inputEmail = document.querySelector('.modal-login__input');
  inputEmail.value = localStorage.getItem('email') || '';
  formLogin.addEventListener('click', function () {
    localStorage.setItem('email', inputEmail.value);
  });
});
