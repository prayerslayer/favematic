$(document).ready(function() {
	PLModel.init();
	PLView.init();
	//PLController.init();
	//interactions
	$("#set").click(function() {
		$("#user").removeClass("error");
		var val = $("#user").attr("value");
		if (val.length)
			PLModel.checkUser(val, function() {
				PLModel.user = val;
				PLModel.collectFavorites();
			});				
	});
	//bindings

	//tracks are collected
	$(PLModel).bind("collected", function() {
		//TODO remove spinner
		var tracks = PLModel.getNextFavorites(10);
		PLView.setTracks(tracks);
	});
	//show username error
	$(PLModel).bind("error_username", function() {
		$("#user").addClass("error");
	});
	//show next tracks
	$(PLView).bind("next", function() {
		var tracks = PLModel.getNextFavorites(10);
		PLView.setTracks(tracks);
	});
	//show previous tracks
	$(PLView).bind("previous", function() {
		var tracks = PLModel.getPreviousFavorites(10);
		PLView.setTracks(tracks);
	});
});

