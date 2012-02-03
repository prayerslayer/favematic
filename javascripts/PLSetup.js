$(document).ready(function() {
	PLModel.init();
	PLView.init();
	PLController.init();
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
	$(PLModel).bind("collected", function() {
		PLController.showNext();
	});
	$(PLModel).bind("error_username", function() {
		$("#user").addClass("error");
	});
	$(PLView).bind("next", function() {
		alert("next");
		PLController.showNext();
	});
	$(PLView).bind("previous", function() {
		alert("prev");
	});
});

