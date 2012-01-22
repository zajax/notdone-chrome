var paint = false;
var curColor = "#FF0000";
var curTool = "marker";
var curSize = "normal";

var lastX;
var lastY;

var canvas;
var context;


function notdonedone_start_draw(brushcolor, brushsize){

	curColor = "#"+brushcolor;
	curSize = brushsize;

	if($("#notdonedone_canvas").size() <= 0){
		
		var $canvas = $("<canvas id='notdonedone_canvas'></canvas>");
		$canvas.css({
			"z-index":"2147483647 !important",
			"position": "absolute !important",
			"top":"0px !important",
			"left":"0px !important",
			"height": $('body').height(),
			"width": $('body').width()
		});
		
		$canvas.attr("width", $('body').width());
		$canvas.attr("height", $('body').height());
		
		$("body").append($canvas);
		
		canvas = $canvas.get(0);
		
		context = canvas.getContext("2d");
		
		
		$canvas.mousedown(function(e){
			lastX = e.pageX;
			lastY = e.pageY;

			paint = true;
		});
		
		$canvas.mousemove(function(e){
			if(paint==true){
				context.lineWidth = curSize;
				context.lineCap = "round";
				context.strokeStyle = curColor;
				context.beginPath();
				context.moveTo(lastX, lastY);
				context.lineTo(e.pageX, e.pageY);
				context.stroke();

				lastX = e.pageX;
				lastY = e.pageY;
			}
		});
		
		$canvas.mouseup(function(e){
			paint = false;
		});
		
		$canvas.mouseleave(function(e){
			paint = false;
		});

	}
}

	
function notdonedone_stop_draw(){

	context.clearRect ( 0 , 0 , canvas.width , canvas.height );

	$("#notdonedone_canvas").remove();
}	
	

function notdonedone_onRequest(request, sender, sendResponse) {

	if(request['action'] && request['action'] == "START_DRAW"){
		notdonedone_start_draw(request['color'], request['size']);
	}
   
};
chrome.extension.onRequest.addListener(notdonedone_onRequest);











