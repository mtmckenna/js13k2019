precision highp float;

varying vec3 vLight;

void main() {
 gl_FragColor = vec4(vLight, 1.0);
}
