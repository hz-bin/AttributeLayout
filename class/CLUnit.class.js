function CLUnit() {
	// Setup WebCL context using the default device
	var ctx = webcl.createContext();
	var program;
	var device;
	var kernel;
	var cmdQueue;

	this.createBuffer = function(memFlags, bytes) {
		return ctx.createBuffer(memFlags, bytes);
	};

	this.writeData = function(id, ptr) {

	};

	this.createProgram = function(name) {
		var kernelSrc = loadKernel(name);
		program = ctx.createProgram(kernelSrc);
		device = ctx.getInfo(WebCL.CONTEXT_DEVICES)[0];

		try {
			program.build([device], "");
		} catch (e) {
			alert("Failed to build WebCL program. Error "
				 + program.getBuildInfo(device, WebCL.PROGRAM_BUILD_STATUS)
				 + ":  " + program.getBuildInfo(device, WebCL.PROGRAM_BUILD_LOG));
			throw e;
		}
	};

	this.createKernel = function(kernelName) {
		kernel = program.createKernel(kernelName);
	};

	this.setArg = function(id, val) {
		kernel.setArg(id, val);
	};

	this.createCommandQueue = function() {
		// Create command queue using the first available device
		cmdQueue = ctx.createCommandQueue(device);
	}

	this.enqueueWriteBuffer = function(bufIn, bufSize, data) {
		// Write the buffer to OpenCL device memory
		cmdQueue.enqueueWriteBuffer(bufIn, false, 0, bufSize, data);
	};

	this.enqueueNDRangeKernel = function(globalWS, localWS) {
		// Execute (enqueue) kernel
		cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, null, globalWS, localWS);
	};

	this.enqueueReadBuffer = function(bufOut, bufSize, vectorLength) {
		var outBuffer = new Float32Array(vectorLength);
		// Read the result buffer from OpenCL device
		cmdQueue.enqueueReadBuffer(bufOut, false, 0, bufSize, outBuffer);
		return outBuffer;
	};

	this.finish = function() {
		//Finish all the operations
		cmdQueue.finish();
	};
}