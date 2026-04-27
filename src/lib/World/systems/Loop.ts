import { Timer } from 'three'
import type { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
class Loop {
  #scene: Scene
  #camera: PerspectiveCamera
  #renderer: WebGLRenderer
  #timer: Timer
  updatables: any[] = []
  constructor(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer) {
    this.#scene = scene
    this.#camera = camera
    this.#renderer = renderer
    this.#timer = new Timer()
  }
  start() {
    this.#renderer.setAnimationLoop(() => {
      this.tick()
      this.#renderer.render(this.#scene, this.#camera)
    })
  }
  stop() {
    this.#renderer.setAnimationLoop(null)
  }
  tick() {
    this.#timer.update()
    const delta = this.#timer.getDelta()
    //console.log('上一帧渲染的时间间隔', delta * 1000)
    for (const object of this.updatables) {
      object.tick(delta)
    }
  }
}
export { Loop }
