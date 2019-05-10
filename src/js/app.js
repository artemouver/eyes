import Eye from './eye';

const canvas   = document.getElementById('eyes'),
  ctx          = canvas.getContext('2d'),
  canvasSizes  = {w: window.innerWidth, h: window.innerHeight};

canvas.width = canvasSizes.w;
canvas.height = canvasSizes.h;

const defaultSizes       = {x: 110, y: 50},
  minSpace               = 30,
  rightSizeAlongSomeAxis = {axis: 'x', size: 60},
  sizeKoef               = rightSizeAlongSomeAxis.size / defaultSizes[rightSizeAlongSomeAxis.axis],
  sizes                  = {x: defaultSizes.x * sizeKoef, y: defaultSizes.y * sizeKoef};

let mouse = {x: 0, y: 0};

let cols    = {n: Math.floor(canvasSizes.w / sizes.x) % 2 === 0 ? Math.floor(canvasSizes.w / sizes.x) : Math.floor(canvasSizes.w / sizes.x) - 1},
  rows      = {n: Math.floor(canvasSizes.h / sizes.y)};
rows.space = (canvasSizes.h - rows.n * sizes.y) / (rows.n + 1);

while (true)
  if (canvasSizes.w - cols.n * sizes.x - (cols.n / 2 + 1) * minSpace - (cols.n / 2) * (minSpace / 2) < 0)
    cols.n -= 2;
  else
    break;

cols.space = (4 * (canvasSizes.w - cols.n * sizes.x)) / (3 * cols.n + 4);
cols.shortSpace = cols.space / 2;

while (rows.space < minSpace)
  rows.space = (canvasSizes.h - --rows.n * sizes.y) / (rows.n + 1);

let eyes = [];
for (let i = 0; i < rows.n; i++)
  for (let j = 1; j < cols.n; j+=2) {
    const eye1 = new Eye(
        (cols.space + sizes.x * 2 + cols.shortSpace) * ((j - 1) / 2) + cols.space + sizes.x * 0.5,
        rows.space + sizes.y * 0.5 + (sizes.y + rows.space) * i,
        sizes.x,
        sizes.y,
        sizeKoef,
        'left',
        // canvasSizes.h / 2
        canvasSizes.w
      ),
      eye2 = new Eye(
        (cols.space + sizes.x * 2 + cols.shortSpace) * ((j - 1) / 2) + cols.space + cols.shortSpace + sizes.x * 1.5,
        rows.space + sizes.y * 0.5 + (sizes.y + rows.space) * i,
        sizes.x,
        sizes.y,
        sizeKoef,
        'right',
        // canvasSizes.h / 2
        canvasSizes.w
      );
    eye1.pair = eye2;
    eye2.pair = eye1;
    const centerEyes = {
      x: (eye1.offsetX + eye2.offsetX) / 2,
      y: eye1.offsetY
    };
    eye1.centerEyes = centerEyes;
    eye2.centerEyes = centerEyes;
    eyes.push(eye1, eye2);
  }

const randomCoef = Math.sqrt(eyes.length) / 950;

canvas.onmousemove = function(e) {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
};

draw();

function draw() {
  ctx.clearRect(0, 0, canvasSizes.w, canvasSizes.h);
  ctx.rect(0, 0, canvasSizes.w, canvasSizes.h);
  ctx.fill();
  if (Math.random() < randomCoef)
  	eyes[Math.floor(Math.random() * eyes.length)].wink();
  let hoveredEye = false;
  for (let index in eyes) {
    if (eyes[index].wowSettings.isHovered) {
      hoveredEye = eyes[index];
      break;
    }
  }
  for (let index in eyes) {
  	const eye = eyes[index];
    eye.frame(ctx, mouse, hoveredEye);
  }
  requestAnimationFrame(draw);
}
