let body = document.querySelector("body");
let modal = document.querySelector(".modal");
let openBtnModal = document.querySelector(".main-header__login");
let closeBtnModal = document.querySelector(".modal-login__close");

function existVerticalScroll() {
  return document.body.offsetHeight > window.innerHeight;
}

function getBodyScrollTop() {
  return self.pageYOffset || (document.documentElement && document.documentElement.ScrollTop) || (document.body && document.body.scrollTop);
}

openBtnModal.addEventListener("click", function (evt) {
  evt.preventDefault();
  body.dataset.scrollY = getBodyScrollTop();
  modal.classList.add("modal--show");

  if (existVerticalScroll()) {
    body.classList.add("body--lock");
    body.style.top = "-${body.dataset.scrollY}px";
  }
});

closeBtnModal.addEventListener("click", function (evt) {
  evt.preventDefault();
  modal.classList.remove("modal--show");

  if (existVerticalScroll()) {
    body.classList.remove("body--lock")
    window.scrollTo(0,body.dataset.scrollY)
  }
});
