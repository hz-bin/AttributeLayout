function Vector() {
	var length = 0;
	var data = [];

	return {
		push_back : function(d) {
			data[length] = d;
			length = length + 1;
		},
		size : function() {
			return length;
		},
		setData : function(i, v) {
			data[i] = v;
		},
		get : function(index) {
			return data[index];
		},
		print : function() {
			for (var i = 0; i < length; i++) {
				console.log(data[i] + " ");
			}
		}
	}
}