
const flocks = [[]];
const numberOfBoids = 70;
function setup() {
  createCanvas(1000, 800);
  frameRate(60);
  for(let i = 0; i < numberOfBoids; i++) {
    flocks[0].push(new Boid(0, i));
  }
  
}

function draw() {
  background(255);
  flocks.forEach(flock => {
    flock.forEach(boid => {
      boid.update();
      boid.draw()
    });
  });

}