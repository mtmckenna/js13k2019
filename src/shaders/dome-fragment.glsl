precision highp float;

uniform vec3 uColor;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

varying highp vec3 vLightIntensity;

void main() {
  gl_FragColor = vec4(vLightIntensity, 0.8);
}

