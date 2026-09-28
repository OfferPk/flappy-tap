/**
 * Cow-cash monetization stubs only.
 * Core play works without ads. No network, no AdMob IDs.
 *
 * API:
 *   Ads.showRewarded(reason) → Promise<{ rewarded, stub }>
 *   Ads.showInterstitial(reason) → Promise<{ shown, stub }>
 */
(function (global) {
  'use strict';

  const CONFIG = global.ADMOB_CONFIG || {
    enabled: false,
    interstitialId: null,
    rewardedId: null
  };

  function ensureModal() {
    let el = document.getElementById('ad-stub-modal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ad-stub-modal';
    el.hidden = true;
    el.innerHTML =
      '<div class="ad-stub-card" role="dialog" aria-modal="true">' +
      '<h3 class="ad-stub-title">Ad (stub)</h3>' +
      '<p class="ad-stub-body"></p>' +
      '<div class="ad-stub-actions">' +
      '<button type="button" class="btn primary" data-ad-yes>Grant</button>' +
      '<button type="button" class="btn ghost" data-ad-no>Skip</button>' +
      '</div></div>';
    (document.getElementById('app') || document.body).appendChild(el);
    return el;
  }

  function promptStub(title, body) {
    return new Promise((resolve) => {
      const host = ensureModal();
      const t = host.querySelector('.ad-stub-title');
      const b = host.querySelector('.ad-stub-body');
      if (t) t.textContent = title;
      if (b) b.textContent = body;
      host.hidden = false;

      const yes = host.querySelector('[data-ad-yes]');
      const no = host.querySelector('[data-ad-no]');

      function cleanup() {
        host.hidden = true;
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
      }
      function onYes() {
        cleanup();
        resolve(true);
      }
      function onNo() {
        cleanup();
        resolve(false);
      }
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }

  /**
   * Rewarded continue after death.
   */
  function showRewarded(reason) {
    return new Promise(async (resolve) => {
      if (CONFIG.enabled && CONFIG.rewardedId) {
        resolve({ rewarded: false, stub: false, reason: 'no-plugin' });
        return;
      }
      const ok = await promptStub(
        'Rewarded Ad (stub)',
        'Continue run after death?\n\nNo AdMob ID configured. Grant reward for this session?\n(' +
          (reason || 'continue') +
          ')'
      );
      resolve({ rewarded: ok, stub: true, reason: reason || 'continue' });
    });
  }

  /**
   * Interstitial between runs (optional; never blocks play).
   */
  function showInterstitial(reason) {
    return new Promise(async (resolve) => {
      if (CONFIG.enabled && CONFIG.interstitialId) {
        resolve({ shown: false, stub: false, reason: 'no-plugin' });
        return;
      }
      // Soft stub: quick toast-style confirm, skippable
      const ok = await promptStub(
        'Interstitial (stub)',
        'Between-runs ad placeholder.\n\nSimulate watching? Core play continues either way.\n(' +
          (reason || 'between-runs') +
          ')'
      );
      resolve({ shown: ok, stub: true, reason: reason || 'between-runs' });
    });
  }

  global.Ads = { showRewarded, showInterstitial, CONFIG };
})(window);
