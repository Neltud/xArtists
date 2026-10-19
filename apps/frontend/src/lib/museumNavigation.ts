export type NavigationHold={up:boolean;down:boolean;left:boolean;right:boolean}
export function joystickAxes(dx:number,dy:number,radius:number,deadzone=.12){
 const length=Math.hypot(dx,dy),scale=length>radius?radius/length:1
 const x=dx*scale/radius,y=dy*scale/radius
 return {x:Math.abs(x)<deadzone?0:x,y:Math.abs(y)<deadzone?0:y}
}
/** Forward follows the camera's -Z axis, including after a touch rotation. */
export function viewMovement(x:number,y:number,yaw:number){
 const scale=Math.max(1,Math.hypot(x,y)),ix=x/scale,iz=y/scale,c=Math.cos(yaw),s=Math.sin(yaw)
 return {x:ix*c+iz*s,z:-ix*s+iz*c}
}
export function holdFromAxes(x:number,y:number):NavigationHold{return {left:x<-.18,right:x>.18,up:y<-.18,down:y>.18}}
export function isTapMovement(startX:number,startY:number,x:number,y:number){return Math.hypot(x-startX,y-startY)<8}
