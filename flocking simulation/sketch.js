
const flocks = [[]];
const numberOfBoids = 100;

const speedDebugEle = document.querySelector(".speed");
const accelerationDebugEle = document.querySelector(".acceleration");
const steerDebugEle = document.querySelector(".steer");

let COHISION_SCALE = 0.05;
let SEPARAION_SCALE = 1.1;
let ALIGN_SCALE = 0.8;

let LAST_TIME = Date.now();
const updateTimeStep = 10; //ms

document.querySelectorAll("input").forEach(input => {
  if (input.id.includes("align")) ALIGN_SCALE = input.value;
  if (input.id.includes("separation")) SEPARAION_SCALE = input.value;
  if (input.id.includes("cohesion")) COHISION_SCALE = input.value;
});
document.querySelector(".stepper").addEventListener("click", () => {
  background(255);

  circle(0, 0, 30);
  flocks.forEach(flock => {
    flock.forEach(boid => {
      boid.update();

      boid.draw()
    });
  });
});
function setup() {
  const canvas = document.querySelector("#flockCanvas");
  createCanvas(1000, 800, canvas);
  translate(width / 2, height / 2);
  scale(1, -1);
  frameRate(60);
  flocks[0].push(new Boid(0, 0, createVector(0, 0)))
  for (let i = 1; i <= numberOfBoids; i++) {
    flocks[0].push(new Boid(0, i));
  }

}

function draw() {
  //noLoop();
  translate(width / 2, height / 2);
  scale(1, -1);
  background(255);
  let newTime = Date.now();
  const doUpdate = newTime - LAST_TIME > updateTimeStep
  flocks.forEach(flock => {
    flock.forEach(boid => {
      if (doUpdate) boid.update();
      boid.draw()
    });
  });
  if (doUpdate) LAST_TIME = newTime;
}