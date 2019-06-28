"use strict";
let DHLib = {
    swipeOffsetX:0,
    swipeOffsetY:0
};
(function(){
    "use strict";

    var socket;
    var timeoutID;
    

    function connect() {
        window.clearTimeout(timeoutID);
        socket = new WebSocket("ws://127.0.0.1:8080");
        socket.onmessage = function(){window.location.reload();};
        socket.onerror = socket.onclose = function(){
            timeoutID = setTimeout(connect, 1000);
        };
    }

    // connect();

    const canvas = document.getElementById('theCanvas');
    canvas.width = 400;
    canvas.height = 600;

    function addSwipeGesture(el, callback) {
        let startX, startY;
        let touchID;
        let failed = false;

        function startHandler(x,y) {
            startX = x;
            startY = y;
        }

        function moveHandler(x,y) {
            const dx = x-startX;
            const dy = y-startY;
            if (Math.pow(dx, 2)+Math.pow(dy, 2) > 1000) {

                if (Math.abs(dx) > Math.abs(dy)) {
                    callback(dx > 0 ? "right" : "left");
                    startX = x;
                } else {
                    
                    startY = y;
                    callback(dy > 0 ? "down" : "up");
                }
            }

            DHLib.swipeOffsetX=x-startX;
            DHLib.swipeOffsetY=y-startY;
        }

        el.addEventListener('touchstart', function(e) {
            failed = e.touches.length != 1;

            if (!failed) {
                e.preventDefault();
                const touch = e.touches[0];
                touchID = touch.identifier;
                startHandler(touch.screenX, touch.screenY);
            } else {
                DHLib.swipeOffsetX=0;
                DHLib.swipeOffsetY=0;
            }
            
        }, false);
        el.addEventListener('touchmove', function(e) {
            if (failed) return;
            e.preventDefault();
            let touch;
            for (const t of e.changedTouches) {
                if (t.identifier === touchID) {
                    touch = t;
                    break;
                }
            }
            if (!touch) return;

            moveHandler(touch.screenX,touch.screenY);
        }, false);
        el.addEventListener('touchend', function(e) {
            for (const t of e.changedTouches) {
                if (t.identifier === touchID) {
                    DHLib.swipeOffsetX=0;
                    DHLib.swipeOffsetY=0;
                    break;
                }
            }
        }, false);

        el.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startHandler(e.screenX, e.screenY);

            function mouseMoveHandler(e) {
                e.preventDefault();
                moveHandler(e.screenX,e.screenY);
            }

            window.addEventListener('mousemove', mouseMoveHandler, false);

            const mouseup = function(e) {
                window.removeEventListener('mousemove', mouseMoveHandler, false);
                window.removeEventListener('mouseup', mouseup, false);
                DHLib.swipeOffsetX=0;
                DHLib.swipeOffsetY=0;
            }

            window.addEventListener('mouseup', mouseup, false);
        }, false);
        
        
    }


    let swipeGestureKey = 0;
    addSwipeGesture(canvas, function(direction) {
        swipeGestureKey = {"right":39, "left":37,"up":38,"down":40}[direction];
    });
    
    function size(w,h) {
        canvas.width = w;
        canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    
    fill(255,255,255);

    function rect(x,y,w,h) {
        ctx.fillRect(x, y, w, h);
    }

    function ellipse(cx,cy,radius) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius/2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }

    function fill(r,g,b){
        if (typeof r === "object"){
            if (typeof r.g === "number") g = r.g;
            if (typeof r.b === "number") b = r.b;
            if (typeof r.r === "number") {r = r.r;} else {r=0;}
        }

        ctx.strokeStyle=ctx.fillStyle = "rgb("+r+","+g+","+b+")";
    }

    function color(r,g,b) {
        return {r:r,g:g,b:b};
    }

    function lerpColor(b,a,p) {
        p = Math.min(1,Math.max(p,0));
        return color(a.r*p + b.r*(1-p),
            a.g*p + b.g*(1-p),
            a.b*p + b.b*(1-p));
    }

    window.addEventListener('load',function(){

        if (typeof window.animate === "function") {
            setInterval(function() {
                let oldColor = ctx.fillStyle;
                ctx.fillStyle = "black";
                ctx.fillRect(0,0,900,900);
                ctx.fillStyle = oldColor;


                const swipeKey = swipeGestureKey;
                swipeGestureKey=0;
                const oldKeyValue = keyHash[swipeKey];
                if (swipeKey) {
                    keyHash[swipeKey] = true;
                    oldKeyHash[swipeKey] = false;
                }

                animate();

                keyHash[swipeKey]=oldKeyValue;
                oldKeyHash = Object.assign([], keyHash);
            }, 16);
        }
    });

    var keyHash = [];
    var oldKeyHash = [];
    window.addEventListener('keyup', function(e) { keyHash[e.keyCode] = false; e.preventDefault();}, true);
    window.addEventListener('keydown', function(e) { keyHash[e.keyCode] = true; e.preventDefault();}, true);
    function isKeyPressed(k) {
        return keyHash[k] === true ? 1 : 0;
    }
    function wasKeyPressed(k) {
        return oldKeyHash[k] === true ? 1 : 0;
    }

    Object.assign(window, {
        ctx,
        size,
        ellipse,
        rect,
        fill,
        color,
        lerpColor,
        isRightPressed: ()=>isKeyPressed(39),
        isLeftPressed: ()=>isKeyPressed(37),
        isUpPressed: ()=>isKeyPressed(38),
        isDownPressed: ()=>isKeyPressed(40),
        isKeyPressed,
        wasKeyPressed,
        println:(...theArgs)=>console.log(theArgs.join(" "))
    }); 

}());

