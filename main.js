function setupNBody() {

}

function setupCL() {

}

function setupCLKernels() {

}

function setup() {
	setupNBody();
	setupCL();
}

(function() {
	console.log("aaa");
	setup();			// 1

	setupCLKernels();	// 2

})();