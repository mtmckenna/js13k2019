precision mediump float;

varying vec2 vUvs;

// https://thebookofshaders.com/07/
float circle(in vec2 _st,in float _radius){
  vec2 dist= _st - vec2(0.5);
  return 1.0 - smoothstep(
  _radius - (_radius * .01),
  _radius + (_radius * .01),
  dot(dist, dist) * 4.0
);
}

void main() {
  float alpha = circle(vUvs, 1.0);
  gl_FragColor = vec4(.8, 0.9, 0.2, alpha * 0.9);
}
