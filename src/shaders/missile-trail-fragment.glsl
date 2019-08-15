precision highp float;

uniform vec3 uColor;
uniform float uTime;
uniform float uStartTime;
uniform float uEndTime;
uniform float uExplodeTime;
uniform float uGood;

varying vec2 vUvs;

void main() {
  float x = pow(1.0 - abs(0.5 - vUvs.x), 10.0);
  float percentComplete = clamp((uTime - uStartTime) / (uExplodeTime - uStartTime), 0.0, 1.0);
  float trail = x * (1.0 - step(percentComplete, vUvs.y)) * (vUvs.y / percentComplete);
  float percentFadedOut = 1.0 - clamp((uTime - uExplodeTime) / (uEndTime - uExplodeTime), 0.0, 1.0);
  float r = 1.0 - uGood;
  float g = uGood;

  // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  // return;
  gl_FragColor = vec4(r, g, 0.2, trail * percentFadedOut);
}

