import { BoxGeometry, Mesh, MeshStandardMaterial } from "three";
import { MathUtils } from "three";
import type { Mesh as MeshType } from "three";
interface MeshWithTick extends MeshType {
  tick?: (delta: number) => void
}
function createCube() {
  const geometry = new BoxGeometry(2, 2, 2)
  const material = new MeshStandardMaterial({ color: 'orchid' })
  const cube: MeshWithTick = new Mesh(geometry, material)
  const radian = MathUtils.degToRad(30)
  let translateX = 0.5;
  cube.tick = (delta: number) => {
    cube.rotation.x += radian * delta
    const translateRange = [-1, 1]
    const currentX = cube.position.x
    if (currentX <= translateRange[0] || currentX >= translateRange[1]) {
      translateX = -1 * translateX
    }
    console.log('translateX', currentX)
    const moveDistance = translateX * delta
    cube.position.x += moveDistance;
  }
  return cube
}

export { createCube }
