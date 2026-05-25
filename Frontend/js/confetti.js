/* =============================================
   COLABO — confetti.js
   Lightweight HTML5 Canvas Confetti Engine
   ============================================= */

window.triggerConfetti = function () {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
    '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
    '#84cc16', '#eab308', '#f97316', '#ef4444'
  ];

  const particles = [];
  const particleCount = 150;

  class Confetti {
    constructor() {
      // Start from the bottom-left and bottom-right corners or center
      const fromLeft = Math.random() > 0.5;
      this.x = fromLeft ? 0 : width;
      this.y = height - 50;
      
      const angle = fromLeft 
        ? (-Math.PI / 4) - (Math.random() * Math.PI / 8) // angle pointing top-right
        : (-3 * Math.PI / 4) + (Math.random() * Math.PI / 8); // angle pointing top-left

      const speed = 15 + Math.random() * 15;
      
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      
      this.gravity = 0.45;
      this.friction = 0.98;
      
      this.size = 8 + Math.random() * 8;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = -0.1 + Math.random() * 0.2;
      
      this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
      this.opacity = 1;
    }

    update() {
      this.vx *= this.friction;
      this.vy += this.gravity;
      
      this.x += this.vx;
      this.y += this.vy;
      
      this.rotation += this.rotationSpeed;
      
      if (this.vy > 0) {
        this.opacity -= 0.015;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;

      if (this.shape === 'rect') {
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Create initial burst
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Confetti());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity > 0 && p.y < height + 50 && p.x > -50 && p.x < width + 50) {
        p.update();
        p.draw();
        activeParticles++;
      }
    }

    if (activeParticles > 0) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup
      canvas.remove();
    }
  }

  animate();
};
