Jewellery
==========

Установка
----------
* Чтобы скачать проект, введите в консоль `git clone git@github.com:MariaSmolitskaya/Jewellery.git`
* Для сборки проекта потребуется Node.js и gulp
* Все необходимые пакеты можно установить с помощью команды `npm i`

Запуск
-------
* Запуск проекта с помощью команды `npm start`

Структура
----------
  |- build/            --- папка с полностью готовым проектом
      |- css/          --- стили
      |- fonts/        --- шрифты
      |- img/          --- изображения
      |- js/           --- программный код
      |- catalog.html  --- страница каталога ювелирных украшений
      |- fitting.html  --- страница примерки и демонстрации ювелирных украшений
      |- index.html    --- страница с ссылками на все существующие страницы проекта
      |- main.html     --- главная страница 
      |- product.html  --- страница детального описания товара
  |- node_modules/
  |- source/           --- папка для разработки проекта
      |- fonts/
      |- img/ 
      |- js/ 
      |- sass/ 
         |- blocks/ 
         |- glightbox.scss 
         |- global.scss 
         |- mixins.scss 
         |- modaal.scss 
         |- slick.scss 
         |- style.scss 
         |- variables.scss 
             |- catalog.html
      |- fitting.html
      |- index.html
      |- main.html
      |- product.html
  |- gulpfile.js
  |- package.json
