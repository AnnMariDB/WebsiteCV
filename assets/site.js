/* Small progressive enhancements. Every page works fully without this file. */
(function () {
  'use strict';

  // 0000. The Contact buttons scroll to the Get in touch band without putting #contact in the address bar,
  //       so a link copied afterwards is the clean page address. (Without this script they are plain links.)
  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href="#contact"]') : null;
    var band = document.getElementById('contact');
    if (!link || !band) return;
    event.preventDefault();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    band.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var heading = band.querySelector('h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  });

  // 00. Sticky header: tell the CSS how tall it is (the CV section bar and jump links sit below it), and add a shadow once the page has scrolled.
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var measureHeader = function () {
      var bar = document.querySelector('.secbar');
      var rootStyle = document.documentElement.style;
      rootStyle.setProperty('--header-h', siteHeader.offsetHeight + 'px');
      rootStyle.setProperty('--sticky-h', siteHeader.offsetHeight + (bar ? bar.offsetHeight : 0) + 'px');
    };
    var markScrolled = function () { siteHeader.classList.toggle('is-stuck', window.scrollY > 4); };
    measureHeader();
    markScrolled();
    window.addEventListener('load', measureHeader);
    window.addEventListener('resize', measureHeader);
    window.addEventListener('scroll', markScrolled, { passive: true });
  }

  // 000. Menu drawer: the header button opens it from the left. It closes with the X, a click on the dimmed page,
  //      Escape, or after a link is chosen, and keeps keyboard focus inside while it is open.
  var menuButton = document.querySelector('[data-menu-open]');
  var drawer = document.getElementById('site-menu');
  var scrim = document.querySelector('.drawer-scrim');
  if (menuButton && drawer && scrim) {
    var lastFocus = null;
    var setMenu = function (open, returnFocus) {
      drawer.hidden = !open;
      scrim.hidden = !open;
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', open);
      if (open) {
        lastFocus = document.activeElement;
        var closeButton = drawer.querySelector('.drawer__close');
        if (closeButton) closeButton.focus();
      } else if (returnFocus) {
        menuButton.focus();
      }
    };
    menuButton.hidden = false;
    menuButton.addEventListener('click', function () { setMenu(drawer.hidden, false); });
    document.querySelectorAll('[data-menu-close]').forEach(function (el) {
      el.addEventListener('click', function () { setMenu(false, true); });
    });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setMenu(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (drawer.hidden) return;
      if (event.key === 'Escape') { setMenu(false, true); return; }
      if (event.key !== 'Tab') return;
      var items = Array.prototype.slice.call(drawer.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) { return !el.hidden && el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  // 00. Copy buttons (email address, website link): press, copy, show a tick and "copied" for a moment.
  //     The email address is put together here, only when the button is pressed, so it is never in the page source.
  var fallbackCopy = function (text) {
    var box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(box);
    box.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* not allowed here */ }
    document.body.removeChild(box);
    return ok;
  };
  var setUpCopyButton = function (button, textToCopy, doneText) {
    var label = button.querySelector('[data-copy-label]');
    var next = button.nextElementSibling;
    var status = next && next.hasAttribute('data-copy-status') ? next : null;
    var original = label ? label.textContent : '';
    var timer = 0;
    var show = function (copied) {
      button.classList.toggle('is-done', copied);
      if (label) label.textContent = copied ? doneText : original;
      if (status) status.textContent = copied ? doneText : '';
      clearTimeout(timer);
      if (copied) timer = setTimeout(function () { show(false); }, 2200);
    };
    button.hidden = false;
    button.addEventListener('click', function () {
      var text = textToCopy();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { show(true); }, function () { show(fallbackCopy(text)); });
      } else {
        show(fallbackCopy(text));
      }
    });
  };
  document.querySelectorAll('[data-copy-email]').forEach(function (button) {
    var user = button.getAttribute('data-user');
    var domain = button.getAttribute('data-domain');
    if (!user || !domain) return;
    setUpCopyButton(button, function () { return user + '@' + domain; }, 'Email address copied');
  });
  document.querySelectorAll('[data-copy-link]').forEach(function (button) {
    var link = button.getAttribute('data-copy-link');
    if (!link) return;
    setUpCopyButton(button, function () { return link; }, 'Website link copied');
  });

  // 0. Message form: an email address OR a phone number is needed (either is enough).
  //    Without this script the email stays required, so the form still works.
  var messageForm = document.getElementById('contact-form');
  if (messageForm) {
    var emailField = messageForm.querySelector('[name="email"]');
    var phoneField = messageForm.querySelector('[name="phone"]');
    var checkContact = function () {
      var hasPhone = phoneField.value.trim() !== '';
      emailField.required = !hasPhone;
      emailField.setCustomValidity(!hasPhone && emailField.value.trim() === '' ? 'Please leave an email address or a phone number.' : '');
    };
    emailField.addEventListener('input', checkContact);
    phoneField.addEventListener('input', checkContact);
    checkContact();
  }

  // 1. Email: the address is assembled here so it never sits in the page source as plain text.
  document.querySelectorAll('[data-email]').forEach(function (el) {
    var user = el.getAttribute('data-user');
    var domain = el.getAttribute('data-domain');
    if (!user || !domain) return;
    var address = user + '@' + domain;
    el.setAttribute('href', 'mailto:' + address);
    var label = el.querySelector('[data-email-label]');
    if (label && el.hasAttribute('data-show-address')) label.textContent = address;
    el.hidden = false;

    // A web page cannot tell whether the visitor has an email app. So after the link is clicked, wait a moment:
    // if the page is still in front (no email app, or the browser's mail handler, took over), open the address in Gmail in a new tab instead.
    el.addEventListener('click', function () {
      var tookOver = false;
      var mark = function () { tookOver = true; };
      window.addEventListener('blur', mark);
      document.addEventListener('visibilitychange', mark);
      setTimeout(function () {
        window.removeEventListener('blur', mark);
        document.removeEventListener('visibilitychange', mark);
        if (!tookOver && !document.hidden) {
          window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(address), '_blank', 'noopener');
        }
      }, 1500);
    });
  });

  // 2. Light / dark switch. Every visit opens in DARK mode (the page itself says data-theme="dark").
  //    The header button lets a visitor look at light mode; that choice is kept only while the tab stays open.
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var barColour = { light: '#ffffff', dark: '#130a2b' }; // same as --header-bg in each theme
  var activeTheme = function () {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  };
  var syncToggle = function () {
    var mode = activeTheme();
    var next = mode === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('data-mode', mode);
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    toggle.setAttribute('title', 'Switch to ' + next + ' mode');
  };
  if (toggle) {
    toggle.hidden = false;
    syncToggle();
    toggle.addEventListener('click', function () {
      var next = activeTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { sessionStorage.setItem('amdb-theme', next); } catch (e) { /* the choice just isn't kept between pages */ }
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) { meta.setAttribute('content', barColour[next]); });
      syncToggle();
    });
  }

  // 3. Detailed CV: highlight the section currently on screen in the sticky section bar.
  var bar = document.querySelector('.secbar');
  if (bar && 'IntersectionObserver' in window) {
    var list = bar.querySelector('ul');
    var links = Array.prototype.slice.call(bar.querySelectorAll('a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a === byId[id];
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      var active = byId[id];
      if (active && list) {
        var target = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-15% 0px -70% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
})();
