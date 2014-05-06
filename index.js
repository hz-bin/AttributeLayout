var u;
var graph;
var numParticles;
var initPos = [];
var initVel = [];
var vel = [];

var pos = [];	// output position
var numBodies;	// No. of particles

var nodeAttrArray = [];

var BufferNames = {
	CURRENT_POS : 0,
    CURRENT_POS_SUB : 1,
    CURRENT_VEL : 2,
    CURRENT_VEL_SUB : 3,
    NEW_POS : 4,
    NEW_POS_SUB : 5,
    NEW_VEL : 6,
    NEW_VEL_SUB : 7,
    EDGE_IND : 8,
    EDGE_DATA : 9,
    EDGE_FORCE_DATA : 10,
    NODE_ATTR_DATA : 11,
    CLUSTER_CENTERS : 12,
    CLUSTER_MEMBERS : 13,
    GRAV_PATCH_BUF : 14,
    SPRINGC_PATCH_BUF : 15,
    SPRINGL_PATCH_BUF : 16
};

var WIDTH = 800;
var HEIGHT = 600;

function setupNBody() {
	graph = new Graph();
	graph.init();
	graph.readFile("data/graph.json", function() {
		// 存储需要的数据
		numParticles = graph.getNodeCount();
		numBodies = numParticles;
		nodeAttrArray = graph.getColData("group");

		initPos = [];
		initVel = [];
		pos = [];
		vel = [];

		var random = new Random;
		// initialization of inputs
		for (var i = 0; i < numBodies; i++) {
			var index = 4 * i;
			// First 3 values are position in x,y and z direction
			for (var j = 0; j < 2; j++) {
				initPos[index + j] = random.getRandom(0.01, 20);
			}
			initPos[index + 2] = 0.0;

			// 质量
			initPos[index + 3] = 1.0;
			// 速率
			initVel[i] = 0;
		}

		pos = initPos;
		vel = initVel;
	});
}

var bufSize;
var bufIn1;
var bufIn2;
var bufOut;
var vectorLength = 30;
var globalWS;
var localWS;

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
		// var vectorLength = 30;
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
		bufIn1 = u.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		bufIn2 = u.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		bufOut = u.createBuffer(WebCL.MEM_WRITE_ONLY, bufSize);

		// Create and build program for the first device
		u.createProgram("clProgramVectorAdd");

		// Create kernel and set arguments
		u.createKernel("ckVectorAdd");
		u.setArg(0, bufIn1);
		u.setArg(1, bufIn2);
		u.setArg(2, bufOut);
		u.setArg(3, new Uint32Array([vectorLength]));

		// Create command queue using the first available device
		u.createCommandQueue();

		// Write the buffer to OpenCL device memory
		u.enqueueWriteBuffer(bufIn1, bufSize, UIvector1);
		u.enqueueWriteBuffer(bufIn2, bufSize, UIvector1);


		// Init ND-range
		localWS = [8];
		globalWS = [Math.ceil(vectorLength / localWS) * localWS];

		output.innerHTML += "<br>Global work item size: " + globalWS;
		output.innerHTML += "<br>Local work item size: " + localWS;

		// Execute (enqueue) kernel
		u.enqueueNDRangeKernel(globalWS, localWS);

		// Read the result buffer from OpenCL device
		var outBuffer = u.enqueueReadBuffer(bufOut, bufSize, vectorLength);
		u.finish();

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
			pos[i] = outBuffer[i];
		}

		delete UIvector1;
		delete UIvector2;
		delete outBuffer;
	} catch (e) {
		console.log(e.message);
	}

}

function setup() {
	setupNBody();
	setupCL();
}

function getData() {
	console.log("group: " + graph.getColData("group"));
	console.log("pos: " + pos);
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

		bufIn1 = u.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		bufIn2 = u.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		bufOut = u.createBuffer(WebCL.MEM_WRITE_ONLY, bufSize);

		u.setArg(0, bufIn1);
		u.setArg(1, bufIn2);
		u.setArg(2, bufOut);
		u.setArg(3, new Uint32Array([vectorLength]));

		// Write the buffer to OpenCL device memory
		u.enqueueWriteBuffer(bufIn1, bufSize, UIvector1);
		u.enqueueWriteBuffer(bufIn2, bufSize, UIvector1);

		u.enqueueNDRangeKernel(globalWS, localWS);

		var outBuffer = u.enqueueReadBuffer(bufOut, bufSize, vectorLength);
		u.finish();

		console.log(outBuffer);


		delete UIvector1;
		delete UIvector2;
		delete outBuffer;
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