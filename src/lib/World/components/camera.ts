import {
  PerspectiveCamera
} from "three";
interface PerspectiveCameraWithTick extends PerspectiveCamera {
  tick?: (delta: number) => void
}
function createCamera() {
  const camera: PerspectiveCameraWithTick = new PerspectiveCamera(
    35, // fov
    1, // aspect
    0.1, // near
    1000 // far
  )
  camera.position.set(0, 0, 10)
  let moveSpeed = 10
  camera.tick = (delta: number) => {
    // const currentZ = camera.position.z
    // const moveRange = [10, 50]
    // if (currentZ <= moveRange[0]) {
    //   moveSpeed = 10
    // } else if (currentZ >= moveRange[1]) {
    //   moveSpeed = -10
    // }
    // const moveDistance = currentZ + moveSpeed * delta
    // camera.position.z = moveDistance;
  }
  return camera
}

export { createCamera }
