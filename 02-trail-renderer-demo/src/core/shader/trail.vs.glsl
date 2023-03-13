uniform mat4 u_projMat;
uniform mat4 u_viewMat;
uniform mat4 u_modelMat;

attribute vec3 POSITION;


void main(){
  gl_Position = u_projMat * u_viewMat * vec4( vec3(POSITION.x, POSITION.y, POSITION.z), 1.0 );
}
