var endTime = performance.now();
console.log('time that worker started executing', endTime);
postMessage(endTime)