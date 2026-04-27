import { DirectionalLight } from "three";
interface DirectionalLightWithTick extends DirectionalLight {
  tick?: (delta: number) => void
}
function createlights() {
  const light: DirectionalLightWithTick = new DirectionalLight('white', 8)
  light.position.set(10, 10, 10)
  light.tick = (delta: number) => {
    // Update light properties if needed
  }
  return light
}

export { createlights }
