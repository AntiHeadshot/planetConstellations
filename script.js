Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

function GetTrueSize(s) {
    return s / 9.461e+12;
}

function GetLogSize(s) {
    return Math.log2(5 + (s * 4.5 / 696340));
}

var sizeFunction = GetLogSize;

var canavas;

var planets = [];
var scaling = 1;

window.onresize = function() {
    canvas.size(window.innerWidth, window.innerHeight);
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    perspective(PI / 3.0, width / height, 0.1, 5000);

    colorMode(HSL, 360, 100, 100);

    Astronomy.Sun.GetSize = () => sizeFunction(696340 / 2);
    Astronomy.Mercury.GetSize = () => sizeFunction(2439.7 / 2);
    Astronomy.Venus.GetSize = () => sizeFunction(6051.8 / 2);
    Astronomy.Earth.GetSize = () => sizeFunction(6371 / 2);
    Astronomy.Moon.GetSize = () => sizeFunction(1737.4 / 2);
    Astronomy.Mars.GetSize = () => sizeFunction(3389.5 / 2);
    Astronomy.Jupiter.GetSize = () => sizeFunction(69911 / 2);
    Astronomy.Saturn.GetSize = () => sizeFunction(58232 / 2);
    Astronomy.Uranus.GetSize = () => sizeFunction(25362 / 2);
    Astronomy.Neptune.GetSize = () => sizeFunction(24622 / 2);
    Astronomy.Pluto.GetSize = () => sizeFunction(1188.3 / 2);

    planets.push(Astronomy.Sun);
    planets.push(Astronomy.Mercury);
    planets.push(Astronomy.Venus);
    planets.push(Astronomy.Earth);
    planets.push(Astronomy.Moon);
    planets.push(Astronomy.Mars);
    planets.push(Astronomy.Jupiter);
    planets.push(Astronomy.Saturn);
    planets.push(Astronomy.Uranus);
    planets.push(Astronomy.Neptune);
    planets.push(Astronomy.Pluto);

    var day = Astronomy.DayValue(new Date());

    scaling = Math.min(width, height);

    var maxDist = 0;
    for (var planet of planets) {
        var p = planet;
        var dist = planet.DistanceFromSun(day);
        maxDist = Math.max(dist, maxDist);
    }

    function renderPlanet(p) {
        lightFalloff(1, 0, 0);
        scale(1 / scaling);
        sphere(p.GetSize());
    };

    Astronomy.Sun.render = function() {
        emissiveMaterial(38, 100, 65);
        renderPlanet(this);
    };
    Astronomy.Mercury.render = function() {
        ambientMaterial(25, 84, 81);
        ambientLight(25, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Venus.render = function() {
        ambientMaterial(0, 100, 91);
        ambientLight(0, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Earth.render = function() {
        ambientMaterial(208, 100, 81);
        ambientLight(208, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Moon.render = function() {
        ambientMaterial(200, 100, 99);
        ambientLight(200, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Mars.render = function() {
        ambientMaterial(10, 96, 65);
        ambientLight(10, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Jupiter.render = function() {
        ambientMaterial(35, 100, 80);
        ambientLight(35, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Saturn.render = function() {
        ambientMaterial(59, 100, 75);
        ambientLight(59, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Uranus.render = function() {
        ambientMaterial(216, 100, 81);
        ambientLight(216, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Neptune.render = function() {
        ambientMaterial(230, 70, 70);
        ambientLight(230, 50, 5);
        renderPlanet(this);
    };
    Astronomy.Pluto.render = function() {
        ambientMaterial(213, 100, 96);
        ambientLight(213, 50, 5);
        renderPlanet(this);
    };

    scaling = scaling / (maxDist * 2);

    //frameRate(1);
}

var SizeScaling = 200;
var SizeScaling = 200;

function draw() {
    push()
    rotateX(HALF_PI)

    background(0);
    smooth();
    noStroke();


    var day = Astronomy.DayValue(new Date().addDays(frameCount).addHours(frameCount / 60 * 24));

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
}