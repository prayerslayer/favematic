//TODO reload
//TODO auf duplikate checken
//TODO auf unabspielbarkeit checken, wenn es geht und im next berücksichtigen
//TODO mehrere seiten

var favorites = new Array();
var max_tracks = 10;
var curUserId = null; //me
var code = null;
var client_id = "2becb25e8c48f8204593eb4df44c037f";
var client_s = "c390106e460ae397444126c8c77a0213";
var token = null;
//basic workflow
/*
get followings of current user
get favorites of those follwings, hold them in one array (favorites)
shuffle favorites
make soundcloud widgets of first 10
*/

//TODO auf parameter code prüfen, dann holdReady=true und connecten!

//returning from soundcloud
if (window.location.href.indexOf('?')>0) {
	code = window.location.href.slice(window.location.href.indexOf('?')+1, window.location.href.length);
	code = code.substring("code=".length);
	$.ajax({
		"url": "https://api.soundcloud.com/oauth2/token?client_id="+client_id+"&client_secret="+client_s+"&redirect_uri=http://localhost:8000/favematic&grant_type=authorization_code&code="+code,
		"type": "POST",
		success: function(a,b,c) {
			token = a.access_token;
			$.ajax({
				"type": "GET",
				"dataType": "JSON",
				"url": "https://api.soundcloud.com/me?oauth_token="+token,
				success: function(me, type, xhr) {
					curUserId = me.id;
					$("#connect").hide();
					$("#disconnect").show();
					bindToSCEvents();
					getUserFollowings(curUserId);
				}
			})
		}
	});
}

function bindToSCEvents() {
	$(document).bind("soundcloud:onPlayerError", function(player, data) {
		console.log("player error", player, data);
		var section = getSectionFromPlayer(player);
		section.hide();
	});
	$(document).bind("soundcloud:onPlayerReady", function(player, data) {
		console.log("player ready", player, data);
		var section = getSectionFromPlayer(player);
		console.log(section.attr("id"), $("#"+section.attr("id")+" > img.spinner"));
		$("#"+section.attr("id")+" > img.spinner").hide();
	})
	$(document).bind("soundcloud:onMediaPlay", function(player, data) {
		console.log("media play", player, data);
		markPlaying(player);
	});
	$(document).bind("soundcloud:onMediaStart", function(player, data) {
		console.log("media start", player, data);
		//markPlaying(player);
	});
	$(document).bind('soundcloud:onMediaEnd', function(player, data) {
		console.log("media end", player, data);
		var player_id = player.target.name;
		var number = parseInt(player_id.slice(5,player_id.length));
		if (!(number=== max_tracks-1)) { 
			//we're not finished
			var next = number+1;
			soundcloud.getPlayer("track"+number).api_seekTo(0); //rewind
			soundcloud.getPlayer("track"+next+"").api_play();
			console.log(number, next);
		}
	});
}

$(document).ready(function() {
	$("#login").click(function() {
		if (!SC.isConnected())
			window.location.href="https://soundcloud.com/connect?client_id=2becb25e8c48f8204593eb4df44c037f&response_type=code&redirect_uri=http://localhost:8000/favematic";
		else {
			SC.disconnect();
			$("#connect").show();
			$("#disconnect").hide();
		}
	});
});

function getSectionFromPlayer(player) {
	var player_id = player.target.name;
	var number = parseInt(player_id.slice(5,player_id.length));
	return $("#section"+number);
}

function markPlaying(player) {
	var section = getSectionFromPlayer(player);
	$(".track").removeClass("playing");
	section.addClass("playing");
	window.document.title=$("#"+section.attr("id")+" > .track_description").text();
}

//fisher yates shuffling
function shuffle(sourceArray) {
	for (var n = 0; n < sourceArray.length - 1; n++) {
		var k = n + Math.floor(Math.random() * (sourceArray.length - n));

		var temp = sourceArray[k];
		sourceArray[k] = sourceArray[n];
		sourceArray[n] = temp;
	}
} 

function getUserFollowings(curUserId){
	$("#spinner").show();
	$.ajax({
		url: 'https://api.soundcloud.com/users/'+curUserId+'/followings.json?client_id=956307a721999662072e3d9978287449',
		type: 'GET',
		dataType: 'json',
		complete: function(xhr, textStatus) {
			//console.log('complete', xhr, textStatus);
		},
		success: function(data, textStatus, xhr) {
			//console.log('success', data, textStatus, xhr);
			getFollowersFavs(data);
		},
		error: function(xhr, textStatus, errorThrown) {
			//console.log('error', xhr, textStatus, errorThrown);
		}
	});
}

function getFollowersFavs(data){
	var followcount = data.length;
	$.each(data, function(i, val){        
		var followerid = data[i].id;
		$.ajax({
			url: 'https://api.soundcloud.com/users/'+followerid+'/favorites.json?client_id=956307a721999662072e3d9978287449',
			type: 'GET',
			dataType: 'json',
			complete: function(xhr, textStatus) {
				//console.log('complete', xhr, textStatus);
			},
			success: function(favs, textStatus, xhr) {
				$(favs).each(function(idx, fav) {
					this.fav_of = data[i].username;
				});
				favorites = favorites.concat(favs);
				followcount--;
				if (followcount<=0)
				createPlaylist();
			},
			error: function(xhr, textStatus, errorThrown) {
				console.log('error', xhr, textStatus, errorThrown);
				followcount--;
				if (followcount<=0)
				createPlaylist();
			}
		});
	});
}
function createPlaylist() {
	shuffle(favorites);
	favorites = favorites.slice(0,Math.min(max_tracks, favorites.length));
	$(favorites).each(function(idx, fav) {
		$("#playlist").append(playerTemplate(fav, idx));
	});
	$("#spinner").hide();
}

function playerTemplate(track, idx){
	var playerHTML = '<object id="track'+idx+'" height="83.5em" width="100%">  <param name="movie" value="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"></param>  <param name="allowscriptaccess" value="always"></param>  <embed     src="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"&allowscriptaccess="always" height="83.5em" type="application/x-shockwave-flash" width="100%" name="track'+idx+'"></embed></object>';
	var spinner = "<img src='images/spinner.gif' class='spinner'/>"
	var div = "<section id='section"+idx+"' class='track column width2'><p class='track_description'>"+track.title+"</p><p>faved by "+track.fav_of+"</p><br/>"+spinner+" "+playerHTML+"</section>";
	return div;
}
