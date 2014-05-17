function MathUtils() {
}

MathUtils.random = function(min, max) {
	var r = Math.random();
	return (r * (max - min) + min);
}

MathUtils.normalize = function(data) {
	var len = data.length;
	var max = d3.max(data);
	var min = d3.min(data);

	for (var i = 0; i < len; i++) {
		data[i] = (data[i] - min) / (max - min);
	}
}

MathUtils.range = function(data, rangeMin, rangeMax) {
	MathUtils.normalize(data);
	for (var i = 0; i < data.length; i++) {
		data[i] = data[i] * (rangeMax - rangeMin) + rangeMin;
	}
}