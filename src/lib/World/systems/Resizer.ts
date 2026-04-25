import type { PerspectiveCamera } from "three";
import type { WebGLRenderer } from "three";
class Resizer {
  constructor(container: HTMLDivElement, camera: PerspectiveCamera, renderer: WebGLRenderer) {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    })
  }
}

export { Resizer }
