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
  }

  function closeBanner() {
    const banner = document.querySelector('[data-gsl-consent-banner]');
    if (banner) banner.remove();
  }

  function showBanner() {
    closeBanner();

    const banner = document.createElement('section');
    banner.className = 'gsl-consent-banner';
    banner.dataset.gslConsentBanner = '';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'gsl-consent-title');
    banner.innerHTML =
      '<div class="gsl-consent-copy">' +
        '<strong id="gsl-consent-title">Optional website analytics</strong>' +
        '<p>Allow anonymous Google Analytics measurement to help G-Spot Lab understand page visits, video opens and marketplace clicks. Advertising storage and personalization stay disabled.</p>' +
        '<a href="/privacy/">Privacy Policy</a>' +
      '</div>' +
      '<div class="gsl-consent-actions">' +
        '<button type="button" data-gsl-consent="deny">Reject</button>' +
        '<button type="button" class="is-primary" data-gsl-consent="grant">Allow analytics</button>' +
      '</div>';

    document.body.appendChild(banner);
    const primaryButton = banner.querySelector('[data-gsl-consent="grant"]');
    if (primaryButton) primaryButton.focus({ preventScroll: true });
  }

  function addSettingsButton() {
    if (document.querySelector('[data-gsl-consent-settings]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gsl-consent-settings';
    button.dataset.gslConsentSettings = '';
    button.textContent = 'Privacy settings';
    button.addEventListener('click', showBanner);
    document.body.appendChild(button);
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
    addSettingsButton();
    const consent = readConsent();
    if (consent === 'granted') loadGoogleTag();
    else if (consent !== 'denied') showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

