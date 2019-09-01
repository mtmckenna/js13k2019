precision highp float;

uniform vec3 uColor;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform float uTime;
uniform float uHit;
uniform float uHealth;

varying highp vec3 vLightIntensity;
varying vec2 vUvs;

void main() {
  float divisor = 150.0 - 100.0 * (1.0 - uHealth);
  float time = uTime / divisor;
  vec3 color = (0.5 + 0.5 * cos(time + vUvs.xyy + vec3(1.0, 2.0, 0.0))) * uHit;
  color.r = color.r;
  color.g = 0.0;
  color.b = min(color.b, 0.2);
  color = vLightIntensity + color;
  color.r = color.r + (1.0 - uHealth);
  gl_FragColor = vec4(color, 0.8);
}

