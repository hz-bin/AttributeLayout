var u;

var bufSize;
var bufIn1;
var bufIn2;
var bufOut;
var vectorLength = 30;
var globalWS;
var localWS;

var BufferNames = {
	BUFIN1 : 0,
	BUFIN2 : 1,
	BUFOUT : 2,
	LENGTH : 3
};

function setupCL() {
	var output = document.getElementById("output");
	
	output.innerHTML = "aa";
	try {
		if (window.webcl == undefined) {
			alert("Unfortunately your system does not support WebCL. " +
				"Make sure that you have both the OpenCL driver " +
				"and the WebCL browser extension installed.");
			return false;
		}
		u = new CLUnit();

		// Generate input vectors
		var UIvector1 = new Float32Array(vectorLength);
		var UIvector2 = new Float32Array(vectorLength);
		for (var i = 0; i < vectorLength; i = i + 1) {
			UIvector1[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
			UIvector2[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
		}

		output.innerHTML += "<br>Vector length = " + vectorLength;

		// Reserve buffers
		bufSize = vectorLength * 4; // size in bytes
		output.innerHTML += "<br>Buffer size: " + bufSize + " bytes";

		u.createProgram("clProgramVectorAdd");
		u.createKernel("ckVectorAdd");
		// Create command queue using the first available device
		u.createCommandQueue();

		u.createBuffer(BufferNames.BUFIN1, WebCL.MEM_READ_ONLY, bufSize);
		u.writeData(BufferNames.BUFIN1, UIvector1);

		u.createBuffer(BufferNames.BUFIN2, WebCL.MEM_READ_ONLY, bufSize);
		u.writeData(BufferNames.BUFIN2, UIvector2);

		u.createBuffer(BufferNames.BUFOUT, WebCL.MEM_WRITE_ONLY, bufSize);

		var currArg = 0;
		u.setArg(currArg++, u.getBuffer(BufferNames.BUFIN1));
		u.setArg(currArg++, u.getBuffer(BufferNames.BUFIN2));
		u.setArg(currArg++, u.getBuffer(BufferNames.BUFOUT));
		u.setArg(currArg++, new Uint32Array([vectorLength]));

		// Init ND-range
		localWS = [8];
		globalWS = [Math.ceil(vectorLength / localWS) * localWS];

		output.innerHTML += "<br>Global work item size: " + globalWS;
		output.innerHTML += "<br>Local work item size: " + localWS;

		// Execute (enqueue) kernel
		u.enqueueNDRangeKernel(globalWS, localWS);

		// Read the result buffer from OpenCL device
		// var outBuffer = u.enqueueReadBuffer(bufOut, bufSize, vectorLength);
		var outBuffer = u.getBufferData(BufferNames.BUFOUT, vectorLength)
		u.finish();

		console.log(outBuffer);

		//Print input vectors and result vector
		output.innerHTML += "<br>Vector1 = ";
		for (var i = 0; i < vectorLength; i = i + 1) {
			output.innerHTML += UIvector1[i] + ", ";
		}
		output.innerHTML += "<br>Vector2 = ";
		for (var i = 0; i < vectorLength; i = i + 1) {
			output.innerHTML += UIvector2[i] + ", ";
		}
		output.innerHTML += "<br>Result = ";
		for (var i = 0; i < vectorLength; i = i + 1) {
			output.innerHTML += outBuffer[i] + ", ";
			// pos[i] = outBuffer[i];
		}

		UIvector1 = null;
		UIvector2 = null;
		outBuffer = null;
	} catch (e) {
		console.log(e.message);
	}

}

function setup() {
	setupCL();
}


var timer;
var ttt = 0;
function loop() {
	timer = setInterval(function() {
		// Generate input vectors
		var vectorLength = 30;
		var UIvector1 = new Float32Array(vectorLength);
		var UIvector2 = new Float32Array(vectorLength);
		for (var i = 0; i < vectorLength; i = i + 1) {
			UIvector1[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
			UIvector2[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
		}

		u.writeData(BufferNames.BUFIN1, UIvector1);
		u.writeData(BufferNames.BUFIN2, UIvector2);

		u.enqueueNDRangeKernel(globalWS, localWS);
		var outBuffer = u.getBufferData(BufferNames.BUFOUT)
	
		u.finish();

		console.log(outBuffer);


		UIvector1 = null;
		UIvector2 = null;
		outBuffer = null;
		ttt++;
	}, 1);
}

function stop() {
	clearInterval(timer);
	console.log(ttt);
}

function start() {
	loop();
}

(function() {
	
	setup();

	loop();

})();