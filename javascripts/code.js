//TODO auf duplikate checken
//TODO bevor beim nächsten track play aufgerufen wird, checken ob der überhaupt bereit ist.
//TODO statt jquery ajax calls vl SC.put, .get etc benutzen?
//TODO IE unterstützung
//TODO FF widget events?

var favorites = new Array();
var max_tracks = 10;
var curUserId = null; //me
var code = null;
var client_id = "2becb25e8c48f8204593eb4df44c037f";
var client_s = "c390106e460ae397444126c8c77a0213";
var token = null;
var offset = 0;

//basic workflow
/*
get followings of current user
get favorites of those follwings, hold them in one array (favorites)
shuffle favorites
make soundcloud widgets of first 10
*/
jQuery.support.cors = true;
//returning from soundcloud
var param_idx = window.location.href.indexOf('?');
if (param_idx>0 &&  window.location.href.slice(window.location.href.indexOf('?')+1, window.location.href.indexOf('='))==="code") {
	code = window.location.href.slice(window.location.href.indexOf('?')+1, window.location.href.length);
	code = code.substring("code=".length);
	console.log("post req");
	$.ajax({
		"url": "https://api.soundcloud.com/oauth2/token?client_id="+client_id+"&client_secret="+client_s+"&redirect_uri=http://localhost:8000/favematic&grant_type=authorization_code&code="+code,
		"type": "POST",
		error: function(a,b,c) {
			console.log("error");
			console.log(JSON.stringify(a));
		},
		success: function(a,b,c) {
			if (typeof(a)==="string") {
				a = jQuery.parseJSON(a);
			}
			token = a.access_token;
			SC.accessToken(token);
			console.log(token);
			$.ajax({
				"type": "GET",
				"dataType": "JSON",
				"url": "https://api.soundcloud.com/me?oauth_token="+token,
				success: function(me, type, xhr) {
					curUserId = me.id;
					$("#login_msg").hide();
					$("#next").show();
					$("#playlist").show();
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
		section.remove();
	});
	$(document).bind("soundcloud:onPlayerReady", function(player, data) {
		console.log("player ready", player, data);
		var section = getSectionFromPlayer(player);
		$("#"+section.attr("id")+" > img.spinner").hide();
		if (section.parent().children(".track").first().attr("id")===section.attr("id")) {	//if player is first player
			soundcloud.getPlayer(player.target.name).api_play();
		}
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
		if (!(number=== (offset*max_tracks)-1)) { 
			//we're not finished
			soundcloud.getPlayer("track"+number).api_seekTo(0); //rewind
			soundcloud.getPlayer("track"+$("#section"+number).next().attr("id").substring("section".length)).api_play();
		}
		else {
			next(); //switch page
		}
	});
}

$(document).ready(function() {
	$("#login").click(function() {
		if (!SC.isConnected())
			window.location.href="https://soundcloud.com/connect?client_id=2becb25e8c48f8204593eb4df44c037f&response_type=code&redirect_uri=http://localhost:8000/favematic";
		else {
			SC.disconnect();
			$("#login_msg").show();
			code=null;
			token=null;
			offset = 0;
			curUserId = null;
			$("#playlist > .track").remove();
			$("#next_playlist > .track").remove();
			favorites = new Array();
			$("#connect").show();
			$("#disconnect").hide();
		}
	});
	$("#next").click(function() {
		next();
	})
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
		url: 'https://api.soundcloud.com/users/'+curUserId+'/followings.json?client_id='+client_id,
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
			url: 'https://api.soundcloud.com/users/'+followerid+'/favorites.json?client_id='+client_id,
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
					initPlaylists();
			},
			error: function(xhr, textStatus, errorThrown) {
				console.log('error', xhr, textStatus, errorThrown);
				followcount--;
				if (followcount<=0)
					initPlaylists();
			}
		});
	});
}
function initPlaylists() {
	$("#playlist").show();
	shuffle(favorites);	//shuffle favorites
	createPlaylist($("#playlist"));	
	offset++;	 // is now 1
	createPlaylist($("#next_playlist"));
}

function createPlaylist(div) {
	$("#"+div.attr("id")+" > .track").remove(); //empty div
	$("#"+div.attr("id")+" > .spinner").show();
	var current_favs = favorites.slice(offset*max_tracks,Math.min((offset+1)*max_tracks, favorites.length)); //get current slice
	$(current_favs).each(function (idx, fav) {	//add tracks to div
		div.append(playerTemplate(fav, offset*max_tracks+idx));
	});
	$("#"+div.attr("id")+" > .spinner").hide();	//hide spinner
}

function next() {
	//check which playlist is active
	var div1, div2;
	if (offset%2===0) {
		div2 = $("#playlist");
		div1 = $("#next_playlist");
	}
	else {
		//first is active
		div1 = $("#playlist");
		div2 = $("#next_playlist");
	}
	div2.css("left", "500px");
	div1.fadeOut(500, function() {
		div2.show();
		div2.animate({
			left: "0px"
		}, 500);
		offset++;
		createPlaylist(div1);
	});
	
}

function playerTemplate(track, idx){
	var playerHTML = '<object id="track'+idx+'" height="83.5em" width="100%" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">  <param name="movie" value="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"></param>  <param name="allowscriptaccess" value="always"></param>  <embed     src="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"&allowscriptaccess="always" height="83.5em" type="application/x-shockwave-flash" width="100%" name="track'+idx+'"></embed></object>';
	var spinner = "<img src='images/spinner.gif' class='spinner'/>"
	var div = "<div id='section"+idx+"' class='track'><p class='track_description'>"+track.title+"</p><p>faved by "+track.fav_of+"</p><br/>"+spinner+" "+playerHTML+"</div>";
	return div;
}
