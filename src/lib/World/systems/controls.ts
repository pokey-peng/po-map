import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

function createControls(camera: any, domElement: HTMLElement) {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  return controls
}

export {
  createControls
}
