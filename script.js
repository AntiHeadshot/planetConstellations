var isDebug = window.location.port ? true : false;

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}
Date.prototype.addSeconds = function(s) {
    this.setTime(this.getTime() + (s * 1000));
    return this;
}
Date.prototype.addDays = function(days) {
    return date.addHours(days * 24);
}

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

window.onresize = function() {
    logData.resize = { iw: window.innerWidth, ih: window.innerHeight };
    updateCanvas()
}

var isPortrait = window.orientation % 180;

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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
    logData.orientation++;
    //alert(window.orientation);
    orientationChanged().then(function() {
        isPortrait = window.orientation % 180;
        updateCanvas();
    });
};

var font;
var maxDist;

function renderPlanet(p) {
    lightFalloff(1, 0, 0);
    ambientMaterial(p.color);
    ambientLight(p.color.h, 50, 5);

    sphere(p.GetSize());
};

function InitPlanet(planet, sizeInKm, color) {

    planet.GetSize = () => sizeFunction(sizeInKm / 2);
    planet.color = color;
    planet.render = () => renderPlanet(planet);

    return planet;
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    cam = createCamera();
    cam.perspective(PI / 3.0, width / height, 0.1, 100000);

    cam.lookAt(0, 0, 0);
    cam.setPosition(0, -(height / 2) / tan(PI / 6), 0);
    cam.tilt(HALF_PI);

    colorMode(HSL, 360, 100, 100);

    loadFont('The_Bellovia_Sans.ttf', f => font = f);

    planets.push(InitPlanet(Astronomy.Sun, 696340, color('white')));
    planets.push(InitPlanet(Astronomy.Mercury, 2439.7, color(25, 84, 81)));
    planets.push(InitPlanet(Astronomy.Venus, 6051.8, color(0, 100, 91)));
    planets.push(InitPlanet(Astronomy.Earth, 6371, color(208, 100, 81)));
    planets.push(InitPlanet(Astronomy.Moon, 1737.4, color(200, 100, 99)));
    planets.push(InitPlanet(Astronomy.Mars, 3389.5, color(10, 96, 65)));
    planets.push(InitPlanet(Astronomy.Jupiter, 69911, color(35, 100, 80)));
    planets.push(InitPlanet(Astronomy.Saturn, 58232, color(59, 100, 75)));
    planets.push(InitPlanet(Astronomy.Uranus, 25362, color(216, 100, 81)));
    planets.push(InitPlanet(Astronomy.Neptune, 24622, color(230, 70, 70)));
    planets.push(InitPlanet(Astronomy.Pluto, 1188.3, color(213, 100, 96)));

    Astronomy.Sun.render = function() {
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
    });
    mc.on("rotatemove", e => {
        var angDist = rot - e.rotation;
        angDist += (angDist > 180) ? -360 : (angDist < -180) ? 360 : 0
        date = date.addSeconds(angDist * 24 * 60 * 60);
        rot = e.rotation;
    });

}

var logData = {};

var rot = 0;
var date = new Date();

var pf = 30;
var pf2 = 1;

function draw() {
    logData.pf = pf;

    cam.perspective(PI / (3.0 * pf), width / height, 0.1, 100000);

    var ddDist = cam.eyeY + ((height / 2) / tan(PI / (6.0 * pf)));

    height = canvas.elt.clientHeight;
    width = canvas.elt.clientWidth;

    background(0);
    smooth();

    logData.width = width;
    logData.heigth = height;

    //var date = new Date().addDays(frameCount).addHours(frameCount / 60 * 24);
    var day = Astronomy.DayValue(date);

    rotateX(HALF_PI);

    print(ddDist);

    push();
    translate(0, 0, -ddDist);
    drawUi();
    pop();

    push();

    noStroke();

    scale(scaling);

    var sunPos = Astronomy.Sun.EclipticCartesianCoordinates(day);
    //pointLight(255, 255, 255, sunPos.x, sunPos.z, sunPos.y);
    for (var planet of planets) {
        push();
        var position = planet.EclipticCartesianCoordinates(day);

        if (planet !== Astronomy.Sun) {
            directionalLight(255, 255, 255, position.x - sunPos.x, position.z - sunPos.z, -(position.y - sunPos.y));
        }
        translate(position.x, -position.y, position.z);
        planet.render()
        noLights();

        pop();
    }
    pop();

}

function drawUi() {
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

    if (font) {
        push();
        textFont(font);
        textSize(24);
        fill(255, 100, 100);

        push();
        logData.top = -height / 2 + 20;
        translate(0, -height / 2 + 20);
        text(date.getDate(), -20, 0);
        text('.' + (date.getMonth() + 1), 0, 0);
        text('.' + date.getFullYear(), 20, 0);

        pop();

        textSize(12);
        if (isDebug)
        //text(JSON.stringify(logData, null, '\t'), -width / 2, -height / 2 + 40, width, height - 40);
            text(JSON.stringify(logData, null, '\t'), 0, 0, width, height - 40);
        pop();
    }
}

function AddSphere(x, y, z, s) {
    push();
    translate(x, y, z);
    sphere(s);
    pop();
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

window.addEventListener('wheel', function(event) {
    event.preventDefault();
}, { passive: false });

function mouseWheel(event) {
    if (crtlPressed)
        pf = Math.min(Math.max(1, pf * (1 + event.delta / 10000)), 50);
    else
        date = date.addDays(Math.sign(event.delta) * 0.5);
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