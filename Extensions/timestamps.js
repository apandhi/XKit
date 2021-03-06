//* TITLE Timestamps **//
//* VERSION 2.3 REV B **//
//* DESCRIPTION See when a post has been made. **//
//* DETAILS This extension lets you see when a post was made, in full date or relative time (eg: 5 minutes ago). It also works on asks, and you can format your timestamps. **//
//* DEVELOPER STUDIOXENIX **//
//* FRAME false **//
//* BETA false **//
//* SLOW true **//

XKit.extensions.timestamps = new Object({

	running: false,
	slow: true,

	preferences: {
		only_relative: {
			text: "Only show relative time (eg: 5 minutes ago)",
			default: false,
			value: false
		},
		only_inbox: {
			text: "Only show timestamps on asks in my inbox",
			default: false,
			value: false
		},
		sep0: {
			text: "Timestamp display format",
			type: "separator"	
		},
		format: {
			text: "Timestamp format (<a id=\"xkit-timestamps-format-help\" href=\"#\" onclick=\"return false\">what is this?</a>)",
			type: "text",
			default: "MMMM Do YYYY, h:mm:ss a",
			value: "MMMM Do YYYY, h:mm:ss a"	
		}
	},
	
	check_quota: function() {
	
		if (XKit.storage.quota("timestamps") <= 2000) {
			XKit.storage.clear("timestamps");
			if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
				XKit.storage.set("timestamps", "extension__setting__only_relative", "true");
			}
			if (XKit.extensions.timestamps.preferences.format.value !== "") {
				XKit.storage.set("timestamps", "extension__setting__format", XKit.extensions.timestamps.preferences.format.value);
			}
		}	
		
	},

	in_search: false,

	run: function() {

		XKit.tools.init_css("timestamps");
		
		if (document.location.href.indexOf('/search/') !== -1) { 
			XKit.extensions.timestamps.in_search = true; 
			XKit.tools.add_css('.xtimestamp { position: absolute; top: 43px; color: white; font-size: 12px; left: 0; }', "timestamps_search");
		}
		
		if (XKit.extensions.timestamps.preferences.only_inbox.value === true) {
			if (XKit.interface.where().inbox !== true) { return; }	
		}
		
		if (XKit.extensions.timestamps.preferences.format.value === "") {
			alert("empty, restoring default");
			XKit.extensions.timestamps.preferences.format.value = "MMMM Do YYYY, h:mm:ss a";
		}

		XKit.extensions.timestamps.check_quota();
		try {

			if (XKit.extensions.timestamps.is_compatible() === true) {
				XKit.tools.add_css('#posts .post .post_content { padding-top: 0px; }', "timestamps");
				XKit.post_listener.add("timestamps", XKit.extensions.timestamps.add_timestamps);
				XKit.extensions.timestamps.add_timestamps();
				
				$(document).on("click",".xkit-timestamp-failed-why", function() {
					XKit.window.show("Timestamp loading failed.", "This might be caused by several reasons, such as the post being removed, becoming private, or the Tumblr server having a problem that it can't return the page required by XKit to load you the timestamp.", "error", "<div id=\"xkit-close-message\" class=\"xkit-button\">OK</div></div>");
				});
			} else {
				XKit.console.add("Won't run timestamps, not compatible.");	
			}
		
		} catch(e) {
		
			show_error_script("Timestamps: " + e.message);
			
		}
		
	
	},
	
	is_compatible: function() {
	
		if (XKit.interface.where().queue === true || XKit.interface.where().drafts === true) {
			return false;
		}
		return true;
		
	},
	
	fetch_note_fan_mail: function(obj) {
		
		var m_id = $(obj).attr('data-post-id');	
		
		if ($(obj).find(".xkit-fan-timestamp").length > 0) {return; }
		
		var form_key = $("body").attr('data-form-key');

		var m_object = new Object();
		
		m_object.post_id = parseInt(m_id);
		m_object.form_key = form_key;
		m_object.post_type = false;
		
		$(obj).find(".message").addClass("with-xkit-timestamp");
		$(obj).find(".message_body").addClass("with-xkit-timestamp").prepend("<div class=\"xkit-fan-timestamp\">Loading</div>");
		
		var cached = XKit.storage.get("timestamps", "xkit_timestamp_cache_fanmail_" + m_id, "");
		
		if (cached === "") {

			GM_xmlhttpRequest({
				method: "POST",
				url: "http://www.tumblr.com/svc/post/fetch",
				data: JSON.stringify(m_object),
				json: true,
				onerror: function(response) {
					console.log("Unable to load timestamp - Err 01");
					XKit.extensions.timestamps.show_failed(obj);
				},
				onload: function(response) {
					// We are done!
					try {
						var mdata = $.parseJSON(response.responseText);
						console.log(mdata);
					} catch(e) {
						console.log("Unable to load timestamp - Err 02 : Not JSON");
						XKit.extensions.timestamps.show_failed(obj);
						return;
					}
					//$(obj).html(mdata.post.date);
					
					// Tumblr format: Jun 16th, 2013 12:42pm
					
					var dtx = moment(mdata.post.date, "MMM DD, YYYY hh:mma");
					var nowdate = new Date();
					var nowdatem = moment(nowdate);
					var dt = moment(dtx);
					
					if (dtx.isValid() === true) {
					
						if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    							$(obj).find(".xkit-fan-timestamp").html(dt.from(nowdatem));
						} else {
							$(obj).find(".xkit-fan-timestamp").html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
						}
				
					} else {
				
						$(obj).find(".xkit-fan-timestamp").html(mdata.post.date);
				
					}
					
					$(obj).find(".xkit-fan-timestamp").removeClass('xtimestamp_loading');
					XKit.storage.set("timestamps", "xkit_timestamp_cache_fanmail_" + m_id, mdata.post.date);

				}
			});
			
		} else {
			
			var dtx = moment(cached, "MMM DD, YYYY hh:mma");
			var nowdate = new Date();
			var nowdatem = moment(nowdate);
			var dt = moment(dtx);
			
			if (dtx.isValid() === true) {
				
				if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    					$(obj).find(".xkit-fan-timestamp").html(dt.from(nowdatem));
				} else {
					$(obj).find(".xkit-fan-timestamp").html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
				}
				
			} else {
				
				$(obj).find(".xkit-fan-timestamp").html(cached);
				
			}
			
			$(obj).find(".xkit-fan-timestamp").removeClass('xtimestamp_loading');
			
		}
		
	},
	
	add_timestamps: function() {

		if ($(".post").length === 0) {
			XKit.console.add("Stopping Timestamps, no posts.");
			return;
		}
		
		XKit.extensions.timestamps.check_quota();
	
		$(".post").not(".xkit_timestamps").each(function() {
		
			try { 
				
				if ($(this).hasClass("fan_mail") === true) {
					
					XKit.extensions.timestamps.fetch_note_fan_mail($(this));
					return;
					
				}
			
				$(this).addClass("xkit_timestamps");
				if ($(this).attr('id') === "new_post" || $(this).hasClass("fan_mail") === true || 
					$(this).find('.private_label').length > 0  || $(this).hasClass("note") === true ||
					$(this).hasClass("submission") === true) {
					return;	
				}
				
				var post_id = $(this).attr('data-post-id');
				
				var get_json = true;
				
				if (XKit.interface.where().inbox !== true) {
					
					if ($(this).find('.permalink').length <= 0 && $(this).find(".post_permalink").length <= 0) { return; }
	
					var this_control_html = $(this).children('.post_controls').html();
					
					var permalink = $(this).find(".permalink").attr('href');
					if ($(this).find(".post_permalink").length > 0) {
						permalink = $(this).find(".post_permalink").attr('href');
					}

					// Ugly but it works?
					var json_page_parts = permalink.replace("http://","").split("/");
					var json_page = "http://" + json_page_parts[0] + "/api/read/json?id=" + post_id;
				
				}
			
				var m_html = '<div id="xkit_timestamp_' + post_id + '" class="xtimestamp xtimestamp_loading">&nbsp;</div>';
				
				if (XKit.extensions.timestamps.in_search !== true) {
					$(this).find(".post_content").prepend(m_html);
				} else {
					$(this).find(".post_controls_top").prepend(m_html);
				}
				
				var in_inbox = false;
				if (XKit.interface.where().inbox === true) {
					in_inbox = true;	
				}
				
				if ($(this).hasClass("is_note") === true && in_inbox === true) {
				
					var m_post_id = $(this).attr('data-post-id');
					XKit.extensions.timestamps.fetch_note($("#xkit_timestamp_" + post_id), post_id);
					
				} else {
			
					XKit.extensions.timestamps.fetch_timestamp($("#xkit_timestamp_" + post_id), json_page, post_id);
					
				}
			
			} catch(e) {
			
				console.log(e.message);
			
			}
		
		});
	
	},
	
	fetch_note: function(obj, post_id) {
		
		var form_key = $("body").attr('data-form-key');

		var m_object = new Object();
		
		m_object.post_id = parseInt(post_id);
		m_object.form_key = form_key;
		m_object.post_type = false;
		
		var cached = XKit.storage.get("timestamps", "xkit_timestamp_cache_" + post_id, "");
		
		if (cached === "") {

			GM_xmlhttpRequest({
				method: "POST",
				url: "http://www.tumblr.com/svc/post/fetch",
				data: JSON.stringify(m_object),
				json: true,
				onerror: function(response) {
					console.log("Unable to load timestamp - Err 01");
					XKit.extensions.timestamps.show_failed(obj);
				},
				onload: function(response) {
					// We are done!
					try {
						var mdata = $.parseJSON(response.responseText);
					} catch(e) {
						console.log("Unable to load timestamp - Err 02 : Not JSON");
						XKit.extensions.timestamps.show_failed(obj);
						return;
					}
					//$(obj).html(mdata.post.date);
					
					// Tumblr format: Jun 16th, 2013 12:42pm
					
					var dtx = moment(mdata.post.date, "MMM DD, YYYY hh:mma");
					var nowdate = new Date();
					var nowdatem = moment(nowdate);
					var dt = moment(dtx);
					
					if (dtx.isValid() === true) {
					
						if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    							$(obj).html(dt.from(nowdatem));
						} else {
							$(obj).html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
						}
				
					} else {
				
						$(obj).html(mdata.post.date);
				
					}
					
					$(obj).removeClass('xtimestamp_loading');
					XKit.storage.set("timestamps", "xkit_timestamp_cache_" + post_id, mdata.post.date);

				}
			});	
		
		} else {
		
			var dtx = moment(cached, "MMM DD, YYYY hh:mma");
			var nowdate = new Date();
			var nowdatem = moment(nowdate);
			var dt = moment(dtx);
			
			if (dtx.isValid() === true) {
				
				if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    					$(obj).html(dt.from(nowdatem));
				} else {
					$(obj).html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
				}
				
			} else {
				
				$(obj).html(cached);
				
			}
			
			$(obj).removeClass('xtimestamp_loading');	
			
		}
		
	},
	
	fetch_timestamp: function(obj, json_page, post_id) {
	
		var nowdate = new Date();
		var nowdatem = moment(nowdate);
	
		var cached = XKit.storage.get("timestamps", "xkit_timestamp_cache_" + post_id, "");
		
		if (cached !== "") {
		
			try {
		
				var dtx = new Date(cached * 1000);
				var nowdate = new Date();
				var nowdatem = moment(nowdate);
				var dt = moment(dtx);
					
				if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    					$(obj).html(dt.from(nowdatem));
				} else {
					$(obj).html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
				}

				// $(obj).html(dt.format('MMMM Do YYYY, h:mm:ss a') + " &middot; " + dt.from(nowdatem));
				$(obj).removeClass('xtimestamp_loading');
				
			} catch(e) {
				
				console.log("Unable to load timestamp - Err 03");
				XKit.extensions.timestamps.show_failed(obj);
			
			}
		
		} else {
	
		try {
			console.log(json_page);
			GM_xmlhttpRequest({
				method: "GET",
				dataType: "json",
				url: json_page,
				onload: function(response) {
					var rs = (response.responseText);
					var xs = rs.search('"unix-timestamp":');
					if (xs === -1) { console.log("Unable to load timestamp - Err 11"); XKit.extensions.timestamps.show_failed(obj); return; }
					var xe = rs.indexOf(',', xs + 17);
					if (xe === -1) { console.log("Unable to load timestamp - Err 12"); XKit.extensions.timestamps.show_failed(obj); return; }
					var xd = rs.substring(xs + 17, xe);
					var dtx = new Date(xd * 1000);
					var dt = moment(dtx);
					if (XKit.extensions.timestamps.preferences.only_relative.value === true) {
    						$(obj).html(dt.from(nowdatem));
					} else {
						$(obj).html(dt.format(XKit.extensions.timestamps.preferences.format.value) + " &middot; " + dt.from(nowdatem));
					}
					$(obj).removeClass('xtimestamp_loading');
					XKit.storage.set("timestamps", "xkit_timestamp_cache_" + post_id, xd);
				},
				onerror: function(response) {
					console.log("Unable to load timestamp - Err 22");
					XKit.extensions.timestamps.show_failed(obj);
				}
			});
		} catch(e) {
			alert(e.message);
		}
		
		}
	
	},
	
	show_failed: function(obj) {
	
		// Invalid file or change in format?
		$(obj).html("failed to load timestamp <div class=\"xkit-timestamp-failed-why\">why?</div>");
		$(obj).removeClass('xtimestamp_loading');
		return;	
	
	},
	
	cpanel: function() {
	
		$("#xkit-timestamps-format-help").click(function() {
		
			XKit.window.show("Timestamp formatting","Timestamps extension allows you to format the date by using a formatting syntax. Make your own and type it in the Timestamp Format box to customize your timestamps.<br/><br/>For information, please visit:<br/><a href=\"http://xkit.info/seven/support/timestamps/index.php\">Timestamp Format Documentation</a><br/><br/>Please be careful while customizing the format. Improper/invalid formatting can render Timestamps unusable. In that case, just delete the text you've entered completely and XKit will revert to its default formatting.","info","<div class=\"xkit-button default\" id=\"xkit-close-message\">OK</div>");
			
		});	
		
	},
	
	destroy: function() {
		$(".xtimestamp").remove();
		$(".xkit-fan-timestamp").remove();
		$("with-xkit-timestamp").removeClass("with-xkit-timestamp");
		$(".xkit_timestamps").removeClass("xkit_timestamps");
		XKit.tools.remove_css("timestamps");
		XKit.post_listener.remove("timestamps");
	}
	
});