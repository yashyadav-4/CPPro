// ═══════════════════════════════════════════════════════════════════════════
// [RETIRED] cfApiQueue.js — Replaced by Utils/bouncer.js (Lean Nexus Engine)
// This file is kept for reference only. All imports have been migrated.
// ═══════════════════════════════════════════════════════════════════════════

/*
let isApiBusy= false;

const waitingQueue={
    high:[],
    medium:[],
    low:[]
};

const acquireLock =(priority='medium')=>{
    return new Promise((resolve)=>{
        waitingQueue[priority].push(resolve);
        processQueue();
    });
};

const releaseLock= ()=>{
    isApiBusy=false;
    processQueue();
}

const processQueue = ()=>{
    if(isApiBusy) return;
    let nextTask=null;

    if(waitingQueue.high.length >0){
        nextTask=waitingQueue.high.shift();
    }else if(waitingQueue.medium.length > 0){
        nextTask= waitingQueue.medium.shift();
    }else if(waitingQueue.low.length >0){
        nextTask=waitingQueue.low.shift();
    }

    if(nextTask){
        isApiBusy=true;
        nextTask();
    }
};

module.exports={acquireLock , releaseLock};
*/