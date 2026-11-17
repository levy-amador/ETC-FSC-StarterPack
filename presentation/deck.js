(function () {
  var S = Array.prototype.slice.call(document.querySelectorAll('.slide')), N = S.length, cur = 0;
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--s', s);
  }
  function go(i, push) {
    i = Math.max(0, Math.min(N - 1, i));
    S[cur].classList.remove('active');
    cur = i;
    S[cur].classList.add('active');
    document.getElementById('cnt').textContent = (cur + 1) + ' / ' + N;
    document.getElementById('bar').style.width = ((cur + 1) / N * 100) + '%';
    document.title = S[cur].getAttribute('data-label') + ' · FSC Starter Pack';
    if (push !== false && location.hash !== '#' + (cur + 1)) history.replaceState(null, '', '#' + (cur + 1));
  }
  function fromHash() {
    var n = parseInt((location.hash || '').replace('#', '').replace('s', ''), 10);
    return isNaN(n) ? 0 : n - 1;
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Spacebar') { e.preventDefault(); go(cur + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(N - 1); }
    else if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('a,button')) return;
    go(e.clientX > window.innerWidth / 2 ? cur + 1 : cur - 1);
  });
  window.addEventListener('hashchange', function () { go(fromHash(), false); });
  window.addEventListener('resize', fit);
  fit();
  S[0].classList.add('active');
  go(fromHash(), false);
})();
