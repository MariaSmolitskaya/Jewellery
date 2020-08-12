let body = document.querySelector("body");
let linkLogin = document.querySelector(".main-header__login");
let modalLogin = document.querySelector(".modal-login");
let btnLogin = document.querySelector(".modal-login__close");

function existVerticalScroll() {
  return document.body.offsetHeight > window.innerHeight
}

function getBodyScrollTop() {
  return self.pageYOffset || (document.documentElement && document.documentElement.ScrollTop) || (document.body && document.body.scrollTop);
}

linkLogin.addEventListener("click", function (evt) {
  evt.preventDefault();
  body.dataset.scrollY = getBodyScrollTop();
  modalLogin.classList.add("modal-login--show");

  if (existVerticalScroll()) {
    body.classList.add("body--lock");
    body.style.top = "-${body.dataset.scrollY}px";
  }
});

btnLogin.addEventListener("click", function (evt) {
  evt.preventDefault();
  modalLogin.classList.remove("modal-login--show");

  if (existVerticalScroll()) {
    body.classList.remove("body--lock")
    window.scrollTo(0,body.dataset.scrollY)
  }
});
