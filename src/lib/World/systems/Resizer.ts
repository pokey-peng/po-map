import type { PerspectiveCamera } from "three";
import type { WebGLRenderer } from "three";

function setSize(container: HTMLDivElement, camera: PerspectiveCamera, renderer: WebGLRenderer) {
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
}
class Resizer {
  #onResize: () => void = () => { }
  constructor(container: HTMLDivElement, camera: PerspectiveCamera, renderer: WebGLRenderer) {
    setSize(container, camera, renderer)

    window.addEventListener('resize', () => {
      console.log('resize')
      setSize(container, camera, renderer)
      this.#onResize();
    })
  }
  setResizeCallback(onResize: () => void) {
    this.#onResize = onResize
  }
}

export { Resizer }
