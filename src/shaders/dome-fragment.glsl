precision highp float;

uniform vec3 uColor;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform float uTime;
uniform float uHit;

varying highp vec3 vLightIntensity;
varying vec2 vUvs;

void main() {
  float time = uTime / 200.0;
  float uGood = 0.0;
  vec3 color = (0.5 + 0.5 * cos(time + vUvs.xyx + vec3(1.0, 2.0, 0.0))) * uHit;
  color.r = color.r;
  color.g = 0.0;
  color.b = min(color.b, 0.2);
  gl_FragColor = vec4(vLightIntensity + color, 0.8);
}

