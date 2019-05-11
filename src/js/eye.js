export default class Eye {
  constructor(offsetX, offsetY, sizeX, sizeY, sizeKoef, side, radiusOfSight, eyeSection, pupilDeviation, timeOfWink, wowColor) {
    // const lineWidth = 3,
    //   pupilRadius = 3.5;

    this.lastFrame = new Date().getTime();
    this.passed = 0;

    this.offsetX = offsetX || 0; // сдвиг центра глаза по оси X
    this.offsetY = offsetY || 0; // сдвиг центра глаза по оси Y
    this.sizeX = sizeX || 110; // размер глаза по длине
    this.sizeY = sizeY || 50; // размер глаза по высоте
    this.sizeKoef = sizeKoef || 1.0; // коеффициент размера. 1.0 соответствует 110х50
    this.side = side || 'left';
    this.radiusOfSight = radiusOfSight || 300;

    this.eyeSection = eyeSection; // форма выреза глаза. 0.55 - нормальное значение
    this.pupilOffsetX = 0; // сдвиг радужки и зрачка по оси X относительно центра глаза
    this.pupilOffsetY = 0; // сдвиг радужки и зрачка по оси Y относительно центра глаза

    this.checkpointDeviation = this.sizeX * 0.5 * this.eyeSection; // контрольные точки для отрисовки глаза с помощью кривой
    this.localCenterX = this.sizeX * 0.5; // половина длины глаза
    this.localCenterY = this.sizeY * 0.5; // половина высоты глаза
    this.offsetToCenterX = this.offsetX - this.localCenterX; // реальный сдвиг глаза по оси X (от левого верхнего угла)
    this.offsetToCenterY = this.offsetY - this.localCenterY; // реальный сдвиг глаза по оси Y (от левого верхнего угла)

    this.pupilDeviation = pupilDeviation; //0.0..1.0. Отвечает за удалённость зрачка от центра
    this.ellipsW = this.sizeX * 0.5 * pupilDeviation; //половина длины овала, который отвечает за путь, по которому движется зрачок
    this.ellipsH = this.sizeY * 0.5 * pupilDeviation; //половина высоты овала, который отвечает за путь, по которому движется зрачок

    this.winkSettings = {
      openingEye: 1.0, // 0.0 - глаз закрыт, 1.0 - глаз открыт
      loweringUpperEyelid: 0, // на сколько опущено верхнее веко или иначе насколько закрыт глаз (в пикселях)
      step: 0, // шаг выполнения моргания (0 - не моргает, 1 - веко опускается, 2 - веко поднимается)
      time: timeOfWink / 2 // время одного шага моргания (время опускания века или поднятия)
    };
    this.winkSettings.speed = this.winkSettings.openingEye / this.winkSettings.time; // скорость одного шага моргания

    this.timeChangeColor = 0.5;
    this.wowSettings = {
      isHovered: false,
      step: 0,
      speed: {x: null, y: null, color: [null, null, null]},
      color: [0, 0, 0],
      fromColor: [0, 0, 0],
      toColor: wowColor
    };

    this.returning = false;
    


    this.pupilSpeed = {x: 0, y: 0};
  }

  frame(ctx, mouse, hoveredEye) {
    const now = new Date().getTime();
    this.passed = now - this.lastFrame;
    this.lastFrame = now;
    this.think(mouse, hoveredEye);
    this.draw(ctx);
  }

  think(mouse, hoveredEye) {

    const insideEyes = mouse.x >= this.offsetToCenterX &&
      mouse.x <= this.pair.offsetToCenterX + this.pair.sizeX &&
      mouse.y >= this.offsetToCenterY &&
      mouse.y <= this.offsetToCenterY + this.sizeY;

    if (!this.wowSettings.isHovered && this.side === 'left' && insideEyes) {
      this.wow();
      this.pair.wow();
    } else if (this.wowSettings.isHovered && this.side === 'left' && !insideEyes) {
      this.unwow();
      this.pair.unwow();
    }

    if (
      hoveredEye &&
      Math.sqrt(Math.pow(this.centerEyes.x - hoveredEye.centerEyes.x, 2) + Math.pow(this.centerEyes.y - hoveredEye.centerEyes.y, 2)) > this.radiusOfSight ||
      !hoveredEye &&
      Math.sqrt(Math.pow(this.centerEyes.x - mouse.x, 2) + Math.pow(this.centerEyes.y - mouse.y, 2)) > this.radiusOfSight
    ) {
      if (this.wowSettings.step !== 0)
        this.wowing(mouse);
      this.pupilSpeed.x = -this.pupilOffsetX * 3;
      this.pupilSpeed.y = -this.pupilOffsetY * 3;
    } else {
      if (!hoveredEye) {
        if (this.wowSettings.step !== 0)
          this.wowing(mouse);
        else {
          if (this.returning) {
            this.pupilMoving(
              mouse,
              40,
              (function() {this.returning = false;}).bind(this)
            );
          } else {
            this.pupilSpeed.x = 0;
            this.pupilSpeed.y = 0;
            const coefA = (this.offsetY - mouse.y) / (mouse.x - this.offsetX),
              direction = {x: mouse.x >= this.offsetX ? 1 : -1, y: mouse.y >= this.offsetY ? 1 : -1};
            this.pupilOffsetX = direction.x * (this.ellipsW * this.ellipsH) / Math.sqrt(this.ellipsH * this.ellipsH + coefA * coefA * this.ellipsW * this.ellipsW);
            this.pupilOffsetY = direction.y * Math.sqrt((this.ellipsH * this.ellipsH) * (this.ellipsW * this.ellipsW - this.pupilOffsetX * this.pupilOffsetX)) / this.ellipsW;
          }
        }
      } else {
        if (this.wowSettings.isHovered) {
          this.wowing(mouse);
        } else {
          if (this.wowSettings.step !== 0)
            this.wowing(mouse);
          else {
            this.pupilMoving(
              this.side === 'left' ? {x: hoveredEye.offsetX, y: hoveredEye.offsetY} : {x: hoveredEye.pair.offsetX, y: hoveredEye.pair.offsetY},
              100,
              (function() {this.pupilSpeed = {x: 0, y: 0}; this.returning = true;}).bind(this)
            );
          }
        }
      }
    }

    if (this.winkSettings.step > 0) {
      if (this.wowSettings.step > 0)
        this.winkSettings.step = 2;
      this.winking();
    }


    this.pupilOffsetX += this.pupilSpeed.x * this.passed / 1000;
    this.pupilOffsetY += this.pupilSpeed.y * this.passed / 1000;
  }

  pupilMoving(endPoint, speedCoef, finishFunction) {
    const coefA = (this.offsetY - endPoint.y) / (endPoint.x - this.offsetX),
      direction = {x: endPoint.x >= this.offsetX ? 1 : -1, y: endPoint.y >= this.offsetY ? 1 : -1};
    let vector = {};
    vector.x = direction.x * (this.ellipsW * this.ellipsH) / Math.sqrt(this.ellipsH * this.ellipsH + coefA * coefA * this.ellipsW * this.ellipsW) - this.pupilOffsetX;
    let wMinusX = this.ellipsW * this.ellipsW - this.pupilOffsetX * this.pupilOffsetX;
    vector.y = direction.y * Math.sqrt((this.ellipsH * this.ellipsH) * (wMinusX < 0 ? 0 : wMinusX)) / this.ellipsW - this.pupilOffsetY;
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x = isNaN(vector.x /= length) ? 0 : vector.x;
    vector.y = isNaN(vector.y /= length) ? 0 : vector.y;
    const speed = {x: vector.x * this.sizeKoef * speedCoef, y: vector.y * this.sizeKoef * speedCoef};
    this.pupilSpeed = speed;
    if (finishFunction && Math.abs(this.pupilOffsetX - direction.x * (this.ellipsW * this.ellipsH) / Math.sqrt(this.ellipsH * this.ellipsH + coefA * coefA * this.ellipsW * this.ellipsW)) <= Math.abs(speed.x * this.passed / 1000) && Math.abs(this.pupilOffsetY - direction.y * Math.sqrt((this.ellipsH * this.ellipsH) * (this.ellipsW * this.ellipsW - this.pupilOffsetX * this.pupilOffsetX)) / this.ellipsW) <= Math.abs(speed.y * this.passed / 1000))
      finishFunction();
  }

  draw(ctx) {
    ctx.save();

    this.drawEyePath(ctx);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // iris eyes
    ctx.beginPath();
    ctx.arc(this.offsetX + this.pupilOffsetX, this.offsetY + this.pupilOffsetY, this.sizeY * 0.43, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = `rgba(${Math.floor(this.wowSettings.color[0])}, ${Math.floor(this.wowSettings.color[1])}, ${Math.floor(this.wowSettings.color[2])}, 1)`;
    ctx.fill();

    ctx.restore();
  }

  wink() {
    this.winkSettings.step = this.pair.winkSettings.step = 1;
  }

  calcOffset(speed) {
    return speed * this.passed / 1000;
  }

  winking() {
    if (this.winkSettings.step === 1) this.winkSettings.openingEye -= this.calcOffset(this.winkSettings.speed);
    else this.winkSettings.openingEye += this.calcOffset(this.winkSettings.speed);

    if (this.winkSettings.openingEye <= 0.0) {
      this.winkSettings.openingEye = 0.0;
      this.winkSettings.step = 2;
    } else if (this.winkSettings.openingEye >= 1.0) {
      this.winkSettings.openingEye = 1.0;
      this.winkSettings.step = 0;
    }
    this.winkSettings.loweringUpperEyelid = this.sizeY * (1 - this.winkSettings.openingEye);
  }

  wow() {
    this.wowSettings.isHovered = true;
    if (this.wowSettings.step === 0 || this.wowSettings.step === 5)
      this.wowSettings.step = 1;
    if (this.wowSettings.step === 4)
      this.wowSettings.step = 2;
    this.pupilSpeed.x = -this.pupilOffsetX * 3;
    this.pupilSpeed.y = -this.pupilOffsetY * 3;
  }

  wowing(mouse) {
    let isFilled = true;
    switch (this.wowSettings.step) {
      case 1:
        let nowOffsets = {x: this.pupilSpeed.x * this.passed / 1000, y: this.pupilSpeed.y * this.passed / 1000};
        if (Math.abs(this.pupilOffsetX - nowOffsets.x) <= Math.abs(nowOffsets.x)) {
          this.pupilSpeed.x = 0;
          this.pupilSpeed.y = 0;
          for (let i = 0; i < 3; i++)
            this.wowSettings.speed.color[i] = (this.wowSettings.toColor[i] - this.wowSettings.fromColor[i]) / this.timeChangeColor;
          this.wowSettings.step = 2;
        }
        break;
      case 2:
        for (let i = 0; i < 3; i++) {
          this.wowSettings.color[i] += this.wowSettings.speed.color[i] * this.passed / 1000;
          if (this.wowSettings.speed.color[i] >= 0 && this.wowSettings.color[i] >= this.wowSettings.toColor[i] || this.wowSettings.speed.color[i] < 0 && this.wowSettings.color[i] <= this.wowSettings.toColor[i])
            this.wowSettings.color[i] = this.wowSettings.toColor[i];
          else
            isFilled = false;
        }
        if (isFilled)
          this.wowSettings.step = 3;
        break;
      case 3:
        break;
      case 4:
        for (let i = 0; i < 3; i++) {
          this.wowSettings.color[i] += this.wowSettings.speed.color[i] * this.passed / 1000;
          if (this.wowSettings.speed.color[i] >= 0 && this.wowSettings.color[i] >= this.wowSettings.fromColor[i] || this.wowSettings.speed.color[i] < 0 && this.wowSettings.color[i] <= this.wowSettings.fromColor[i])
            this.wowSettings.color[i] = this.wowSettings.fromColor[i];
          else
            isFilled = false;
        }
        if (isFilled)
          this.wowSettings.step = 5;
        break;
      case 5:
        let vector = {x: mouse.x - (this.offsetX + this.pupilOffsetX), y: mouse.y - (this.offsetY + this.pupilOffsetY)};
        let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        vector.x /= length;
        vector.y /= length;
        const speed = {x: vector.x * this.sizeKoef * 100, y: vector.y * this.sizeKoef * 100};
        this.pupilSpeed = speed;
        nowOffsets = {
          x: this.pupilOffsetX + this.pupilSpeed.x * this.passed / 1000,
          y: this.pupilOffsetY + this.pupilSpeed.y * this.passed / 1000
        };
        if (Math.pow(nowOffsets.x / this.ellipsW, 2) + Math.pow(nowOffsets.y / this.ellipsH, 2) >= 1) {
          this.wowSettings.step = 0;
          this.pupilSpeed = {x: 0, y: 0};
        }
        break;
    }
  }

  unwow() {
    this.wowSettings.isHovered = false;
    this.pupilSpeed = {x: 0, y: 0};
    if (this.wowSettings.step === 3 || this.wowSettings.step === 2) {
      for (let i = 0; i < 3; i++)
        this.wowSettings.speed.color[i] = (this.wowSettings.fromColor[i] - this.wowSettings.toColor[i]) / this.timeChangeColor;
      this.wowSettings.step = 4;
    }
    if (this.wowSettings.step === 1)
      this.wowSettings.step = 5;
  }

  drawEyePath(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.offsetToCenterX, this.offsetToCenterY + this.localCenterY);
    ctx.quadraticCurveTo(
      this.offsetToCenterX + this.localCenterX - this.checkpointDeviation,
      this.offsetToCenterY + this.winkSettings.loweringUpperEyelid,
      this.offsetToCenterX + this.localCenterX,
      this.offsetToCenterY + this.winkSettings.loweringUpperEyelid
    );
    ctx.quadraticCurveTo(
      this.offsetToCenterX + this.localCenterX + this.checkpointDeviation,
      this.offsetToCenterY + this.winkSettings.loweringUpperEyelid,
      this.offsetToCenterX + this.sizeX,
      this.offsetToCenterY + this.localCenterY
    );
    ctx.quadraticCurveTo(
      this.offsetToCenterX + this.localCenterX + this.checkpointDeviation,
      this.offsetToCenterY + this.sizeY,
      this.offsetToCenterX + this.localCenterX,
      this.offsetToCenterY + this.sizeY
    );
    ctx.quadraticCurveTo(
      this.offsetToCenterX + this.localCenterX - this.checkpointDeviation,
      this.offsetToCenterY + this.sizeY,
      this.offsetToCenterX,
      this.offsetToCenterY + this.localCenterY
    );
    ctx.closePath();
  }

  setParam(param, value) {
    switch (param) {
      case 'eyeSection':
        this.eyeSection = value;
        this.checkpointDeviation = this.sizeX * 0.5 * value;
        break;
      case 'pupilDeviation':
        this.pupilDeviation = value;
        this.ellipsW = this.sizeX * 0.5 * value;
        this.ellipsH = this.sizeY * 0.5 * value;
        break;
      case 'timeOfWink':
        this.winkSettings.time = value / 2;
        this.winkSettings.speed = this.winkSettings.openingEye / this.winkSettings.time;
        break;
      case 'wowColor':
        this.wowSettings.toColor = value;
        break;
    }
  }
}
