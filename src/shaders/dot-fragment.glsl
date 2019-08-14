precision mediump float;

uniform vec3 uColor;

void main() {
 gl_FragColor = vec4(uColor.xyz, 1.0);
}
