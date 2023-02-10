uniform mat4 u_MVPMat;
attribute vec3 POSITION;

void main() {
  gl_Position = u_MVPMat  *  vec4( vec3(POSITION.x - 1.0, POSITION.y, POSITION.z), 1.0 );
}