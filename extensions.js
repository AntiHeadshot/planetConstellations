p5.Vector.prototype.rotateAround = function (axis, angle) {
    // Make sure our axis is a unit vector
    axis = p5.Vector.normalize(axis);

    return p5.Vector.add(
        p5.Vector.mult(this, cos(angle)),
        p5.Vector.add(
            p5.Vector.mult(
                p5.Vector.cross(axis, this),
                sin(angle)
            ),
            p5.Vector.mult(
                p5.Vector.mult(
                    axis,
                    p5.Vector.dot(axis, this)
                ),
                (1 - cos(angle))
            )
        )
    );
}

p5.Vector.prototype.vrrot = function (b) {
    var an = p5.Vector.normalize(this);
    var bn = p5.Vector.normalize(b);
    var axb = p5.Vector.cross(an, bn).normalize();
    var ac = Math.acos(p5.Vector.dot(an, bn));

    var ac2 = ((an.cross(bn)).dot(axb)) / (an.dot(bn));

    return { axis: axb, ang: ac };
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
};

Date.prototype.addSeconds = function (s) {
    this.setTime(this.getTime() + (s * 1000));
    return this;
};

Date.prototype.addDays = function (days) {
    return this.addHours(days * 24);
};