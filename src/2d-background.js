const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray;

// get mouse position
let mouse = {
    x: null,
    y: null,
    radius: 150  // Detection radius for mouse interaction
}

window.addEventListener('mousemove',
    function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    }
);

// create particle
class Particle {
    constructor(x, y, directionX, directionY, size) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
    }

    // method to draw individual particle
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
    }

    // check particle position, check mouse position, move the particle, draw the particle
    update() {
        // check if particle is still within canvas
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // check collision detection - mouse position / particle position
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Draw connection line to mouse when close
        if (distance < mouse.radius && mouse.x != null && mouse.y != null) {
            // Calculate opacity based on distance (closer = more opaque)
            let opacity = 1 - (distance / mouse.radius);

            // Draw line from particle to mouse
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Optional: Add a gentle pull towards mouse (subtle attraction)
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = (mouse.radius - distance) / mouse.radius;
            let attractionStrength = force * 0.3; // Adjust this for stronger/weaker attraction

            this.x += forceDirectionX * attractionStrength;
            this.y += forceDirectionY * attractionStrength;
        }

        // move particle with slower speed
        this.x += this.directionX;
        this.y += this.directionY;

        // draw particle
        this.draw();
    }
}

// create particle array
function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1;  // Slightly smaller particles
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        // Slower movement speed (reduced from 5 to 1.5)
        let directionX = (Math.random() * 1.0) - 0.5;
        let directionY = (Math.random() * 1.0) - 0.5;

        particlesArray.push(new Particle(x, y, directionX, directionY, size));
    }
}

// animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

// check if particles are close enough to draw line between them
function connect() {
    const maxDistance = (canvas.width / 7) * (canvas.height / 7);

    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            const dx = particlesArray[a].x - particlesArray[b].x;
            const dy = particlesArray[a].y - particlesArray[b].y;
            const distance = (dx * dx) + (dy * dy);

            if (distance < maxDistance) {
                const opacityValue = 1 - (distance / 20000);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// resize event with debounce for performance
let resizeTimeout;
window.addEventListener('resize',
    function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            init();
        }, 250);
    }
)

// mouse out event
window.addEventListener('mouseout',
    function () {
        mouse.x = null;
        mouse.y = null;
    }
)

init();
animate();