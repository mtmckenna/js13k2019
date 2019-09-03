precision highp float;

uniform vec3 uColor;
uniform vec3 uLightPosition;
varying vec3 vLighting;

void main() {
  gl_FragColor = vec4(uColor.xyz * vLighting, 1.0);
}
