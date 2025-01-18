const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const bigCircleRadius = 150;
const smallCirclesCount = 10; // Reduced count for clarity
const smallCircleMinRadius = 50;
const smallCircleMaxRadius = 70;
const orbitRadius = bigCircleRadius + 150;
const smallCircles = [];
let centerCircleIndex = 0;
const centerCircle = { x: centerX, y: centerY, radius: bigCircleRadius };

let pulseDirection = 0.5; // 1 for growing, -1 for shrinking
const pulseSpeed = 0.5; // Speed of radius change per frame
const pulseInterval = 10; // Frames between complete pulse (1 beat every 3 seconds at 60 FPS)
let pulseFrameCounter = 0;
let swapInProgress = false;


// animation
let isAnimating = false;
let animationFrame = 0;
const animationDuration = 30; // Duration of the animation in frames

let animationData = {
    startX: 0,
    startY: 0,
    startRadius: 0,
    startOriginalRadius: 0,
    endX: 0,
    endY: 0,
    endRadius: 0,
    endOriginalRadius: 0,
    targetIndex: 0,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function isOverlapping(newCircle) {
    for (const circle of smallCircles) {
        const dx = circle.x - newCircle.x;
        const dy = circle.y - newCircle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle.radius + newCircle.radius) {
            return true;
        }
    }
    return false;
}

function drawSmallCircle(circle, index) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    if(index === 0) {
        ctx.fillStyle = `rgba(100, 150, 255, 0.5)`;
    } else {
        ctx.fillStyle = `rgba(255, 100, ${index * 30}, 0.7)`;
    }
    ctx.fill();
    ctx.closePath();
}

function generateSmallCircles() {
    for (let i = 0; i < smallCirclesCount + 1; i++) {
        if(i === 0) {
            smallCircles.push({ x: centerX, y: centerY, radius: bigCircleRadius, originalRadius: bigCircleRadius });
            console.log("hit?")
        } else {
            let radius, x, y;
            let attempts = 0;
            do {
                const angle = (i / smallCirclesCount) * Math.PI * 2;
                radius = getRandom(smallCircleMinRadius, smallCircleMaxRadius);
                x = centerX + Math.cos(angle) * orbitRadius;
                y = centerY + Math.sin(angle) * orbitRadius;
                attempts++;
    
                if (attempts > 100) break;
            } while (isOverlapping({ x, y, radius }));
    
            if (attempts <= 100) {
                smallCircles.push({ x, y, radius, originalRadius: radius });
            }
        }    
    }
}



function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const [index, circle] of smallCircles.entries()) {
        drawSmallCircle(circle, index);
    }
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function animateSwap() {
    if (!isAnimating) return;

    const t = animationFrame / animationDuration;
    const circle = smallCircles[animationData.targetIndex];
    const centerAtCircle = smallCircles[centerCircleIndex];

    // Interpolate positions
    centerAtCircle.x = lerp(animationData.startX, animationData.endX, t);
    centerAtCircle.y = lerp(animationData.startY, animationData.endY, t);
    circle.x = lerp(animationData.endX, animationData.startX, t);
    circle.y = lerp(animationData.endY, animationData.startY, t);

    // Interpolate radii
    centerAtCircle.radius = lerp(animationData.startRadius, animationData.endRadius, t);
    centerAtCircle.originalRadius = lerp(animationData.startOriginalRadius, animationData.endOriginalRadius, t);
    circle.originalRadius = lerp(animationData.endOriginalRadius, animationData.startOriginalRadius, t);


    animationFrame++;

    if (animationFrame > animationDuration) {
        // End the animation
        isAnimating = false;
        centerCircleIndex = animationData.targetIndex;
    }
}

function swapWithCenterCircle(clickedIndex) {
    if (centerCircleIndex === clickedIndex || isAnimating) return;

    // Set up animation data
    const centerAtCircle = smallCircles[centerCircleIndex];
    const clickedCircle = smallCircles[clickedIndex];

    animationData = {
        startX: centerAtCircle.x,
        startY: centerAtCircle.y,
        startRadius: centerAtCircle.radius,
        startOriginalRadius: centerAtCircle.originalRadius,
        endX: clickedCircle.x,
        endY: clickedCircle.y,
        endRadius: clickedCircle.radius,
        endOriginalRadius: clickedCircle.originalRadius,
        targetIndex: clickedIndex,
    };

    isAnimating = true;
    animationFrame = 0;

    swapInProgress = false
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = smallCircles.length - 1; i >= 0; i--) {
        const circle = smallCircles[i];
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= circle.radius) {
            swapInProgress = true
            swapWithCenterCircle(i);
            break;
        }
    };
});

function updatePulse() {
    if(!swapInProgress) {
        if (pulseFrameCounter === 0) {
            for (const [index, circle] of smallCircles.entries()) {
                if(index === centerCircleIndex) continue;
                circle.radius += pulseDirection * pulseSpeed; // Use pulseSpeed for flexibility
                if (circle.radius > circle.originalRadius + 3) {
                    circle.radius = circle.originalRadius + 3;
                    pulseDirection = -1;
                } else if (circle.radius < circle.originalRadius - 3) {
                    circle.radius = circle.originalRadius - 3;
                    pulseDirection = 1;
                }
            }
        }
        pulseFrameCounter = (pulseFrameCounter + 1) % pulseInterval;
    }   
}

generateSmallCircles();
draw();

function animate() {
    updatePulse();
    draw();
    animateSwap();
    requestAnimationFrame(animate);
}
animate();