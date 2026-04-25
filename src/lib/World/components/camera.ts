import {
  PerspectiveCamera
} from "three";

function createCamera() {
  const camera = new PerspectiveCamera(
    35, // fov
    1, // aspect
    0.1, // near
    1000 // far
  )
  camera.position.set(0, 0, 10)
  return camera
}

export { createCamera }
