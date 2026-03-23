class Boid {
    constructor(flockID, boidID, position, v, a) {
        this.width = 20;
        this.length = 30;
        this.viewRadius = 80;
        this.separationRadius = 40;
        this.flockID = flockID;
        this.boidID = boidID;
        this.maxVelocity = 5;
        this.maxAcceleration = 2;
        this.position = position ? position : createVector(random(-width / 2, width / 2), random(-height / 2, height / 2));
        this.velocity = p5.Vector.random2D();
        this.velocity.mag(random(1, this.maxVelocity));
        this.acceleration = createVector(0, 0);
        this.maxSteerForce = 0.1;
    }


    draw() {

        this.updateSpeed();

        this.drawBody();
        //this.drawDebug();
    }

    drawBody() {

        const angle = this.velocity.heading();
        push();
        strokeWeight(2);
        fill(100);
        stroke(0);
        translate(this.position);
        rotate(angle + PI / 2);
        triangle(
            - this.width / 2, this.length / 2,
            this.width / 2, this.length / 2,
            0, -this.length / 2
        );
        pop();
    }

    drawDebug() {
        if (this.boidID == 0) {
            push();
            translate(this.position);
            stroke(0, 255, 0);
            noFill();
            circle(0, 0, this.viewRadius * 2);
            pop();

            //for each near boid draw a line between them
            const otherBoids = this.otherBoidsInVision();
            otherBoids.forEach(boid => {
                push();
                strokeWeight(2);
                stroke(0, 255, 0, 100);
                line(this.position.x, this.position.y, boid.position.x, boid.position.y);
                pop();
            });
        }

    }

    updateSpeed() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);

        if (this.velocity.mag() > this.maxVelocity) this.velocity.setMag(this.maxVelocity);

        this.boundHandle();
        //if (this.boidID == 0) this.drawVector(this.position, this.velocity.copy(), 'black');
    }

    updateSteer() {


        const aligmentV = this.handleAligment();
        const CohesionV = this.handleCohesion();
        const SeparationV = this.handleSeparation();

        let avg = createVector(0, 0);
        let i = 0;
        if (aligmentV) {
            avg.add(aligmentV);
            i++;
        }
        if (CohesionV) {
            avg.add(CohesionV);
            i++;
        }
        if (SeparationV) {
            avg.add(SeparationV);
            i++;
        }
        /*if (this.boidID == 0) {
            if (aligmentV) this.drawVector(this.position, aligmentV, 'orange');
            if (CohesionV) this.drawVector(this.position, CohesionV, 'red');
            if (SeparationV) this.drawVector(this.position, SeparationV, 'blue');
        }*/
        if(i == 0) i = 1;
        avg.div(i);
        if (avg.mag() > 0) {
            avg.setMag(this.maxVelocity);
            //if (this.boidID == 0) this.drawVector(this.position, avg, 'purple');
            this.steerTowards(avg);
        }


    }

    boundHandle() {
        //check if out of bounds
        if (this.position.x < -width / 2) {
            this.position.x = width / 2;
        } else if (this.position.x > width / 2) {
            this.position.x = -width / 2;
        }
        if (this.position.y < -height / 2) {
            this.position.y = height / 2;
        } else if (this.position.y > height / 2) {
            this.position.y = -height / 2;
        }
    }

    handleAligment() {
        const otherBoids = this.otherBoidsInVision();
        let avg = createVector(0, 0);
        otherBoids.forEach(boid => {
            avg.add(boid.velocity);
        });
        if (otherBoids.length != 0) {
            avg.div(otherBoids.length);
            return avg;
        }
    }

    handleCohesion() {
        const otherBoids = this.otherBoidsInVision();
        //figure avarage position
        let avg = createVector(0, 0);
        otherBoids.forEach(boid => {
            avg.add(boid.position);
        });
        if (otherBoids.length != 0) {
            avg.div(otherBoids.length);
            let steer = avg.sub(this.position);
            if (steer.mag() > this.maxVelocity) steer.setMag(this.maxSteerForce);
            return steer;
        }
    }

    handleSeparation() {
        const otherBoids = this.otherBoidsInVision(this.separationRadius);
        let targetVector = createVector(0, 0);
        otherBoids.forEach(boid => {
            //add the vector pointing away from the other boid, weighted by the distance
            const awayVector = p5.Vector.sub(this.position, boid.position);
            const distance = this.position.dist(boid.position);
            if (distance > 0) {
                awayVector.mult(1 - (distance / this.separationRadius));
                targetVector.add(awayVector);
            }
        });
        if (otherBoids.length != 0) {
            targetVector.div(otherBoids.length);

            return targetVector;
        }
    }

    otherBoidsInVision(radius = this.viewRadius) {
        let otherBoids = flocks[this.flockID].filter(boid => boid !== this && boid.position.dist(this.position) < radius);
        return otherBoids;
    }

    steerTowards(target /*vector */) {
        //steer towards the average
        //figure new acceleration

        let steer = target.sub(this.velocity);
        steer = steer.limit(this.maxSteerForce);
        this.acceleration.add(steer);
        if (this.acceleration.mag() > this.maxAcceleration) this.acceleration.setMag(this.maxAcceleration);

        //if (this.boidID == 0) this.drawVector(this.position, steer, 'green');
        //console.log(this.acceleration.x, this.acceleration.y, this.acceleration.mag());
    }

    drawVector(inpBase, inpVec, myColor) {
        let base = inpBase.copy();
        let vec = inpVec.copy();
        vec.setMag(vec.mag() * 10);
        push();
        stroke(myColor);
        strokeWeight(3);
        fill(myColor);
        translate(base.x, base.y);
        line(0, 0, vec.x, vec.y);
        rotate(vec.heading());
        let arrowSize = 7;
        translate(vec.mag() - arrowSize, 0);
        triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        pop();

    }
}