/*

	Extension Editor for XKit 7
	Version 1.0
	
	(c) 2011 - 2013 STUDIOXENIX
	
*/

(function($) {
    function pasteIntoInput(el, text) {
        el.focus();
        var val = el.value;
        if (typeof el.selectionStart == "number") {
            var selStart = el.selectionStart;
            el.value = val.slice(0, selStart) + text + val.slice(el.selectionEnd);
            el.selectionEnd = el.selectionStart = selStart + text.length;
        } else if (typeof document.selection != "undefined") {
            var textRange = document.selection.createRange();
            textRange.text = text;
            textRange.collapse(false);
            textRange.select();
        }
    }

    function allowTabChar(el) {
        $(el).keydown(function(e) {
            if (e.which == 9) {
                pasteIntoInput(this, "\t");
                return false;
            }
        });

        // For Opera, which only allows suppression of keypress events, not keydown
        $(el).keypress(function(e) {
            if (e.which == 9) {
                return false;
            }
        });
    }

    $.fn.allowTabChar = function() {
        if (this.jquery) {
            this.each(function() {
                if (this.nodeType == 1) {
                    var nodeName = this.nodeName.toLowerCase();
                    if (nodeName == "textarea" || (nodeName == "input" && this.type == "text")) {
                        allowTabChar(this);
                    }
                }
            })
        }
        return this;
    }
})(jQuery);

(function(){
if (typeof XKit.extensions.xkit_editor !== "undefined") { return; }
XKit.extensions.xkit_editor = new Object({

	filename: "",
	run: function() {
		XKit.extensions.xkit_editor.filename = "";
		document.title = "XKit Extension Editor";
		extension_editor_run();
	}
	
});
}());

function extension_editor_run() {

	var m_html =	"<div id=\"xkit-editor-sidebar\">" +
						"<div id=\"xkit-editor-open-file\" class=\"no-file\">No file opened</div>" +
						"<div id=\"xkit-editor-new\" class=\"xkit-button block\">New Extension</div>" +
						"<div id=\"xkit-editor-open\" class=\"xkit-button block\">Open Extension</div>" +
						"<div id=\"xkit-editor-save\" class=\"xkit-button disabled block\">Save</div>" +
						"<div id=\"xkit-editor-delete\" class=\"xkit-button disabled block\">Delete</div>" +
						"<div id=\"xkit-editor-update\" class=\"xkit-button disabled block\" style=\"display: none !important;\">Update from XKit Servers</div>" +
					"</div>" + 
					"<div id=\"xkit-editor-area\">" +
						"<div id=\"xkit-editor-tabs\">" +
							"<div id=\"xkit-editor-switch-to-script\" class=\"selected\">Script</div>" +
							"<div id=\"xkit-editor-switch-to-css\" class=\"\">Stylesheet</div>" +
							"<div id=\"xkit-editor-switch-to-icon\" class=\"\">Icon</div>" +
							"<div id=\"xkit-editor-switch-to-object\" class=\"\">JSON</div>" +
						"</div>" +
						"<textarea id=\"xkit-editor-textarea\"></textarea>" +
						"<textarea id=\"xkit-editor-textarea-object\"></textarea>" +
						"<textarea id=\"xkit-editor-textarea-css\"></textarea>" +
						"<textarea id=\"xkit-editor-textarea-icon\"></textarea>" +
					"</div>";
	$("body").append(m_html);
	$("#xkit-editor-textarea").allowTabChar();
	$("#xkit-editor-textarea-object").allowTabChar();
	$("#xkit-editor-textarea-css").allowTabChar();
	extension_editor_update_filename("");
	extension_editor_resize();
	$(window).resize(function() {
		extension_editor_resize();
	});
	
	$("#xkit-editor-switch-to-script").click(function() {
		$("#xkit-editor-tabs > div").not(this).removeClass("selected");
		$(this).addClass("selected");
		$("#xkit-editor-textarea").css("display","block");
		$("#xkit-editor-textarea-object").css("display","none");
		$("#xkit-editor-textarea-css").css("display","none");
		$("#xkit-editor-textarea-icon").css("display","none");
	});
	
	$("#xkit-editor-switch-to-object").click(function() {
		$("#xkit-editor-tabs > div").not(this).removeClass("selected");
		$(this).addClass("selected");
		$("#xkit-editor-textarea").css("display","none");
		$("#xkit-editor-textarea-object").css("display","block");
		$("#xkit-editor-textarea-css").css("display","none");
		$("#xkit-editor-textarea-icon").css("display","none");
	});
	
	$("#xkit-editor-switch-to-icon").click(function() {
		$("#xkit-editor-tabs > div").not(this).removeClass("selected");
		$(this).addClass("selected");
		$("#xkit-editor-textarea").css("display","none");
		$("#xkit-editor-textarea-object").css("display","none");
		$("#xkit-editor-textarea-css").css("display","none");
		$("#xkit-editor-textarea-icon").css("display","block");
	});
	
	$("#xkit-editor-switch-to-css").click(function() {
		$("#xkit-editor-tabs > div").not(this).removeClass("selected");
		$(this).addClass("selected");
		$("#xkit-editor-textarea").css("display","none");
		$("#xkit-editor-textarea-object").css("display","css");
		$("#xkit-editor-textarea-css").css("display","block");
		$("#xkit-editor-textarea-icon").css("display","none");
	});
	
	$("#xkit-editor-switch-to-script").trigger('click');
	
	$("#xkit-editor-new").click(function() {
		
		XKit.window.show("Create extension","<input type=\"text\" id=\"xkit-editor-filename\" placeholder=\"Filename (eg: my_extension)\"><br/>No spaces or special characters.","question","<div id=\"xkit-editor-create-extension\" class=\"xkit-button default\">OK</div><div id=\"xkit-close-message\" class=\"xkit-button\">Cancel</div>");
	
		$("#xkit-editor-create-extension").click(function() {
		
			var new_filename = $("#xkit-editor-filename").val();
			if (new_filename === "" || new_filename.indexOf(" ") !== -1) {
				XKit.window.show("Create extension failed","Invalid or blank filename","error","<div id=\"xkit-close-message\" class=\"xkit-button\">OK</div>");
				return;
			}
			
			if (XKit.installed.check(new_filename) === true) {
				XKit.window.show("Create extension failed","Filename already exists.","error","<div id=\"xkit-close-message\" class=\"xkit-button\">OK</div>");
				return;
			}
			
			var default_script = 	"//* TITLE " + new_filename + " **//\n" +
									"//* VERSION 1.0 REV A **//\n" +
									"//* DESCRIPTION  **//\n" +
									"//* DEVELOPER STUDIOXENIX **//\n" +
									"//* FRAME false **//\n" +
									"//* BETA false **//\n" +
									"\nXKit.extensions." + new_filename + " = new Object({\n" +
									"\n" +
									"\trunning: false,\n" +
									"\n" +
									"\trun: function() {\n" +
									"\t\tthis.running = true;\n" +
									"\t},\n" +
									"\n" +
									"\tdestroy: function() {\n" +
									"\t\tthis.running = false;\n" +
									"\t}\n" +
									"\n" +
									"});";
			
			var m_object = new Object();
			m_object.id = new_filename;
			m_object.title = "";
			m_object.css = "";
			m_object.script = default_script;
			m_object.icon = "";
			m_object.description = "";
			m_object.developer = "";
			m_object.version = "";
			m_object.errors = false;
			m_object.beta = false;
			m_object.frame = false;

			var m_result = XKit.tools.set_setting("extension_" + m_object.id, JSON.stringify(m_object));
			if (m_result.errors === false) {
				// Saved data without any errors!
				XKit.installed.add(m_object.id);
				extension_editor_load_extension(m_object.id);
				XKit.window.close();
			} else {
				// Something awful has happened.
				XKit.window.show("Create extension failed","Unable to store data.","error","<div id=\"xkit-close-message\" class=\"xkit-button\">OK</div>");
			}
		
		});
	
	});
	
	$("#xkit-editor-open").click(function() {
	
		var m_exts_list = "<div class=\"xkit-file-selector\">";
		
		var extensions = XKit.installed.list();
		for (i=0;i<extensions.length;i++) {
			m_exts_list = m_exts_list + "<div class=\"xkit-button block xkit-editor-open-file\" data-filename=\"" + extensions[i] + "\">" + extensions[i] + "</div>";
		}
		
		m_exts_list = m_exts_list + "</div>";
	
		XKit.window.show("Open Extension...",m_exts_list,"question","<div id=\"xkit-close-message\" class=\"xkit-button\">Cancel</div>");
	
		$(".xkit-editor-open-file").click(function() {
			extension_editor_load_extension($(this).attr('data-filename'));
			XKit.window.close();
		});
	
	});
	
	$("#xkit-editor-save").click(function() {
		if ($(this).hasClass("disabled") === true) { return; }
		if (XKit.extensions.xkit_editor.filename === "") { return; }
		
		var m_object = XKit.installed.get(XKit.extensions.xkit_editor.filename);
		extension_editor_update_object(m_object);
	
	});
	
	$("#xkit-editor-delete").click(function() {
		if ($(this).hasClass("disabled") === true) { return; }
		if (XKit.extensions.xkit_editor.filename === "") { return; }
		
		XKit.window.show("Delete extension?", "Really to delete the extension '" + XKit.extensions.xkit_editor.filename + "'?<br/>You can not undo this action.","question","<div id=\"xkit-editor-delete-extension\" class=\"xkit-button default\">Delete</div><div id=\"xkit-close-message\" class=\"xkit-button\">Cancel</div>");
		
		$("#xkit-editor-delete-extension").click(function() {
			XKit.installed.remove(XKit.extensions.xkit_editor.filename);
			extension_editor_close_file();
			XKit.window.close();
		});
	
	});

}

function extension_editor_load_extension(extension_id) {

	var m_extension = XKit.installed.get(extension_id);
	extension_editor_update_filename(extension_id);
	$("#xkit-editor-textarea").val(m_extension.script);
	$("#xkit-editor-textarea-icon").val(m_extension.icon);
	$("#xkit-editor-textarea-css").val(m_extension.css);
	$("#xkit-editor-textarea-object").val(JSON.stringify(m_extension));
	$("#xkit-editor-switch-to-script").trigger('click');
	
}

function extension_editor_update_object(m_object) {

	// Check for title, description, developer, version etc. data
	// here and update the object if neccessary.
	
	m_object.script = $("#xkit-editor-textarea").val();
	
	var version = extension_editor_legacy_get_attribute(m_object.script, "version");
	if (version === "") {
		XKit.window.show("Can't save file","Required VERSION attribute not found.<br/>Consult XKit Developer Documentation.","error","<div id=\"xkit-close-message\" class=\"xkit-button default\">OK</div>");
		return;
	} else {
		m_object.version = version;
	}
	
	m_object.title = extension_editor_legacy_get_attribute(m_object.script, "title");
	m_object.description = extension_editor_legacy_get_attribute(m_object.script, "description");
	m_object.developer = extension_editor_legacy_get_attribute(m_object.script, "developer");
	if (extension_editor_legacy_get_attribute(m_object.script, "frame").toLowerCase() === "true") {
		m_object.frame = true;
	} else {
		m_object.frame = false;	
	}
	if (extension_editor_legacy_get_attribute(m_object.script, "beta").toLowerCase() === "true") {
		m_object.beta = true;
	} else {
		m_object.beta = false;	
	}
	m_object.details = extension_editor_legacy_get_attribute(m_object.script, "details");
	
	m_object.icon = $("#xkit-editor-textarea-icon").val();
	m_object.css = $("#xkit-editor-textarea-css").val();
	
	m_object.errors = false;

	// Update this area too.
	$("#xkit-editor-textarea-object").val(JSON.stringify(m_object));
	
	XKit.installed.update(XKit.extensions.xkit_editor.filename, m_object);
	XKit.notifications.add("Extension " + XKit.extensions.xkit_editor.filename + " saved successfully.");

}

function extension_editor_legacy_get_attribute(text, info_needed) {

	try {
	
		var tempdata = text;
		info_needed = info_needed.toUpperCase();
		var inf_string = "/* " + info_needed + " ";
		if (typeof tempdata === "undefined") {
			return "";
		}
		var str_start = tempdata.indexOf(inf_string);
		if (str_start === -1) { return ""; }
		var str_end = tempdata.indexOf("**/", str_start);
		if (str_end === -1) { return ""; }
		return tempdata.substring(str_start + (inf_string.length), str_end - 1);
		
	} catch(e) {
	
		return "";
	
	}

}

function extension_editor_update_filename(filename) {

	XKit.extensions.xkit_editor.filename = filename;
	
	if (filename !== "") {
		document.title = filename + " - XKit Extension Editor";
		$("#xkit-editor-open-file").html(filename);
		$("#xkit-editor-open-file").removeClass("no-file");
		$("#xkit-editor-attributes").removeClass("disabled");
		$("#xkit-editor-save").removeClass("disabled");
		$("#xkit-editor-delete").removeClass("disabled");
		$("#xkit-editor-update").removeClass("disabled");
	} else {
		document.title = "XKit Extension Editor";
		$("#xkit-editor-open-file").html("No file opened");
		$("#xkit-editor-open-file").addClass("no-file");
		$("#xkit-editor-attributes").addClass("disabled");
		$("#xkit-editor-save").addClass("disabled");
		$("#xkit-editor-delete").addClass("disabled");
		$("#xkit-editor-update").addClass("disabled");
	}

}

function extension_editor_close_file() {

	extension_editor_update_filename("");
	$("#xkit-editor-textarea").val("");
	$("#xkit-editor-textarea-icon").val("");
	$("#xkit-editor-textarea-css").val("");
	$("#xkit-editor-textarea-object").val("");
	$("#xkit-editor-switch-to-script").trigger('click');
	
}

function extension_editor_resize() {

	var new_width = $(window).width() - 200;
	$("#xkit-editor-area").css("width", new_width + "px");
	$("#xkit-editor-textarea").css("width", new_width + "px");
	$("#xkit-editor-textarea-icon").css("width", new_width + "px");
	$("#xkit-editor-textarea-script").css("width", new_width + "px");
	$("#xkit-editor-textarea-object").css("width", new_width + "px");
	$("#xkit-editor-textarea-css").css("width", new_width + "px");
	
	var new_height = $(window).height() - 40;
	$("#xkit-editor-area").css("height", new_height + "px");
	$("#xkit-editor-textarea").css("height", new_height + "px");
	$("#xkit-editor-textarea-icon").css("height", new_height + "px");
	$("#xkit-editor-textarea-script").css("height", new_height + "px");
	$("#xkit-editor-textarea-object").css("height", new_height + "px");
	$("#xkit-editor-textarea-css").css("height", new_height + "px");
}