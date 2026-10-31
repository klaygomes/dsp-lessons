(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const shown = fig => getComputedStyle(fig).display !== 'none';
  const endOf = fig => Math.max(0, ...fig.getAnimations({ subtree: true }).map(a => Number(a.effect.getComputedTiming().endTime) || 0));
  function play(holder) {
    const figs = [...holder.querySelectorAll('svg.k-fig[data-motion-root]')];
    clearTimeout(holder.kDone);
    figs.forEach(fig => {
      fig.classList.remove('k-done', 'k-wait');
      if (!shown(fig)) { fig.classList.add('k-done'); return; }
      fig.classList.add('k-reset'); fig.getBoundingClientRect(); fig.classList.remove('k-reset');
    });
    const end = Math.max(0, ...figs.filter(shown).map(endOf));
    holder.kDone = setTimeout(() => figs.forEach(fig => fig.classList.add('k-done')), end + 100);
  }
  const holders = [...document.querySelectorAll('figure.k-figure')].filter(h => h.querySelector('svg.k-fig[data-motion-root]'));
  const seen = 'IntersectionObserver' in window && new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio >= 0.4) { seen.unobserve(e.target); play(e.target); }
  }), { threshold: [0, 0.4] });
  holders.forEach(holder => {
    const figs = [...holder.querySelectorAll('svg.k-fig[data-motion-root]')];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'k-replay quiet'; b.textContent = 'Replay the animation';
    b.setAttribute('aria-label', `Replay the animation: ${figs[0].querySelector('title')?.textContent || 'figure'}`);
    b.addEventListener('click', () => play(holder));
    holder.append(b);
    if (reduced.matches || !seen) { figs.forEach(fig => fig.classList.add('k-done')); return; }
    figs.forEach(fig => fig.classList.add('k-wait'));
    seen.observe(holder);
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'), target = a && document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    const focusable = target.matches('a, button, input, [tabindex]') ? target : target.querySelector('h2') || target;
    if (!focusable.hasAttribute('tabindex') && !focusable.matches('a, button, input')) focusable.tabIndex = -1;
    requestAnimationFrame(() => focusable.focus({ preventScroll: true }));
  });

  document.querySelectorAll('.k-working').forEach(box => {
    const button = box.querySelector('.k-working-open'), body = box.querySelector('.k-working-body');
    const reveal = () => { body.hidden = false; if (button) button.hidden = true; box.querySelector('.k-working-note').hidden = true; };
    if (button) button.addEventListener('click', () => { reveal(); body.focus(); });
    document.addEventListener('k:solved', e => {
      if (e.detail !== box.dataset.unlock) return;
      if (!button) { reveal(); return; }
      if (!button.disabled) return;
      button.disabled = false;
      button.textContent = 'Show the working';
      box.querySelector('.k-working-note').textContent = box.dataset.opened || 'You have fixed it, so this part is open to read.';
    });
  });
})();
