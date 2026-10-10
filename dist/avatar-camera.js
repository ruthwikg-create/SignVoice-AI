// Pure camera bounds shared by the WebGL renderer and offline checks.
export function boundsOf(points,padding=.015){
 if(!points.length||points.some(p=>p.length!==3||p.some(v=>!Number.isFinite(v))))throw Error('Camera points must be finite 3D positions.');
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const point of points)for(let i=0;i<3;i++){min[i]=Math.min(min[i],point[i]);max[i]=Math.max(max[i],point[i]);}
 return {center:min.map((v,i)=>(v+max[i])/2),size:Math.max(.12,...max.map((v,i)=>v-min[i]+padding*2))};
}
export function cameraForPoints(points,{aspect=1,yaw=0,zoom=1,padding=.035}={}){
 const {center}=boundsOf(points,padding),r=yaw*Math.PI/180;
 const horizontal=Math.max(...points.map(p=>Math.abs((p[0]-center[0])*Math.cos(r)-(p[2]-center[2])*Math.sin(r))))+padding;
 const vertical=Math.max(...points.map(p=>Math.abs(p[1]-center[1])))+padding;
 const half=Math.max(.075,vertical,horizontal/aspect)*1.08/Math.max(.7,Math.min(zoom,1.6));
 return {center,position:[center[0]+Math.sin(r)*2.4,center[1],center[2]+Math.cos(r)*2.4],left:-half*aspect,right:half*aspect,top:half,bottom:-half};
}
