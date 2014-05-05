var graph;

function setupNBody() {
	graph = new Graph();
	graph.init();
	graph.readFile("data/graph.json", function() {
		// 存储需要的数据
		console.log("completed");
	});
}

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
		// Generate input vectors
		var vectorLength = 30;
		var UIvector1 = new Float32Array(vectorLength);
		var UIvector2 = new Float32Array(vectorLength);
		for (var i = 0; i < vectorLength; i = i + 1) {
			UIvector1[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
			UIvector2[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
		}

		output.innerHTML += "<br>Vector length = " + vectorLength;

		// Setup WebCL context using the default device
		var ctx = webcl.createContext();

		// Reserve buffers
		var bufSize = vectorLength * 4; // size in bytes
		output.innerHTML += "<br>Buffer size: " + bufSize + " bytes";
		var bufIn1 = ctx.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		var bufIn2 = ctx.createBuffer(WebCL.MEM_READ_ONLY, bufSize);
		var bufOut = ctx.createBuffer(WebCL.MEM_WRITE_ONLY, bufSize);

		// Create and build program for the first device
		var kernelSrc = loadKernel("clProgramVectorAdd");
		var program = ctx.createProgram(kernelSrc);
		var device = ctx.getInfo(WebCL.CONTEXT_DEVICES)[0];

		try {
			program.build([device], "");
		} catch (e) {
			alert("Failed to build WebCL program. Error "
				 + program.getBuildInfo(device, WebCL.PROGRAM_BUILD_STATUS)
				 + ":  " + program.getBuildInfo(device, WebCL.PROGRAM_BUILD_LOG));
			throw e;
		}

		// Create kernel and set arguments
		var kernel = program.createKernel("ckVectorAdd");
		kernel.setArg(0, bufIn1);
		kernel.setArg(1, bufIn2);
		kernel.setArg(2, bufOut);
		kernel.setArg(3, new Uint32Array([vectorLength]));

		// Create command queue using the first available device
		var cmdQueue = ctx.createCommandQueue(device);

		// Write the buffer to OpenCL device memory
		cmdQueue.enqueueWriteBuffer(bufIn1, false, 0, bufSize, UIvector1);
		cmdQueue.enqueueWriteBuffer(bufIn2, false, 0, bufSize, UIvector2);

		// Init ND-range
		var localWS = [8];
		var globalWS = [Math.ceil(vectorLength / localWS) * localWS];

		output.innerHTML += "<br>Global work item size: " + globalWS;
		output.innerHTML += "<br>Local work item size: " + localWS;

		// Execute (enqueue) kernel
		cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, null, globalWS, localWS);

		// Read the result buffer from OpenCL device
		outBuffer = new Float32Array(vectorLength);
		cmdQueue.enqueueReadBuffer(bufOut, false, 0, bufSize, outBuffer);
		cmdQueue.finish(); //Finish all the operations

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
		}

		delete UIvector1;
		delete UIvector2;
		delete outBuffer;
	} catch (e) {
		console.log(e.message);
	}

}

function setupCLKernels() {

}

function setup() {
	setupNBody();
	setupCL();
}

function getData() {
	console.log(graph.getColData("group"));
}

(function() {
	
	setup();			// 1

	setupCLKernels();	// 2

})();