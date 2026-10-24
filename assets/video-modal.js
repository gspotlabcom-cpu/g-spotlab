/* Click-to-load product videos. Marketplace actions are read from the
   product card so the lightbox always matches its Unity/Fab availability. */
(function () {
  if (!document.querySelector('a[data-video-id]')) return;

  var dialog = document.createElement('dialog');
  dialog.className = 'gsl-video-dialog';
  dialog.setAttribute('aria-label', 'Product demonstration video');
  dialog.innerHTML =
    '<div class="gsl-video-shell">' +
      '<button type="button" class="gsl-video-close" aria-label="Close video">×</button>' +
      '<div class="gsl-video-frame"></div>' +
      '<div class="gsl-video-bar">' +
        '<p class="gsl-video-name"></p>' +
        '<div class="gsl-video-markets" aria-label="Marketplace availability"></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(dialog);

  var frame = dialog.querySelector('.gsl-video-frame');
  var title = dialog.querySelector('.gsl-video-name');
  var markets = dialog.querySelector('.gsl-video-markets');
  var lastTrigger = null;

  function close() {
    if (dialog.open) dialog.close();
  }

  function addMarket(label, source) {
    var activeLink = source && source.querySelector('a[href]');
    if (activeLink) {
      var link = document.createElement('a');
      link.className = 'gsl-video-market-link';
      link.href = activeLink.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = label;
      markets.appendChild(link);
      return;
    }

    var disabled = document.createElement('span');
    disabled.className = 'gsl-video-market-disabled';
    disabled.setAttribute('aria-disabled', 'true');
    var name = document.createElement('span');
    name.className = 'gsl-video-market-title';
    name.textContent = label === 'Unity Store' ? 'Unity' : 'Fab';
    disabled.appendChild(name);

    var state = source && source.querySelector('.store-state, .store-note');
    var badge = document.createElement('span');
    var status = state ? state.textContent.trim() :
      (label === 'Unity Store' ? 'In review' : 'In development');
    badge.className = 'gsl-video-market-badge' +
      (/review/i.test(status) ? ' review' : ' development');
    badge.textContent = status;
    disabled.appendChild(badge);
    markets.appendChild(disabled);
  }

  function populateMarkets(trigger) {
    markets.replaceChildren();
    var card = trigger.closest('.toolkit, .asset-card, .product');
    if (!card) return;
    var sources = card.querySelectorAll('.store-options .store-option');
    if (sources.length >= 2) {
      addMarket('Unity Store', sources[0]);
      addMarket('Fab', sources[1]);
      return;
    }
    // Ready-to-Use cards have two direct store links in .asset-actions.
    var links = card.querySelectorAll('.asset-actions a[href]');
    if (links.length >= 2) {
      var wrappers = [];
      links.forEach(function (link) {
        var wrapper = document.createElement('span');
        wrapper.appendChild(link.cloneNode(true));
        wrappers.push(wrapper);
      });
      addMarket('Unity Store', wrappers[0]);
      addMarket('Fab', wrappers[1]);
    }
  }

  dialog.querySelector('.gsl-video-close').addEventListener('click', close);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', function () {
    frame.replaceChildren(); // Stop playback when the lightbox closes.
    markets.replaceChildren();
    if (lastTrigger && lastTrigger.isConnected) {
      lastTrigger.focus({ preventScroll: true });
    }
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('a[data-video-id]');
    if (!trigger || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (typeof dialog.showModal !== 'function') return;
    var id = trigger.getAttribute('data-video-id');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    event.preventDefault();
    lastTrigger = trigger;
    title.textContent = trigger.getAttribute('data-video-title') ||
      'G-Spot Lab demonstration';
    populateMarkets(trigger);

    var iframe = document.createElement('iframe');
    iframe.title = title.textContent;
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
    dialog.showModal();
  });
})();
