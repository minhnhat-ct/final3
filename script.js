"use strict";
/* Portfolio · Lê Minh Nhật
   1 Progress + magnetic cursor · 2 Staggered reveal · 3 Science lab · 4 Plickers · 5 Product filter · 6 Tilt + spotlight · 7 Ripple · 8 Scroll-spy */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* 1. Thanh tiến trình + con trỏ nam châm — dùng chung một vòng rAF */
  const bar = $("#progress"), dot = $("#cursorDot"), ring = $("#cursorRing");
  const ratio = () => { const h = document.documentElement.scrollHeight - innerHeight; return h > 0 ? scrollY / h : 0; };
  let goal = ratio(), cur = goal, mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  const sync = () => { goal = ratio(); };
  addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", sync, { passive: true });

  if (fine) {
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const hot = "a,button,.btn,label,input[type=range],.lift,.project,.feat-card";
    const setZone = (el, z) => z ? (el.dataset.zone = z) : el.removeAttribute("data-zone");
    document.addEventListener("mouseover", e => {
      ring.classList.toggle("active", !!e.target.closest(hot));
      const z = e.target.closest("[data-zone]")?.dataset.zone;      // vùng Khoa học → đổi màu con trỏ
      if (ring.dataset.zone !== z) { setZone(ring, z); setZone(dot, z); }
    });
    document.addEventListener("mousedown", () => ring.classList.add("press"));
    document.addEventListener("mouseup", () => ring.classList.remove("press"));
    $$(".btn,.nav-cta,.nav-links a,.filter-btn,.lab-tab-btn,.hl-btn").forEach(el => {
      el.dataset.mag = "";
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * .22}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
      });
      el.addEventListener("mouseleave", () => { el.style.translate = ""; });
    });
  }
  /* 1b. Tilt 3D + spotlight: trạng thái nội suy ngay trong vòng rAF chung (không thêm vòng lặp) */
  const tilts = new Map();
  $$(".project,.feat-card,.paper-card").forEach(el => {
    el.classList.add("tilt");
    el.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      const s = tilts.get(el) || { rx: 0, ry: 0 };
      s.cx = e.clientX; s.cy = e.clientY; s.on = true; tilts.set(el, s);
      el.classList.add("is-tilting");
    }, { passive: true });
    el.addEventListener("pointerleave", () => { const s = tilts.get(el); if (s) s.on = false; });
  });
  const stepTilt = () => tilts.forEach((s, el) => {
    let trx = 0, try_ = 0;
    if (s.on) {
      const r = el.getBoundingClientRect(), px = (s.cx - r.left) / r.width, py = (s.cy - r.top) / r.height;
      const max = reduce ? 0 : Math.max(2.5, Math.min(8, 2600 / r.width));   // thẻ càng rộng, góc càng nhỏ
      try_ = (px - .5) * 2 * max; trx = -(py - .5) * 2 * max;
      el.style.setProperty("--mx", `${(px * r.width).toFixed(1)}px`);
      el.style.setProperty("--my", `${(py * r.height).toFixed(1)}px`);
    }
    s.rx += (trx - s.rx) * .14; s.ry += (try_ - s.ry) * .14;
    el.style.setProperty("--rx", `${s.rx.toFixed(3)}deg`);
    el.style.setProperty("--ry", `${s.ry.toFixed(3)}deg`);
    if (!s.on && Math.abs(s.rx) + Math.abs(s.ry) < .02) { el.classList.remove("is-tilting"); tilts.delete(el); }
  });

  const tick = () => {
    stepTilt();
    cur += (goal - cur) * (reduce ? 1 : .14);
    bar.style.transform = `scaleX(${cur.toFixed(4)})`;
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  };
  tick();

  /* 2a. Counter: số chạy 0 → giá trị thật, cùng nhịp với thanh scaleX (CSS) */
  const countUp = (el, delay) => {
    const to = +el.dataset.count, t0 = performance.now() + delay, dur = 1600;
    const step = now => {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      el.textContent = `${Math.round(to * (1 - (1 - p) ** 4))}%`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduce) $$("[data-count]").forEach(n => { n.textContent = "0%"; });

  /* 2. Reveal: fade-in + slide-up, so le theo từng đợt xuất hiện */
  $$(".tool-item").forEach(el => el.classList.add("reveal"));
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.setProperty("--d", `${Math.min(i, 5) * 90}ms`);
      $$("[data-count]", e.target).forEach((n, k) => {
        const d = 200 + k * 120;
        n.closest(".skill-row").style.setProperty("--d", `${d}ms`);
        reduce ? (n.textContent = `${n.dataset.count}%`) : countUp(n, d);
      });
      e.target.classList.add("show");
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("show"));

  /* 3. Không gian tương tác KHTN */
  const tabs = $$(".lab-tab-btn"), panes = $$(".lab-tab-content");
  tabs.forEach(btn => btn.addEventListener("click", () => {
    if (btn.classList.contains("active")) return;
    tabs.forEach(t => t.classList.toggle("active", t === btn));
    panes.forEach(p => p.classList.toggle("active", p.id === btn.dataset.target));
  }));

  const angle = $("#angle-slider");           // Vật lí: máy chiếu laze + khúc xạ ánh sáng (SVG)
  if (angle) {
    const [out, inc, ref, laser, arcI, arcR, lblI, lblR, outI, outR, sim, tog] =
      ["#angle-val", "#incident-ray", "#refracted-ray", "#laser", "#arc-i", "#arc-r", "#lbl-i", "#lbl-r", "#i-out", "#r-out", "#optics-sim", "#laser-toggle"].map(q => $(q));
    const O = { x: 240, y: 200 }, css = getComputedStyle(sim), LASER_R = parseFloat(css.getPropertyValue("--incident-ray-length")) || 170, REF_LEN = parseFloat(css.getPropertyValue("--refracted-ray-length")) || 500, ARC = 44, n1 = 1, n2 = 1.33;
    const rad = d => d * Math.PI / 180, f = v => v.toFixed(1);
    const line = (el, x1, y1, x2, y2) => { el.setAttribute("x1", f(x1)); el.setAttribute("y1", f(y1)); el.setAttribute("x2", f(x2)); el.setAttribute("y2", f(y2)); };
    const label = (el, x, y, text) => { el.setAttribute("x", f(x)); el.setAttribute("y", f(y + 4)); el.textContent = text; };
    const update = () => {
      const i = +angle.value, r = Math.asin(n1 * Math.sin(rad(i)) / n2) * 180 / Math.PI;   // định luật Snell
      const si = Math.sin(rad(i)), ci = Math.cos(rad(i)), sr = Math.sin(rad(r)), cr = Math.cos(rad(r));
      const tx = O.x - LASER_R * si, ty = O.y - LASER_R * ci;                              // đầu súng laze
      line(inc, tx, ty, O.x, O.y);
      line(ref, O.x, O.y, O.x + REF_LEN * sr, O.y + REF_LEN * cr);
      laser.setAttribute("transform", `translate(${f(tx)} ${f(ty)}) rotate(${90 - i})`);
      arcI.setAttribute("d", `M${O.x} ${O.y - ARC} A${ARC} ${ARC} 0 0 0 ${f(O.x - ARC * si)} ${f(O.y - ARC * ci)}`);
      arcR.setAttribute("d", `M${O.x} ${O.y + ARC} A${ARC} ${ARC} 0 0 0 ${f(O.x + ARC * sr)} ${f(O.y + ARC * cr)}`);
      label(lblI, O.x + 14, O.y - 50, `i = ${i}°`);          // nhãn đặt ở phía trống của pháp tuyến, không đè lên tia
      label(lblR, O.x - 14, O.y + 58, `r = ${f(r)}°`);
      out.textContent = i; outI.textContent = `${i}°`; outR.textContent = `${f(r)}°`;
    };
    angle.addEventListener("input", update);
    tog?.addEventListener("click", () => {
      const on = tog.getAttribute("aria-pressed") !== "true";
      tog.setAttribute("aria-pressed", String(on));
      tog.textContent = on ? "◉ Laze: Bật" : "○ Laze: Tắt";
      sim.classList.toggle("is-off", !on);
    });
    update();
  }

  const liquid = $("#liquid");                // Hóa học: chỉ thị màu
  if (liquid) {
    const status = $("#chem-status"), picked = [];
    const RESULT = {
      "base+indicator": ["rgba(216,27,96,.85)", "Dung dịch hồng (Môi trường Base)"],
      "acid+base": ["rgba(173,216,230,.6)", "Trung hòa (Muối + Nước)"],
      "acid+indicator": ["rgba(240,240,240,.8)", "Không đổi màu (Môi trường Acid)"]
    };
    const render = () => {
      liquid.style.height = `${picked.length * 45}%`;
      if (picked.length === 1) { status.textContent = "Đã thêm 1 chất..."; liquid.style.backgroundColor = "rgba(200,200,200,.4)"; }
      if (picked.length === 2) { 
        const key = [...picked].sort().join("+");
        const res = RESULT[key];
        if (res) {
          const [c, t] = res; 
          liquid.style.backgroundColor = c; 
          status.textContent = t; 
        }
      }
    };
    $$(".chem-btn").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.chem;
      if (picked.length < 2 && !picked.includes(k)) { picked.push(k); render(); }
    }));
    $("#reset-chem")?.addEventListener("click", () => {
      picked.length = 0;
      liquid.style.height = "0%"; liquid.style.backgroundColor = "transparent"; status.textContent = "Cốc trống";
    });
  }

  const focus = $("#focus-slider"), cell = $("#cell-image");   // Sinh học: kính hiển vi
  if (focus && cell) {
    const updateFocus = () => { cell.style.filter = `blur(${Math.abs(70 - focus.value) / 5}px)`; };
    focus.addEventListener("input", updateFocus);
    updateFocus();
  }

  /* 4. Plickers: mở / thu gọn */
  const pBtn = $("#plickersToggle"), pBox = $("#plickersContent");
  const setOpen = (open, scroll = false) => {
    if (!pBtn || !pBox) return;
    pBtn.setAttribute("aria-expanded", String(open));
    pBox.hidden = !open;
    if (scroll) requestAnimationFrame(() => scrollTo({ top: pBtn.getBoundingClientRect().top + scrollY - 110, behavior: "smooth" }));
  };
  pBtn?.addEventListener("click", () => setOpen(pBtn.getAttribute("aria-expanded") !== "true"));
  $('.nav a[href="#plickers"]')?.addEventListener("click", e => { e.preventDefault(); setOpen(true, true); });
  if (location.hash === "#plickers") setOpen(true);
  addEventListener("hashchange", () => location.hash === "#plickers" && setOpen(true, true));
  $$('.project[href="#"]').forEach(a => a.addEventListener("click", e => e.preventDefault()));

  /* 5. Bộ lọc sản phẩm (products.html) */
  const filterBar = $(".product-filter");
  if (filterBar) {
    const items = $$("[data-cat]"), btns = $$(".filter-btn", filterBar);
    const match = (el, f) => f === "all" || el.dataset.cat.split(" ").includes(f);
    btns.forEach(b => { const c = $(".count", b); if (c) c.textContent = items.filter(s => match(s, b.dataset.filter)).length; });
    const apply = (f, animate = true) => {
      btns.forEach(b => { const on = b.dataset.filter === f; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
      let n = 0;
      items.forEach(s => {
        s.hidden = !match(s, f);
        if (!s.hidden && animate) $$(".reveal", s).forEach(el => { el.classList.remove("show"); el.style.setProperty("--d", `${Math.min(n++, 5) * 90}ms`); });
      });
      requestAnimationFrame(() => requestAnimationFrame(() => items.forEach(s => !s.hidden && $$(".reveal", s).forEach(el => el.classList.add("show")))));
    };
    filterBar.addEventListener("click", e => { const b = e.target.closest(".filter-btn"); if (b) apply(b.dataset.filter); });
    const unhide = () => { const t = document.getElementById(location.hash.slice(1)); if (t?.hidden || t?.closest("[hidden]")) apply("all", false); };
    addEventListener("hashchange", unhide);
    unhide();
  }

  /* 6. Ripple + click scale (span tạm, chỉ animate transform/opacity) */
  const rippleSel = ".btn,.nav-cta,.filter-btn,.lab-tab-btn,.chem-btn,#reset-chem,.hl-btn,.laser-toggle,.plickers-toggle";
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(rippleSel);
    if (!el || el.disabled || reduce) return;
    const r = el.getBoundingClientRect(), d = Math.hypot(r.width, r.height) * 2, dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.append(dot);
    dot.addEventListener("animationend", () => dot.remove(), { once: true });
  });

  /* 7. Scroll-spy: tô sáng mục nav theo section đang xem */
  const spy = { home: "", about: "about", goals: "about", cv: "cv", work: "work", products: "science", science: "science", contact: "contact" };
  const links = $$('.nav-links a[href^="#"]');
  if (links.length && "IntersectionObserver" in window) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.hash === `#${spy[e.target.id]}`));
    }), { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(spy).forEach(id => { const sec = document.getElementById(id); if (sec) so.observe(sec); });
  }
})();