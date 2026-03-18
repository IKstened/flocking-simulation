
class Boid {
    constructor(flockID, boidID, position, v, a) {
        this.width = 20;
        this.length = 30;
        this.viewRadius = 80;
        this.separationRadius = 40;
        this.flockID = flockID;
        this.boidID = boidID;
        this.maxVelocity = 4;
        this.maxAcceleration = 1;
        this.minAcceleration = 0;
        this.accelerationDir = true;
        this.position = position ? position : createVector(random(-width/2, width/2), random(-height/2, height/2));
        this.velocity = p5.Vector.random2D();
        this.velocity.mag(random(1, this.maxVelocity));
        this.acceleration = this.velocity.copy().setMag(random(1, this.maxAcceleration));
        this.maxSteerForce = 0.03;
        this.drag = 0.001;

        this.update();
    }


    draw() {

        this.drawBody();
        this.drawDebug();
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

            speedDebugEle.textContent = this.velocity.mag().toFixed(2);
            accelerationDebugEle.textContent = this.acceleration.mag().toFixed(2);
        }

    }

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);

        if (this.velocity.mag() > this.maxVelocity) this.velocity.setMag(this.maxVelocity);

        //decraseAcceleration
        //this.decreaseAcceleration();
        this.boundHandle();
        //this.drawVector(this.position, this.velocity.copy(), 'black');

        
        const aligmentV = this.handleAligment();
        const cohesionV = this.handleCohesion();
        const separationV = this.handleSeparation();

        let avg = createVector(0, 0);
        if (aligmentV) avg.add(aligmentV);
        if (cohesionV) avg.add(cohesionV);
        if (separationV) avg.add(separationV);

        if (this.boidID == 0) {
            if (aligmentV) this.drawVector(this.position, aligmentV, 'orange');
            if (cohesionV) this.drawVector(this.position, cohesionV, 'red');
            if (separationV) this.drawVector(this.position, separationV, 'blue');
        }
        avg.div(3);
        if (avg.mag() > 0) {
            if (avg.mag() > this.maxVelocity) avg.setMag(this.maxVelocity);
            if (this.boidID == 0) this.drawVector(this.position, avg, 'purple');
            this.steerTowards(avg);
        }


    }

    decreaseAcceleration() {
        const mag = this.acceleration.mag();
        let newMag = mag - this.drag;

        if (newMag >= 0) this.acceleration.setMag(newMag)
        else {
            this.acceleration.setMag(0);
            const newVelocityMag = this.velocity.mag() - this.drag;
            this.velocity.setMag(newVelocityMag <= 0 ? 0 : newVelocityMag)

        };
    }

    boundHandle() {
        //check if out of bounds
        if (this.position.x < -width/2) {
            this.position.x = width/2;
        } else if (this.position.x > width/2) {
            this.position.x = -width/2;
        }
        if (this.position.y < -height/2) {
            this.position.y = height/2;
        } else if (this.position.y > height/2) {
            this.position.y = -height/2;
        }
    }

    handleAligment() {
        const otherBoids = this.otherBoidsInVision();
        let avg = createVector(0, 0);
        otherBoids.forEach(boid => {
            avg.add(boid.velocity);
        });
        if (otherBoids.length != 0) {
            avg.div(otherBoids.length).mult(ALIGN_SCALE).limit(this.maxSteerForce);
            return avg;
        }

        return createVector(0, 0)
    }

    handleCohesion() {
        const otherBoids = this.otherBoidsInVision();
        if (otherBoids.length != 0) {
            //figure avarage position
            let avg = createVector(0,0);//this.position.copy();
            otherBoids.forEach(boid => {
                avg.add(boid.position);
            });

            avg.div(otherBoids.length);


            let steer = p5.Vector.sub(avg, this.position).mult(COHISION_SCALE).limit(this.maxSteerForce);
            /*if (this.boidID == 0) { //vectors are scaled when drawn!! will no end in points
                console.log(steer.x, steer.y, steer.mag(), p5.Vector.dist(this.position, avg));
                push();
                fill(100, 100, 100);
                noStroke();
                circle(avg.x, avg.y, 10);

                fill(200,200,0);
                circle(steer.x, steer.y, 10);
                pop();

            };*/
            return steer;
        }

        return createVector(0, 0)
    }

    handleSeparation() {
        const otherBoids = this.otherBoidsInVision(this.separationRadius);
        let targetVector = createVector(0, 0);
        if (otherBoids.length != 0) {
            otherBoids.forEach(boid => {
                //add the vector pointing away from the other boid, weighted by the distance
                const distance = this.position.dist(boid.position);
                const distanceScale = 1 - (distance / this.separationRadius)
                targetVector.x += (this.position.x-boid.position.x) *distanceScale;
                targetVector.y += (this.position.y-boid.position.y) *distanceScale;

            });

            //targetVector.div(otherBoids.length);
            targetVector = targetVector.mult(SEPARAION_SCALE).limit(this.maxSteerForce)
            return targetVector;
        }

        return createVector(0, 0)
    }

    otherBoidsInVision(radius = this.viewRadius) {
        let otherBoids = flocks[this.flockID].filter(boid => boid !== this && boid.position.dist(this.position) < radius);
        return otherBoids;
    }

    steerTowards(target /*vector */) {
        //steer towards the average
        //figure new acceleration

        let steer = target.sub(this.velocity);
        if (steer.mag() > 0.1) {
            steer = steer.limit(this.maxSteerForce);
            steerDebugEle.textContent = steer.mag().toFixed(2);
            this.acceleration.add(steer);
            if (this.acceleration.mag() > this.maxAcceleration) this.acceleration.setMag(this.maxAcceleration);

            if (this.boidID == 0) this.drawVector(this.position, steer, 'green');
            //console.log(this.acceleration.x, this.acceleration.y, this.acceleration.mag());            
        }

    }

    drawVector(inpBase, inpVec, myColor) {
        let base = inpBase.copy();
        let vec = inpVec.copy();
        vec.setMag(vec.mag()*10);
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