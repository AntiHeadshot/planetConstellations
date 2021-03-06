'use strict';

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    //alert("Error occured: " + errorMsg); //or any message
    logData.error = errorMsg;
    return false;
}

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
var isDebug = !!window.location.port;

function getPoints(e) {
    var points = [];
    for (var p of e.pointers)
        points.push(new p5.Vector(p.pageX, p.pageY));
    return points;
};

function GetTrueSize(s) {
    return s / 9.461e+12;
}

function GetLogSize(s) {
    return log2(5 + (s * 4.5 / 696340)) / 30;
}


function GetLogSize2(s) {
    return log2(5 + (s * 1000 / 696340)) / 30;
}

var sizeFunction = GetLogSize;

var canavas;
var cam;

var planets = [];
var scaling = 1;

function updateCanvas() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    scaling = (minSide = min(width, height)) / (maxDist * 2);
}

window.onresize = function() {
    logData.resize = { iw: window.innerWidth, ih: window.innerHeight };
    updateCanvas();
};

var isPortrait = window.orientation % 180;

function Sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function orientationChanged() {
    const timeout = 1000;
    return new window.Promise(function(resolve) {
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

window.onorientationchange = function() {
    orientationChanged().then(function() {
        isPortrait = window.orientation % 180;
        updateCanvas();
    });
};

var font;
var maxDist;
var maxSize;
var maxSize2;
var minSide;

function ExtendPlanet(planet, sizeInKm, color) {

    planet.sizeInKm = sizeInKm;
    planet.getSize = () => sizeFunction(planet.sizeInKm / 2);
    planet.color = color;
    planet.render = (outline) => {
        lightFalloff(1, 0, 0);
        ambientMaterial(planet.color);
        ambientLight(planet.color.h, 30, 7);

        var s = planet.getSize();
        sphere(s);

        if (outline) {
            push();
            //stroke('white');
            ambientLight('white');
            translate(0, 0, -s);
            sphere(s * 1.05);

            renderName(planet, s);
            pop();

        }
    };

    return planet;
}

function renderName(planet, s) {
    translate(-0.025, s + 0.1, 0);
    if (font) {
        textFont(font);
        textSize(0.1);
        fill('white');
        textAlign(LEFT, CENTER);
        rotateX(180);
        rotateZ(-90);
        text(planet.Name, 0, 0);
    }
}

function setup() {
    colorMode(HSL, 360, 100, 100);
    angleMode(DEGREES);

    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);

    loadFont('AzeretMono-Bold.ttf', f => font = f);

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

    Astronomy.Sun.render = function(outline) {
        emissiveMaterial(38, 100, 65);
        var s = this.getSize();
        sphere(s);

        if (outline) {
            push();
            translate(0, 0, -s);

            renderName(this, s);
            pop();

        }
    };

    var day = Astronomy.DayValue(new Date());
    maxDist = max(...planets.map(p => p.DistanceFromSun(day)));
    maxSize = max(...planets.map(p => p.getSize()));
    sizeFunction = GetLogSize2;
    maxSize2 = max(...planets.map(p => p.getSize()));
    sizeFunction = GetLogSize;

    scaling = (minSide = min(width, height)) / (maxDist * 2);

    var mc = new Hammer.Manager(document.body);

    var pinch = new Hammer.Pinch();
    var rotate = new Hammer.Rotate();

    pinch.recognizeWith(rotate);

    mc.add([pinch, rotate]);

    mc.on('pinchstart', e => {
        touchScale = e.scale;
        startZoom();
    });

    mc.on('rotatestart', e => {
        touchRot = e.rotation;
    });

    mc.on("pinchin pinchout", e => {
        var d = (1 - (touchScale / e.scale)) * 10;
        touchScale = e.scale;
        zoom(e.pointers[0].pageX, e.pointers[0].pageY, d);
    });
    mc.on("rotatemove", e => {
        var angDist = touchRot - e.rotation;
        touchRot = e.rotation;

        var partWidth = width / 6;
        var y = e.pointers[0].pageY;
        logData.y = y;
        if (y < partWidth / 2) {
            return;
        } else if (y > height - 120)
            return;

        angDist += (angDist > 180) ? -360 : (angDist < -180) ? 360 : 0
        dir -= angDist;
    });
}

window.addEventListener('wheel', function(event) {
    event.preventDefault();
}, { passive: false });

function mouseWheel(event) {
    zoom(mouseX, mouseY, event.delta / 100);
}

function mouseDragged() {
    var rot = new p5.Vector(mouseX - width / 2, mouseY - height / 2, 0).vrrot(new p5.Vector(0, -1, 0));
    dir = rot.ang * (-Math.sign(rot.axis.z));
}

function touchMoved() {}

var touchScale = 1;

var logData = { dir: dir, error: null };

var touchRot = 0;
var date = new Date(2021, 4, 23, 4, 0);

var zoomF = 5;
var zoomPlanets = 0.5;

var fov = 210;
var dir = 23;

function draw() {
    logData.zoomPlanets = zoomPlanets;
    logData.dir = dir;
    logData.fov = fov;

    height = canvas.elt.clientHeight;
    width = canvas.elt.clientWidth;
    if (!cam) {
        cam = createCamera();

        cam.lookAt(0, 0, 0);
        cam.setPosition(0, -250, 0);
        cam.tilt(90);
    }
    cam.ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 500000);

    background(0);
    smooth();
    rotateX(90);

    push();
    drawPlanets();
    pop();

    rotateX(180);
    push();
    drawUi();
    pop();
}

function drawPlanets() {
    var day = Astronomy.DayValue(date);
    noStroke();

    push();
    scale(scaling * zoomF);

    renderPlanet(Astronomy.Sun, day);
    renderPlanet(Astronomy.Earth, day);
    for (var planet of planets.slice(2))
        renderPlanet(planet, day);

    drawFov();
    pop();

    push();
    drawPlanetsFromEarth();
    pop();
}

function renderPlanet(planet, day) {
    push();

    planet.position = planet.EclipticVector(day);

    if (Astronomy.Sun != planet) {
        var ligthDir = p5.Vector.sub(planet.position, Astronomy.Sun.position);
        directionalLight(255, 255, 255, ligthDir.x, ligthDir.z, ligthDir.y);
    }
    translate(planet.position.x, planet.position.y, planet.position.z);
    planet.render()
    noLights();

    pop();
}

function drawPlanetsFromEarth() {

    renderFromEarth(Astronomy.Sun);
    for (var planet of planets.slice(2)) {
        renderFromEarth(planet);
    }
}

function renderFromEarth(planet) {
    push();

    var dirP = p5.Vector.sub(planet.position, Astronomy.Earth.position);
    var dirS = p5.Vector.sub(Astronomy.Sun.position, Astronomy.Earth.position);

    var rot = dirP.vrrot(vectorForaward);
    var dirPV = dirP.rotateAround(rot.axis, rot.ang);
    var dirSV = dirS.rotateAround(rot.axis, rot.ang);

    var scaling = 120 / maxSize2;
    scale(scaling);

    // print(dirP.mag());
    translate(0, -(height / minSide) + maxSize2 * 2 * zoomPlanets + 0.02, -dirP.mag() * 10);

    var ang = rot.ang * Math.sign(rot.axis.z) - dir;
    ang = (ang % (360) + 180) % 360 - 180;

    var pt = ((ang) / fov) * 2;

    translate(pt, 0, 0);
    // translate(-6.85 + maxSize * 10, -8.8 + maxSize * 10, dirP.mag());

    var dirL = p5.Vector.sub(dirPV, dirSV);
    directionalLight(255, 255, 255, dirL.x, dirL.y, dirL.z);
    push();
    scale(zoomPlanets);
    sizeFunction = GetLogSize2;
    planet.render(true);
    sizeFunction = GetLogSize;
    pop();
    noLights();

    pop();
}

var vectorForaward = new p5.Vector(0, 1, 0);
var vectorUp = new p5.Vector(0, 0, -1);

function drawFov() {
    push();
    translate(Astronomy.Earth.position.x, Astronomy.Earth.position.y, Astronomy.Earth.position.z - 60);

    strokeWeight(2);

    var fovDir = new p5.Vector(0, 1, 0).mult(maxDist);

    var fov2 = fov / 2;
    fovDir = fovDir.rotateAround(vectorUp, (dir - fov2));

    var stepCnt = 10;
    var step = fov2 / stepCnt;
    var raystrength = 20;
    for (var i = 0; i <= stepCnt; i++) {
        var c = (1 - (i / stepCnt)) * 0.6 + 0.4;
        stroke(c * c * raystrength);
        line(0, 0, 0, fovDir.x, fovDir.y, fovDir.z);
        fovDir = fovDir.rotateAround(vectorUp, step);
    }
    for (var i = 0; i < stepCnt; i++) {
        var c = (i / stepCnt) * 0.6 + 0.4;
        stroke(c * c * raystrength);
        line(0, 0, 0, fovDir.x, fovDir.y, fovDir.z);
        fovDir = fovDir.rotateAround(vectorUp, step);
    }

    pop();
}

function drawUi() {
    if (isDebug) {
        drawFrame();
    }

    if (font) {
        push();
        textFont(font);
        fill('white');

        push();

        translate(-width / 2, -height / 2 + 2);
        var partWidth = width / 6;

        textSize(partWidth / 2);
        textAlign(RIGHT, TOP);

        text(date.getFullYear(), 0, 0, partWidth * 2, height);
        translate(partWidth * 2, 0);
        text('.', 0, 0);
        text(((date.getMonth() + 1).padStart(2)), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text('.', 0, 0);
        text(date.getDate().padStart(2), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text(date.getHours(), 0, 0, partWidth, height);
        translate(partWidth, 0);
        text(':', 0, 0);
        text(date.getMinutes().padStart(2), 0, 0, partWidth, height);

        pop();

        textSize(12);
        if (isDebug)
            text(JSON.stringify(logData, null, '\t'), -width / 2, -height / 2 + partWidth / 2, width, height - partWidth / 2);

        pop();
    }
}

function drawFrame() {
    push();
    stroke('red');
    strokeWeight(2);
    noFill();
    translate(-width / 2, -height / 2);
    rect(1, 1, width - 2, height - 2 - 120);

    stroke('green');
    translate(-width / 2, -height / 2);
    rect(1, 1, width * 2 - 2, height * 2 - 2);
    pop();
}

function zoom(x, y, delta) {
    getZoom(x, y)(delta);
};

function getZoom(x, y) {
    var partWidth = width / 6;
    if (y < partWidth / 2) {
        switch (floor(~~(x / partWidth))) {
            case 0:
            case 1:
                return zoomYear;
            case 2:
                return zoomMonth;
            case 3:
                return zoomDay;
            case 4:
                return zoomHour;
            case 5:
                return zoomMinute;
        }
    } else if (y > height - 120)
        return zoomEarthView;
    return zoomFov;
}

var dHr = 0;
var dDay = 0;
var dMon = 0;
var dYe = 0;

function startZoom() {
    dHr = 0;
    dDay = 0;
    dMon = 0;
    dYe = 0;
}

function zoomMinute(delta) { date = date.addSeconds(-delta * 60); }

function zoomHour(delta) { dHr = zoomInt(dHr, delta, d => date = date.addHours(-d)); }

function zoomDay(delta) { dDay = zoomInt(dDay, delta, d => date = date.addDays(-d)); }

function zoomMonth(delta) { dMon = zoomInt(dMon, delta, d => date = date.addMonths(-d)); }

function zoomYear(delta) { dYe = zoomInt(dYe, delta, d => date = date.addYears(-d)); }

function zoomPage(delta) {
    zoomF = constrain(zoomF + delta, 1, 200);
    logData.zoom = zoomF;
}

function zoomFov(delta) {
    fov = constrain(fov + delta * 3, 30, 359);
}

function zoomEarthView(delta) {
    zoomPlanets = constrain(zoomPlanets + delta * 0.01, 0.1, 2);
}

function zoomInt(val, delta, fn) {
    val += delta;
    if (val >= 1 | val <= -1) {
        logData.v = ~~val;
        fn(logData.v);
        val %= 1;
    }
    return val;
}