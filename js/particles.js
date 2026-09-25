// ==== Partikel api ambient (canvas) ====
(function () {
  const canvas = document.getElementById("fireCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, embers = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function spawnEmber() {
    embers.push({
      x: Math.random() * w,
      y: h + 10,
      r: 1 + Math.random() * 3,
      speed: 0.4 + Math.random() * 1.4,
      drift: (Math.random() - 0.5) * 0.6,
      life: 1,
      hue: 8 + Math.random() * 30, // merah - oranye
      flicker: Math.random() * 0.05
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    if (embers.length < 90) spawnEmber();

    embers.forEach((e) => {
      e.y -= e.speed;
      e.x += e.drift + Math.sin(e.y * 0.02) * 0.3;
      e.life -= 0.0035;

      const alpha = Math.max(e.life, 0);
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
      grad.addColorStop(0, `hsla(${e.hue}, 90%, 60%, ${alpha})`);
      grad.addColorStop(1, `hsla(${e.hue}, 90%, 40%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${e.hue}, 100%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });

    embers = embers.filter((e) => e.life > 0 && e.y > -20);
    requestAnimationFrame(tick);
  }
  tick();

  // ==== Ledakan percikan api saat hover di tombol ====
  function burst(x, y) {
    for (let i = 0; i < 10; i++) {
      embers.push({
        x, y,
        r: 1 + Math.random() * 2.2,
        speed: 0.6 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 2.2,
        life: 0.6 + Math.random() * 0.4,
        hue: 10 + Math.random() * 35,
        flicker: 0
      });
    }
  }

  document.addEventListener("pointerover", (ev) => {
    const btn = ev.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  // Efek glow mengikuti posisi kursor pada tombol utama
  document.addEventListener("pointermove", (ev) => {
    const btn = ev.target.closest(".btn-primary");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--mx", `${((ev.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty("--my", `${((ev.clientY - rect.top) / rect.height) * 100}%`);
  });
})();
