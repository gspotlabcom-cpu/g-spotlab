(function () {
  'use strict';

  const measurementId = 'G-DW4T550YNL';
  const consentKey = 'gsl_analytics_consent';
  let googleTagLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);

  function readConsent() {
    try {
      return window.localStorage.getItem(consentKey);
    } catch (error) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (error) {
      // Consent still applies for the current page when storage is unavailable.
    }
  }

  function loadGoogleTag() {
    if (googleTagLoaded) return;
    googleTagLoaded = true;

    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      send_page_view: true
    });
  }

  function deleteAnalyticsCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
      document.cookie = name + '=; Max-Age=0; path=/; domain=.g-spotlab.com; SameSite=Lax';
    });
  }

  function grantConsent() {
    saveConsent('granted');
    closeBanner();
    addSettingsButton();
    loadGoogleTag();
  }

  function denyConsent() {
    saveConsent('denied');
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    deleteAnalyticsCookies();
    closeBanner();
    addSettingsButton();
  }

  function closeBanner() {
    const banner = document.querySelector('[data-gsl-consent-banner]');
    if (banner) banner.remove();
  }

  function showBanner() {
    closeBanner();

    const settingsButton = document.querySelector('[data-gsl-consent-settings]');
    if (settingsButton) settingsButton.hidden = true;

    const banner = document.createElement('section');
    banner.className = 'gsl-consent-banner';
    banner.dataset.gslConsentBanner = '';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Analytics cookie preferences');
    banner.innerHTML =
      '<div class="gsl-consent-copy">' +
        '<p>We use optional analytics cookies to understand how visitors use our website.' +
        '<a href="/privacy/">Privacy Policy</a></p>' +
      '</div>' +
      '<div class="gsl-consent-actions">' +
        '<button type="button" data-gsl-consent="deny">Reject</button>' +
        '<button type="button" class="is-primary" data-gsl-consent="grant">Accept</button>' +
      '</div>';

    document.body.appendChild(banner);
  }

  function addSettingsButton() {
    const existingButton = document.querySelector('[data-gsl-consent-settings]');
    if (existingButton) {
      existingButton.hidden = false;
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gsl-consent-settings';
    button.dataset.gslConsentSettings = '';
    button.textContent = 'Cookie settings';
    button.addEventListener('click', showBanner);
    const footerTarget = document.querySelector('.footer-links') ||
      document.querySelector('footer .wrap') ||
      document.querySelector('footer');
    (footerTarget || document.body).appendChild(button);
  }

  function productName(element) {
    const card = element.closest('article');
    const heading = card && card.querySelector('h2, h3');
    return heading ? heading.textContent.trim() : 'Unknown product';
  }

  function sendEvent(name, parameters) {
    if (readConsent() !== 'granted') return;
    window.gtag('event', name, parameters || {});
  }

  document.addEventListener('click', function (event) {
    const consentButton = event.target.closest('[data-gsl-consent]');
    if (consentButton) {
      if (consentButton.dataset.gslConsent === 'grant') grantConsent();
      else denyConsent();
      return;
    }

    const video = event.target.closest('[data-video-id]');
    if (video) {
      sendEvent('video_open', {
        video_id: video.dataset.videoId || '',
        video_title: video.dataset.videoTitle || productName(video),
        product_name: productName(video)
      });
    }

    const link = event.target.closest('a[href]');
    if (link) {
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }

      const host = url.hostname.replace(/^www\./, '');
      if (host === 'assetstore.unity.com' || host === 'fab.com') {
        sendEvent('marketplace_click', {
          marketplace: host === 'fab.com' ? 'Fab' : 'Unity Asset Store',
          product_name: productName(link),
          link_url: url.href,
          link_text: link.textContent.trim()
        });
      } else if (url.origin === window.location.origin && url.pathname === '/toolkits/') {
        sendEvent('toolkit_catalog_open', {
          link_url: url.href,
          link_text: link.textContent.trim()
        });
      }
    }

    const emailButton = event.target.closest('[data-copy-email]');
    if (emailButton) {
      sendEvent('support_email_copy', { location: window.location.pathname });
    }
  }, true);

  function initialize() {
    const consent = readConsent();
    if (consent === 'granted') {
      addSettingsButton();
      loadGoogleTag();
    } else if (consent === 'denied') {
      addSettingsButton();
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

