var PLModel = {
	//settings
	favorites: new Array(),
	user: null,
	offset: 0,
	clientID: "2becb25e8c48f8204593eb4df44c037f",
	clientSecret: "c390106e460ae397444126c8c77a0213",
	redirectURI: "http://localhost:8000/favematic",
	token: null,
	//methods
	init: function() {
		SC.initialize({
			client_id: this.clientID
		});
	},
	shuffle: function(sourceArray) {
		for (var n = 0; n < sourceArray.length - 1; n++) {
			var k = n + Math.floor(Math.random() * (sourceArray.length - n));

			var temp = sourceArray[k];
			sourceArray[k] = sourceArray[n];
			sourceArray[n] = temp;
		}
	},
	getConnectionURL: function() {
		return "https://soundcloud.com/connect?client_id="+this.clientID+"&response_type=code&redirect_uri="+this.redirectURI;
	},
	//connect user
	connect: function(user) {
		this.user = user;
		this.collectFavorites();
	},
	disconnect: function() {
		
	},
	//check if user exists
	checkUser: function (user, callback) {
		var scope = this;
		SC.get("/users/"+user, function (usr) {
			if (usr.errors) {
				$(scope).trigger("error_username");
			}
			else
				callback(user);
		});
	},
	//collect favorites from connected user
	collectFavorites: function() {
		var scope = this;
		console.log("collecting");
		scope.favorites = new Array();
		
		SC.get("/users/"+this.user+"/followings", function(followings) {
			var followcount = followings.length;
			$(followings).each(function(idx, usr) {
				SC.get("/users/"+usr.id+"/favorites", function(favs) {
					$(favs).each(function(fidx, fav) {
						fav.fav_of = usr.username;
						fav.fav_of_url = usr.permalink_url;
						scope.favorites.push(fav);
					});
					if (idx===followcount-1) {
						//last following processed
						scope.shuffle(scope.favorites);
						$(scope).trigger("collected");
					}
				});
			});
		});
	},
	//pull some tracks
	getFavorites: function(howmany) {
		var ret = this.favorites.slice(this.offset, this.offset+howmany);
		this.offset += howmany;
		return ret;
	}
};