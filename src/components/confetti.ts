// Tiny dependency-free confetti burst. Draws to a transient full-screen
// canvas and cleans itself up — avoids pulling in a third-party package.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: string;
  size: number;
  life: number;
}

const COLORS = ["#6aba48", "#ffc02a", "#f1e8d6", "#e5484d", "#5e324e"];

export function burstConfetti(originX: number, originY: number) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const particles: Particle[] = Array.from({ length: 60 }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -10 - 4,
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 4,
    life: 1,
  }));

  let frame = 0;
  function tick() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    let alive = false;
    for (const p of particles) {
      p.vy += 0.35; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.life -= 0.012;
      if (p.life > 0) {
        alive = true;
        ctx!.save();
        ctx!.globalAlpha = Math.max(p.life, 0);
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx!.restore();
      }
    }
    if (alive && frame < 240) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}
