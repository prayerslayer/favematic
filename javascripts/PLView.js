var PLView = {
	
	div: "#view",
	up: "#up",
	down: "#down",
	tracks: "#tracks",

	init: function() {
		var scope = this;
		$(this.up).click(function() {
			$(scope).trigger("previous");
		});
		$(this.down).click(function() {
			$(scope).trigger("next");
		});
	},
	setTracks: function(tracks) {
		var scope = this;
		$(this.tracks).empty();
		$.when($(tracks).each(function(idx, track) {
			var div = $('<div class="favorite"><a class="track" href='+track.permalink_url+'>'+track.title+'</a></track>');
			$(scope.tracks).append(div);
		})).done(function() {
			$(scope.tracks).SCPlaylist();
			$(scope.div).removeClass("hidden");
		});
	}
};