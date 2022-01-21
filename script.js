'use strict';

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
var isDebug = window.location.port ? true : false;

function GetTrueSize(s) {
    return s / 9.461e+12;
}

function GetLogSize(s) {
    return Math.log2(5 + (s * 4.5 / 696340)) / 30;
}

var sizeFunction = GetLogSize;

var canavas;
var cam;

var planets = [];
var scaling = 1;

function updateCanvas() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    scaling = Math.min(width, height) / (maxDist * 2);
}

window.onresize = function () {
    logData.resize = { iw: window.innerWidth, ih: window.innerHeight };
    updateCanvas();
};

var isPortrait = window.orientation % 180;

function Sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function orientationChanged() {
    const timeout = 1000;
    return new window.Promise(function (resolve) {
        let height0 = window.innerHeight;
        let i = 0;
        do {
            if (window.innerHeight != height0)
                return resolve();
            else {
                Sleep(10);
                i += 10;
            }
        } while (i <= timeout);
    });
}

window.onorientationchange = function () {
    logData.orientation++;
    //alert(window.orientation);
    orientationChanged().then(function () {
        isPortrait = window.orientation % 180;
        updateCanvas();
    });
};

var font;
var maxDist;

function ExtendPlanet(planet, sizeInKm, color) {

    planet.GetSize = () => sizeFunction(sizeInKm / 2);
    planet.color = color;
    planet.render = () => {
        lightFalloff(1, 0, 0);
        ambientMaterial(planet.color);
        ambientLight(planet.color.h, 50, 5);

        sphere(planet.GetSize());
    };

    return planet;
}

function setup() {
    colorMode(HSL, 360, 100, 100);
    angleMode(DEGREES);

    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    cam = createCamera();

    cam.lookAt(0, 0, 0);
    cam.setPosition(0, 250, 0);
    cam.tilt(-90);

    loadFont('The_Bellovia_Sans.ttf', f => font = f);

    planets.push(ExtendPlanet(Astronomy.Sun, 696340, color('white')));
    planets.push(ExtendPlanet(Astronomy.Earth, 6371, color(208, 100, 81)));
    planets.push(ExtendPlanet(Astronomy.Mercury, 2439.7, color(25, 84, 81)));
    planets.push(ExtendPlanet(Astronomy.Venus, 6051.8, color(0, 100, 91)));
    planets.push(ExtendPlanet(Astronomy.Moon, 1737.4, color(200, 100, 99)));
    planets.push(ExtendPlanet(Astronomy.Mars, 3389.5, color(10, 96, 65)));
    planets.push(ExtendPlanet(Astronomy.Jupiter, 69911, color(35, 100, 80)));
    planets.push(ExtendPlanet(Astronomy.Saturn, 58232, color(59, 100, 75)));
    planets.push(ExtendPlanet(Astronomy.Uranus, 25362, color(216, 100, 81)));
    planets.push(ExtendPlanet(Astronomy.Neptune, 24622, color(230, 70, 70)));
    planets.push(ExtendPlanet(Astronomy.Pluto, 1188.3, color(213, 100, 96)));

    Astronomy.Sun.render = function () {
        emissiveMaterial(38, 100, 65);
        sphere(this.GetSize());
    };

    var day = Astronomy.DayValue(new Date());
    maxDist = Math.max(...planets.map(p => p.DistanceFromSun(day)));

    scaling = Math.min(width, height) / (maxDist * 2);

    var mc = new Hammer.Manager(document.body);

    var pinch = new Hammer.Pinch();
    var rotate = new Hammer.Rotate();

    pinch.recognizeWith(rotate);

    mc.add([pinch, rotate]);

    mc.on('pinchstart', e => {
        pf2 = pf;
    });

    mc.on('rotatestart', e => {
        rot = e.rotation;
    });

    mc.on("pinchin pinchout", e => {
        pf = Math.min(Math.max(1, e.scale * pf2), 50);
        logData.e = e;
        zoom(e.pointers[0].x,e.pointers[0].y, pf2*pf);
    });
    mc.on("rotatemove", e => {
        var angDist = rot - e.rotation;
        angDist += (angDist > 180) ? -360 : (angDist < -180) ? 360 : 0
        date = date.addSeconds(angDist * 24 * 60 * 60);
        rot = e.rotation;
    });

}

var logData = { dir: dir };

var rot = 0;
var date = new Date();

var pf = 5;
var pf2 = 1;

var fov = 180;
var dir = 0;

function draw() {
    height = canvas.elt.clientHeight;
    width = canvas.elt.clientWidth;

    cam.ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 500);

    background(0);
    smooth();
    rotateX(90);

    push();
    drawPlanets();
    pop();

    push();
    translate(0, 0, 0);
    drawUi();
    pop();

    function drawPlanets() {
        //date = new Date().addDays(frameCount).addHours(frameCount / 60 * 24);
        var day = Astronomy.DayValue(date);

        scale(scaling * pf);

        noStroke();

        var sunPos = renderPlanet(Astronomy.Sun, day);
        var earthPos = renderPlanet(Astronomy.Earth, day, sunPos);
        renderFromEarth(Astronomy.Sun, sunPos, earthPos);
        for (var planet of planets.slice(2)) {
            var pos = renderPlanet(planet, day, sunPos);
            renderFromEarth(planet, pos, earthPos);
        }

        drawFov(earthPos);
    }
}

function renderPlanet(planet, day, sunPos) {
    push();

    var position = planet.EclipticVector(day);

    if (sunPos) {
        var ligthDir = p5.Vector.sub(position, sunPos);
        directionalLight(255, 255, 255, ligthDir.x, ligthDir.z, -ligthDir.y);
    }
    translate(position.x, -position.y, position.z);
    planet.render()
    noLights();

    pop();
    return position;
}

function renderFromEarth(planet, pos, earthPos) {
    push();

    var ligthDir = p5.Vector.sub(pos, earthPos);
    directionalLight(255, 255, 255, ligthDir.x, ligthDir.z, -ligthDir.y);

    translate(pos.x, -pos.y, pos.z);
    //planet.render();
    noLights();

    pop();
}

function drawFov(earthPos) {
    push();
    translate(earthPos.x, -earthPos.y, earthPos.z + 0.1);

    strokeWeight(2);

    var fovDir = new p5.Vector(0, 1, 0).mult(maxDist);

    var for2 = fov / 2;
    fovDir = fovDir.rotateAround(new p5.Vector(0, 0, -1), for2 + dir);

    var stepCnt = 10;
    var step = for2 / stepCnt;
    var raystrength = 20;
    for (var i = 0; i <= stepCnt; i++) {
        var c = (1 - (i / stepCnt)) * 0.6 + 0.4;
        stroke(c * c * raystrength);
        line(0, 0, 0, fovDir.x, fovDir.y, fovDir.z);
        fovDir = fovDir.rotateAround(new p5.Vector(0, 0, 1), step);
    }
    for (var i = 0; i < stepCnt; i++) {
        var c = (i / stepCnt) * 0.6 + 0.4;
        stroke(c * c * raystrength);
        line(0, 0, 0, fovDir.x, fovDir.y, fovDir.z);
        fovDir = fovDir.rotateAround(new p5.Vector(0, 0, 1), step);
    }

    pop();
}

function drawUi() {
    drawFrame();

    if (font) {
        push();
        textFont(font);
        fill(255, 100, 100);

        push();
        logData.top = -height / 2 + 20;
        translate(-width / 2, -height / 2 + 2);
        var partWidth = width / 6;

        textSize(partWidth / 2);
        textAlign(CENTER, TOP);

        text(date.getFullYear(), 0, 0, partWidth * 2, height);
        translate(partWidth * 2, 0);
        text('.', 0, 0);
        text((date.getMonth() + 1), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text('.', 0, 0);
        text(date.getDate(), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text(date.getHours(), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text(':', 0, 0);
        text(date.getMinutes(), 0, 0, partWidth, height);

        pop();

        textSize(12);
        if (isDebug)
            text(JSON.stringify(logData, null, '\t'), -width / 2, -height / 2 + 40, width, height - 40);
        pop();
    }
}

// var mX;
// var mY;

// function touchMoved() {
//     if (mX !== undefined) {
//         cam.pan((mX - mouseX) / 1000);
//         cam.tilt((mouseY - mY) / 1000);

//         console.log(cam);
//     }
//     mX = mouseX;
//     mY = mouseY;
// }

// function touchEnded() {
//     mX = undefined;
//     mY = undefined;
// }

window.addEventListener('wheel', function (event) {
    event.preventDefault();
}, { passive: false });

function drawFrame() {
    push();
    stroke('red');
    strokeWeight(2);
    noFill();
    translate(-width / 2, -height / 2);
    rect(1, 1, width - 2, height - 2);
    stroke('green');
    translate(-width / 2, -height / 2);
    rect(1, 1, width * 2 - 2, height * 2 - 2);
    pop();
}

function mouseWheel(event) {

    //    pf = Math.min(Math.max(1, pf * (1 + event.delta / 10000)), 50);
    zoom(mouseX, mouseY, event.delta / 100);


    //    date = date.addDays(Math.sign(event.delta) * 0.5);
}

var crtlPressed = false;

function keyPressed() {
    if (keyCode === CONTROL)
        crtlPressed = true;
    print(keyCode);
}

function keyReleased() {
    if (keyCode === CONTROL)
        crtlPressed = false;
    print(keyCode);
}


function zoom(x, y, delta) {
    getZoom(x, y)(delta);
};

function getZoom(x, y) {
    print(y);
    if (y < 50) {
        var partWidth = width / 6;
        switch (Math.floor(~~(x / partWidth))) {
            case 0:
            case 1: return zoomYear;
            case 2: return zoomMonth;
            case 3: return zoomDay;
            case 4: return zoomHour;
            case 5: return zoomMinute;
        }
    }
    return zoomDir;
}

function zoomMinute(delta) { date = date.addSeconds(-delta * 60); }
function zoomHour(delta) { date = date.addHours(-delta); }
function zoomDay(delta) { date = date.addDays(-delta); }
function zoomMonth(delta) { date = date.addMonths(-delta); }
function zoomYear(delta) { date = date.addYears(-delta); }

function zoomDir(delta) { dir += (delta); logData.dir = dir; }