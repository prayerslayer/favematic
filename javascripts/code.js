  //TODO fav_of einbringen, schön layouten
  //TODO spinner bis player loaded, dann autostart
  //TODO player an baseline anpassen
  //TODO reload
  //TODO auf duplikate checken
  //TODO auf unabspielbarkeit checken, wenn es geht

var favorites = new Array();
var max_tracks = 10;
var curUserId = 'prayerslayer'; //me

//basic workflow
/*
  get followings of current user
  get favorites of those follwings, hold them in one array (favorites)
  shuffle favorites
  make soundcloud widgets of first 10
*/

$(document).ready(function() {
  $(document).bind('soundcloud:onMediaEnd', function(player, data) {
    var player_id = player.target.name;
    var number = parseInt(player_id.slice(5,player_id.length));
    if (!(number=== max_tracks-1)) { 
      //we're not finished
      var next = number++;
      soundcloud.getPlayer("track"+next+"").api_play();
    }
  });
  getUserFollowings(curUserId);

});

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
        if (followcount<=0) {
          //TODO remove duplicates
          shuffle(favorites);
          favorites = favorites.slice(0,Math.min(max_tracks, favorites.length));
          $(favorites).each(function(idx, fav) {
            $("#playlist").append(playerTemplate(fav, idx));
          });

          $("#spinner").hide();
          console.log("playlist ready");
        }
      },
      error: function(xhr, textStatus, errorThrown) {
        //console.log('error', xhr, textStatus, errorThrown);
      }
    });
  });
}

function playerTemplate(track, idx){
  var playerHTML = '<object id="track'+idx+'" height="83.5em" width="100%">  <param name="movie" value="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&download=false&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"></param>  <param name="allowscriptaccess" value="always"></param>  <embed     src="http://player.soundcloud.com/player.swf?object_id=track'+idx+'&enable_api=true&download=false&buying=false&color=000000&show_comments=false&show_user=true&url='+track.permalink_url+'"&allowscriptaccess="always" height="83.5em" type="application/x-shockwave-flash" width="100%" name="track'+idx+'"></embed></object>';
  var div = "<section class='column width2'><p class='track_description'>"+track.title+"</p><p>faved by "+track.fav_of+"</p><br/>"+playerHTML+"</section>";
  return div;
}