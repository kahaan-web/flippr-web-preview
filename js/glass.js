/* iOS 26-style Liquid Glass lensing.
   For each .glass.lens element we paint a displacement map for its rounded-rect shape on a canvas
   (neutral in the middle, bending inward toward the rim, like a convex glass edge), wrap it in an
   SVG filter and use it as the element's backdrop-filter. Chromium applies it; other engines keep
   the blur/saturate fallback from base.css. Rebuilt on resize. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  document.body.appendChild(svg);
  const ok = CSS.supports('backdrop-filter', 'url(#x)') || CSS.supports('-webkit-backdrop-filter', 'url(#x)');
  let n = 0;

  function map(w, h, r, edge) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // signed distance to a rounded rect + outward normal
      const qx = Math.abs(x + .5 - w / 2) - (w / 2 - r), qy = Math.abs(y + .5 - h / 2) - (h / 2 - r);
      let nx = 0, ny = 0, dist;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); dist = r - l; nx = qx / l; ny = qy / l; }
      else if (qx > qy) { dist = r - qx; nx = 1; } else { dist = r - qy; ny = 1; }
      nx *= Math.sign(x + .5 - w / 2) || 1; ny *= Math.sign(y + .5 - h / 2) || 1;
      const t = Math.max(0, Math.min(1, dist / edge)), m = Math.pow(1 - t, 2.2); // strongest at the rim
      const i = (y * w + x) * 4;
      d[i] = 128 - nx * m * 127; d[i + 1] = 128 - ny * m * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return c.toDataURL();
  }

  function build(el) {
    const b = el.getBoundingClientRect(); const w = Math.round(b.width), h = Math.round(b.height);
    if (!w || !h) return;
    const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2, w / 2);
    const edge = Math.min(+el.dataset.edge || 18, h / 2), scale = +el.dataset.lens || 26;
    const id = el._gid || (el._gid = 'lg' + (++n));
    let f = svg.querySelector('#' + id);
    if (!f) { f = document.createElementNS(NS, 'filter'); f.id = id; svg.appendChild(f); }
    f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', w); f.setAttribute('height', h);
    f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML =
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${el.dataset.blur || 2.2}" result="b"/>` +
      `<feImage href="${map(w, h, r, edge)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>` +
      `<feDisplacementMap in="b" in2="m" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>`;
    el.style.setProperty('--lens', `url(#${id})`);
    el.classList.add('lens');
  }

  const els = () => document.querySelectorAll('.glass[data-lens]');
  window.FLGlass = { refresh() { if (ok) els().forEach(build); } };
  if (ok) { addEventListener('load', FLGlass.refresh); addEventListener('resize', () => { clearTimeout(FLGlass._t); FLGlass._t = setTimeout(FLGlass.refresh, 120); }); }
})();
