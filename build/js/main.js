'use strict';

var formLogin = document.querySelector('.modal-login');
formLogin.onSubmit = function () {
  var inputEmail = document.querySelector('.modal-login__input');
  localStorage.setItem('email', inputEmail.value);
};
