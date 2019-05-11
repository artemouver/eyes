import Eye from './eye';
import * as dat from 'dat.gui';

/*const canvas   = document.getElementById('eyes'),
  ctx          = canvas.getContext('2d'),
  canvasSizes  = {w: window.innerWidth, h: window.innerHeight};

canvas.width = canvasSizes.w;
canvas.height = canvasSizes.h;

const defaultSizes       = {x: 110, y: 50},
  minSpace               = 50,
  rightSizeAlongSomeAxis = {axis: 'x', size: 110},
  sizeKoef               = rightSizeAlongSomeAxis.size / defaultSizes[rightSizeAlongSomeAxis.axis],
  sizes                  = {x: defaultSizes.x * sizeKoef, y: defaultSizes.y * sizeKoef};*/

let Eyes = function() {
  const canvas = document.getElementById('eyes'),
    ctx = canvas.getContext('2d'),
    canvasSizes = {w: window.innerWidth, h: window.innerHeight};

  canvas.width = canvasSizes.w;
  canvas.height = canvasSizes.h;

  const defaultSizes = {x: 110, y: 50};
  this.space = 0.6;
  this.sizeKoef = 1;
  this.blinkRate = 1;
  let randomCoef = 0;
  this.eyeSection = 0.55;
  this.pupilDeviation = 0.7;
  this.timeOfWink = 1;
  this.wowColor = [255, 0, 0];

  const self = this;
  this.buildScene = function() {
    const sizes = {x: defaultSizes.x * self.sizeKoef, y: defaultSizes.y * self.sizeKoef},
      space = self.space * sizes.y,
      cols = {n: Math.floor(canvasSizes.w / sizes.x) % 2 === 0 ? Math.floor(canvasSizes.w / sizes.x) : Math.floor(canvasSizes.w / sizes.x) - 1},
      rows = {n: Math.floor(canvasSizes.h / sizes.y)};
    rows.space = (canvasSizes.h - rows.n * sizes.y) / (rows.n + 1);
    while (true)
      if (canvasSizes.w - cols.n * sizes.x - (cols.n / 2 + 1) * space - (cols.n / 2) * (space / 2) < 0)
        cols.n -= 2;
      else
        break;
    cols.space = (4 * (canvasSizes.w - cols.n * sizes.x)) / (3 * cols.n + 4);
    cols.shortSpace = cols.space / 2;
    while (rows.space < space)
      rows.space = (canvasSizes.h - --rows.n * sizes.y) / (rows.n + 1);

    self.eyes = [];
    for (let i = 0; i < rows.n; i++)
      for (let j = 1; j < cols.n; j+=2) {
        const eye1 = new Eye(
            (cols.space + sizes.x * 2 + cols.shortSpace) * ((j - 1) / 2) + cols.space + sizes.x * 0.5,
            rows.space + sizes.y * 0.5 + (sizes.y + rows.space) * i,
            sizes.x,
            sizes.y,
            self.sizeKoef,
            'left',
            // canvasSizes.h / 2
            canvasSizes.w,
            self.eyeSection,
            self.pupilDeviation,
            self.timeOfWink,
            self.wowColor
          ),
          eye2 = new Eye(
            (cols.space + sizes.x * 2 + cols.shortSpace) * ((j - 1) / 2) + cols.space + cols.shortSpace + sizes.x * 1.5,
            rows.space + sizes.y * 0.5 + (sizes.y + rows.space) * i,
            sizes.x,
            sizes.y,
            self.sizeKoef,
            'right',
            // canvasSizes.h / 2
            canvasSizes.w,
            self.eyeSection,
            self.pupilDeviation,
            self.timeOfWink,
            self.wowColor
          );
        eye1.pair = eye2;
        eye2.pair = eye1;
        const centerEyes = {
          x: (eye1.offsetX + eye2.offsetX) / 2,
          y: eye1.offsetY
        };
        eye1.centerEyes = centerEyes;
        eye2.centerEyes = centerEyes;
        self.eyes.push(eye1, eye2);
      }
    randomCoef = Math.sqrt(self.eyes.length) / 950;
  };

  this.buildScene();

  this.mouse = {x: 0, y: 0};
  canvas.onmousemove = function(e) {
    self.mouse.x = e.offsetX;
    self.mouse.y = e.offsetY;
  };

  this.draw = function() {
    ctx.clearRect(0, 0, canvasSizes.w, canvasSizes.h);
    ctx.rect(0, 0, canvasSizes.w, canvasSizes.h);
    ctx.fill();
    if (Math.random() < randomCoef * self.blinkRate)
      self.eyes[Math.floor(Math.random() * self.eyes.length)].wink();
    let hoveredEye = false;
    for (let index in self.eyes) {
      if (self.eyes[index].wowSettings.isHovered) {
        hoveredEye = self.eyes[index];
        break;
      }
    }
    for (let index in self.eyes) {
      const eye = self.eyes[index];
      eye.frame(ctx, self.mouse, hoveredEye);
    }
    requestAnimationFrame(self.draw);
  };
  this.draw();

  this.changeParam = function(value) {
    self[this.property] = value;
    for (let index in self.eyes) {
      self.eyes[index].setParam(this.property, value);
    }
  };
};
let eyes = new Eyes();
const gui = new dat.GUI();
let controllers = {};
controllers.sizeKoef = gui.add(eyes, 'sizeKoef', 0.2, 5);
controllers.sizeKoef.onChange(eyes.buildScene);
controllers.space = gui.add(eyes, 'space', 0.3, 2);
controllers.space.onChange(eyes.buildScene);
controllers.blinkRate = gui.add(eyes, 'blinkRate', 0, 20);

controllers.eyeSection = gui.add(eyes, 'eyeSection', 0.2, 1);
controllers.eyeSection.onChange(eyes.changeParam);
controllers.pupilDeviation = gui.add(eyes, 'pupilDeviation', 0.1, 0.7);
controllers.pupilDeviation.onChange(eyes.changeParam);
controllers.timeOfWink = gui.add(eyes, 'timeOfWink', 0.1, 10);
controllers.timeOfWink.onChange(eyes.changeParam);
controllers.wowColor = gui.addColor(eyes, 'wowColor');
controllers.wowColor.onChange(eyes.changeParam);
/*let mouse = {x: 0, y: 0};

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

const randomCoef = Math.sqrt(eyes.length) / 950;*/

/*canvas.onmousemove = function(e) {
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
}*/
