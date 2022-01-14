var isDebug = window.location.port ? true : false;

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}
Date.prototype.addSeconds = function (s) {
    this.setTime(this.getTime() + (s * 1000));
    return this;
}

function GetTrueSize(s) {
    return s / 9.461e+12;
}

function GetLogSize(s) {
    return Math.log2(5 + (s * 4.5 / 696340)) / 30;
}

var sizeFunction = GetLogSize;

var canavas;

var planets = [];
var scaling = 1;

function updateCanvas() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    scaling = Math.min(width, height) / (maxDist * 2);
}

window.onresize = function () {
    logData.resize = { iw: window.innerWidth, ih: window.innerHeight };
    updateCanvas()
}

var isPortrait = window.orientation % 180;

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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
var lightMap;
var maxDist;
var skyBoxTxt;
var skyBox;

function preload() {
    font = loadFont('The_Bellovia_Sans.ttf');
    //lightMap = loadImage('images/lightMap.png');
    //https://tools.wwwtyro.net/space-3d/index.html#animationSpeed=0.24599640845243664&fov=150&nebulae=false&pointStars=true&resolution=4096&seed=5ep4a2tl2740&stars=true&sun=false
    skyBoxTxt = loadImage('images/cubemap.png');
    skyBox = loadModel('images/skybox.obj');
}

function renderPlanet(p) {
    lightFalloff(1, 0, 0);
    ambientMaterial(p.color);
    ambientLight(p.color.h, 50, 5);

    sphere(p.GetSize());
};

function InitPlanet(planet, sizeInKm, color){

    planet.GetSize = () => sizeFunction(sizeInKm / 2);
    planet.color = color;
    planet.render = ()=>renderPlanet(planet);

    return planet;
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    perspective(PI / 3.0, width / height, 0.1, 5000);

    colorMode(HSL, 360, 100, 100);

    planets.push(InitPlanet(Astronomy.Sun,696340,color('white')));
    planets.push(InitPlanet(Astronomy.Mercury,2439.7,color(25, 84, 81)));
    planets.push(InitPlanet(Astronomy.Venus,6051.8,color(0, 100, 91)));
    planets.push(InitPlanet(Astronomy.Earth,6371,color(208, 100, 81)));
    planets.push(InitPlanet(Astronomy.Moon,1737.4,color(200, 100, 99)));
    planets.push(InitPlanet(Astronomy.Mars,3389.5,color(10, 96, 65)));
    planets.push(InitPlanet(Astronomy.Jupiter,69911,color(35, 100, 80)));
    planets.push(InitPlanet(Astronomy.Saturn,58232,color(59, 100, 75)));
    planets.push(InitPlanet(Astronomy.Uranus,25362,color(216, 100, 81)));
    planets.push(InitPlanet(Astronomy.Neptune,24622,color(230, 70, 70)));
    planets.push(InitPlanet(Astronomy.Pluto,1188.3,color(213, 100, 96)));

    var day = Astronomy.DayValue(new Date());

    maxDist = 0;
    for (var planet of planets)
        maxDist = Math.max(planet.DistanceFromSun(day), maxDist);

    Astronomy.Sun.render = function () {
        emissiveMaterial(38, 100, 65);
        renderPlanet(this);
    };

    scaling = Math.min(width, height) / (maxDist * 2);

    var mc = new Hammer.Manager(document.body);

    // add to the Manager

    // create a pinch and rotate recognizer
    // these require 2 pointers
    var pinch = new Hammer.Pinch();
    var rotate = new Hammer.Rotate();

    // we want to detect both the same time

    pinch.recognizeWith(rotate);

    mc.add([pinch, rotate]);


    mc.on('pinchstart', e => {
        pf2 = pf;
    });

    mc.on('rotatestart', e => {
        rot = e.rotation;
    });

    mc.on("pinchin pinchout", e => {
        pf = Math.min(Math.max(1, e.scale * pf2), 300);
    });
    mc.on("rotatemove", e => {
        var angDist = rot - e.rotation;
        angDist += (angDist > 180) ? -360 : (angDist < -180) ? 360 : 0
        date = date.addSeconds(angDist * 24 * 60 * 60);
        rot = e.rotation;
    });

}

var logData = { orientation: 0 };

var rot = 0;
var date = new Date();

var pf = 1;
var pf2 = 1;

function draw() {
    height = canvas.elt.clientHeight;
    width = canvas.elt.clientWidth;

    background(0);
    smooth();

    logData.width = width;
    logData.heigth = height;

    //var date = new Date().addDays(frameCount).addHours(frameCount / 60 * 24);
    var day = Astronomy.DayValue(date);
    
    //orbitControl();

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

    push();
    perspective(PI / (3.0 * pf), width / height, 0.1, 5000);

    rotateX(HALF_PI)

    noStroke();

    ambientMaterial(255);
    scale(scaling);

    var sunPos = Astronomy.Sun.EclipticCartesianCoordinates(day);

    pointLight(255, 255, 255, sunPos.x, sunPos.z, sunPos.y);
    for (var planet of planets) {
        push();

        var position = planet.EclipticCartesianCoordinates(day);

        translate(position.x, position.z, position.y);
        planet.render()

        pop();
    }
    pop();

    push();
    
    noStroke();

    scale(scaling* maxDist*2);
    texture(skyBoxTxt);
    model(skyBox);

    pop();
}