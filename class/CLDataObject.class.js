function CLDataObject(_buf, _size) {
	var buf = _buf;
	var size = _size;

	this.getBuffer = function() {
		return buf;
	};
	this.setBuffer = function(_buf) {
		buf = _buf;
	}

	this.getSize = function() {
		return size;
	};
}