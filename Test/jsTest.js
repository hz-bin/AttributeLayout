(function() {
	var buf;
	function add(a, b) {
		var t = 3;
		t = a + b;
		return t;
	}

	function add(a, b, c) {
		return a + b + c;
	}

	buf = add(3, 4);

	// alert(buf);

	alert(add(2, 4, 5));

})();