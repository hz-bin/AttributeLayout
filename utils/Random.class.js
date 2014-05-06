function Random() {
	this.getRandom = function(min, max) {
		var r = Math.random();
		return (r * (max - min) + min);
	};
}