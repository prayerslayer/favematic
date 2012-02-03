var PLController = {
	model: null,
	view: null,
	init: function() {
		this.model = PLModel;
		this.view = PLView;	
	},
	showNext: function() {
		var tracks = this.model.getFavorites(10);
		this.view.setTracks(tracks);
	}
};