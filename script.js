/* ==========================================================================
   Ольга Дятчина — нутрициолог, Челябинск
   Скрипт без зависимостей: бургер-меню, аккордеон FAQ, анимации появления,
   валидация формы (без бэкенда) и подсветка активного пункта меню.
   ========================================================================== */

(function () {
  'use strict';

  var documentEl = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Бургер-меню (мобильная навигация)
     ------------------------------------------------------------------ */
  function initBurger() {
    var burger = document.querySelector('.burger');
    var nav = document.getElementById('main-nav');
    if (!burger || !nav) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      nav.classList.toggle('is-open', open);
    }

    function isOpen() {
      return burger.getAttribute('aria-expanded') === 'true';
    }

    burger.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Закрываем меню после перехода по якорю
    nav.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && isOpen()) setOpen(false);
    });

    // Escape закрывает меню и возвращает фокус на кнопку
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        burger.focus();
      }
    });

    // На десктопе состояние сбрасывается
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && isOpen()) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     2. Тень у шапки при прокрутке
     ------------------------------------------------------------------ */
  function initHeaderShadow() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
     3. Аккордеон FAQ
     Открыт только один вопрос за раз — классическое поведение аккордеона.
     ------------------------------------------------------------------ */
  function initAccordion() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.acc-trigger'));
    if (!triggers.length) return;

    function panelOf(trigger) {
      return document.getElementById(trigger.getAttribute('aria-controls'));
    }

    function collapse(trigger) {
      var panel = panelOf(trigger);
      if (!panel) return;
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    }

    function expand(trigger) {
      var panel = panelOf(trigger);
      if (!panel) return;
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }

    triggers.forEach(function (trigger, index) {
      var panel = panelOf(trigger);
      if (!panel) return;

      // Первый вопрос открыт по умолчанию
      if (index === 0) {
        expand(trigger);
      } else {
        collapse(trigger);
      }

      trigger.addEventListener('click', function () {
        var wasOpen = trigger.getAttribute('aria-expanded') === 'true';
        triggers.forEach(collapse);
        if (!wasOpen) expand(trigger);
      });

      // Навигация с клавиатуры между заголовками
      trigger.addEventListener('keydown', function (event) {
        var target = null;
        if (event.key === 'ArrowDown') target = triggers[(index + 1) % triggers.length];
        if (event.key === 'ArrowUp') target = triggers[(index - 1 + triggers.length) % triggers.length];
        if (event.key === 'Home') target = triggers[0];
        if (event.key === 'End') target = triggers[triggers.length - 1];
        if (target) {
          event.preventDefault();
          target.focus();
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     4. Анимации появления блоков (.reveal → .is-visible)
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    // Задержка из data-delay попадает в CSS-переменную --reveal-delay
    items.forEach(function (item) {
      var delay = parseInt(item.getAttribute('data-delay'), 10);
      if (!isNaN(delay)) item.style.setProperty('--reveal-delay', delay + 'ms');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  /* ------------------------------------------------------------------
     5. Подсветка активного пункта меню по секции
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) {
        map[id] = link;
        sections.push(section);
      }
    });

    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (other) { other.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ------------------------------------------------------------------
     6. Лёгкая маска телефона: +7 (XXX) XXX-XX-XX
     ------------------------------------------------------------------ */
  function initPhoneMask(input) {
    if (!input) return;

    function format(value) {
      var digits = value.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7')) digits = '7' + digits;
      digits = digits.slice(0, 11);

      var body = digits.slice(1);
      var out = '+7';
      if (body.length) out += ' (' + body.slice(0, 3);
      if (body.length >= 3) out += ')';
      if (body.length > 3) out += ' ' + body.slice(3, 6);
      if (body.length > 6) out += '-' + body.slice(6, 8);
      if (body.length > 8) out += '-' + body.slice(8, 10);
      return out;
    }

    input.addEventListener('input', function () {
      input.value = format(input.value);
      input.classList.remove('invalid');
    });
  }

  /* ------------------------------------------------------------------
     7. Форма заявки — БЕЗ БЭКЕНДА
     Данные никуда не уходят: имитация отправки через alert('Заявка отправлена (демо)').
     Чтобы подключить реальную отправку — замените обработчик на fetch()
     на свой эндпоинт или сервис форм.
     ------------------------------------------------------------------ */
  function initForm() {
    var form = document.getElementById('lead-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var phone = form.querySelector('#phone');
    initPhoneMask(phone);

    var nameField = form.querySelector('#name');
    [nameField, phone].forEach(function (field) {
      if (field) field.addEventListener('input', function () { field.classList.remove('invalid'); });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var errors = [];

      if (!nameField.value.trim()) {
        nameField.classList.add('invalid');
        errors.push('Укажите имя');
      }

      var phoneDigits = phone.value.replace(/\D/g, '');
      if (phoneDigits.length < 11) {
        phone.classList.add('invalid');
        errors.push('Укажите телефон полностью');
      }

      var consent = form.querySelector('#consent');
      if (consent && !consent.checked) {
        errors.push('Нужно согласие на обработку данных');
      }

      if (errors.length) {
        if (status) {
          status.textContent = errors.join('. ') + '.';
          status.classList.add('error');
        }
        var firstInvalid = form.querySelector('.invalid') || consent;
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (status) {
        status.classList.remove('error');
        status.textContent = '';
      }

      // ЗАГЛУШКА ВМЕСТО ОТПРАВКИ НА СЕРВЕР
      window.alert('Заявка отправлена (демо)');

      form.reset();
      if (phone) phone.value = '';
    });
  }

  /* ------------------------------------------------------------------
     8. Текущий год в футере
     ------------------------------------------------------------------ */
  function initYear() {
    var node = document.getElementById('year');
    if (node) node.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
     9. Плавная прокрутка с учётом фиксированной шапки
     (браузерная поддержка уже есть в CSS, здесь — запасной путь для ссылок)
     ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      var target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      // Обновляем адрес, чтобы ссылку можно было скопировать
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', id);
      }
    });
  }

  /* ---------- Запуск ---------- */
  function init() {
    documentEl.classList.add('js-enabled');
    initBurger();
    initHeaderShadow();
    initAccordion();
    initReveal();
    initScrollSpy();
    initForm();
    initYear();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
