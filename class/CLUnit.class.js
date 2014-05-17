function CLUnit() {
	// Setup WebCL context using the default device
	var ctx = webcl.createContext();
	var program;
	var device;
	var kernel;
	var cmdQueue;
	var buffers = new Map();

	this.createBuffer = function(id, memFlags, bytes) {
		var buf = ctx.createBuffer(memFlags, bytes);
		var obj = new CLDataObject(buf, bytes);
		buffers.put(id, obj);
	};

	// data 是数组类型，data = []
	this.writeData = function(id, data) {
		var obj = buffers.get(id);
		var buf = obj.getBuffer();
		var size = obj.getSize();

		var cldata = new Float32Array(data.length);
		for (var i = 0; i < data.length; i++) {
			cldata[i] = data[i];
		}
		cmdQueue.enqueueWriteBuffer(buf, false, 0, size, cldata);
		obj.setBuffer(buf);
		buffers.put(id, obj);
	};

	this.getBuffer = function(id) {
		var obj = buffers.get(id);
		return obj.getBuffer();
	};

	this.getBufferData = function(id) {
		var obj = buffers.get(id);
		var buf = obj.getBuffer();
		var size = obj.getSize();
		var outBuffer = new Float32Array(size / 4);
		// Read the result buffer from OpenCL device
		cmdQueue.enqueueReadBuffer(buf, false, 0, size, outBuffer);
		return outBuffer;
	}


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

	this.enqueueNDRangeKernel = function(globalWS, localWS) {
		// Execute (enqueue) kernel
		cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, null, globalWS, localWS);
	};

	this.finish = function() {
		//Finish all the operations
		cmdQueue.finish();
	};

	this.flush = function() {
		cmdQueue.flush();
	}
}