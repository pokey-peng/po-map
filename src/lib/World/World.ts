import { createRenderer } from './systems/renderer'
import { Resizer } from './systems/Resizer'
import { Loop } from './systems/Loop'
import { createControls } from './systems/controls'

import { createCamera } from './components/camera'
import { createCube } from './components/cube'
import { createScene } from './components/scene'
import { createlights } from './components/lights'

class World {
  #scene;
  #camera;
  #renderer;
  #loop;

  constructor(container: HTMLDivElement) {
    this.#scene = createScene()
    this.#camera = createCamera()
    this.#renderer = createRenderer()
    container.append(this.#renderer.domElement)

    const cube = createCube()
    const light = createlights()
    const controls = createControls(this.#camera, this.#renderer.domElement)
    this.#scene.add(cube, light)

    const resizer = new Resizer(container, this.#camera, this.#renderer)
    this.#loop = new Loop(this.#scene, this.#camera, this.#renderer)
    //this.#loop.updatables.push(cube, light, this.#camera)
  }

  render() {
    this.#renderer.render(this.#scene, this.#camera)
  }
  start() {
    this.#loop.start()
  }
  stop() {
    this.#loop.stop()
  }
}

export { World }
