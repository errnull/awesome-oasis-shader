attribute float nodeID;
attribute float nodeVertexID;
attribute vec3 nodeCenter;
uniform float minID;
uniform float maxID;
uniform float trailLength;
uniform float maxTrailLength;
uniform float verticesPerNode;
uniform vec2 textureTileFactor;

uniform mat4 u_projMat;
uniform mat4 u_viewMat;
uniform mat4 u_modelMat;

uniform mat4 u_MVPMat;
attribute vec3 POSITION;


void main(){
  
  // float fraction = ( maxID - nodeID ) / ( maxID - minID );
  // vec4 realPosition = vec4((1.0 - fraction) * POSITION.xyz + fraction * nodeCenter.xyz, 1.0);
  // gl_Position = u_projMat * u_viewMat * realPosition;
    gl_Position = u_MVPMat  *  vec4( vec3(POSITION.x, POSITION.y, POSITION.z), 1.0 );

}