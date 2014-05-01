/*
Heavily adapted from: https://raw.githubusercontent.com/yui/yuidoc/master/lib/docparser.js

Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/
(function($){

var unindent = function (content) {
	var indent = content.match(/^(\s+)/);
	if (indent) {
		content = content.replace(new RegExp('^' + indent[1], 'gm'), '');
	}
	return content;
};

/* WIP
var process = {
	"private":

};
*/


var yuidoc = {
	parseComment: function (commment, file, line) {
		var lines = commment.split(/\r\n|\n/),
			i, len = lines.length,
			line;
		
		for (i = 0; i < len; i++) {
			lines[i] = lines[i].replace(/^\s*\*/,"")
		}
		
		var comment = unindent(lines.join("\n"));
		
		var parts = comment.split(/(?:^|\n)\s*(@\w*)/),
			part, tag, value, peek, skip,
			results = [
				{
					tag: 'file',
					value: file
				},
				{
					tag: 'line',
					value: line
				}
			];
		len = parts.length
		
		for (i = 0; i < len; i++) {
			value = '';
			part = parts[i];
			if (part === '') {
				continue;
			}
			skip = false;
			
			// the first token may be the description, otherwise it should be a tag
			if (i === 0 && part.substr(0, 1) !== '@') {
				if (part) {
					tag = '@description';
					value = part;
				} else {
					skip = true;
				}
			} else {
				tag = part;
				// lookahead for the tag value
				peek = parts[i + 1];
				if (peek) {
					value = peek;
					i++;
				}
			}
			
			if (!skip && tag) {
				results.push({
					tag: tag.substr(1).toLowerCase(),
					value: value
				});
			}
		}
		
		
		
		return results;
	},
	parseComments: function (code, file) {
		var lines = code.split(/\r\n|\n/),
			i, linenum, len = lines.length,
			line,
			commentlines,
			comments = [];
		
		for (i = 0; i < len; i++) {
			line = lines[i];
			if (/^\s*\/\*\*/.test(line)) {
				commentlines = [];
				linenum = i + 1;
				
				while (i < len && (!/\*\/\s*$/.test(line))) {
					commentlines.push(line);
					i++;
					line = lines[i];
				}
				
				commentlines.shift();
				comments.push(yuidoc.parseComment(commentlines.join("\n"), file, linenum));
			}
		}
		return comments;
	},
	parseFile: function (file) {
		return $.get(file).then(function(code){
			return yuidoc.parseComments(code, file);
		});
	},
	parseFiles: function() {
		var a = [];
		$.each(arguments, function(i,file){
			a.push(
				$.get(file).then(function(code){
					return {
						file: file,
						results: yuidoc.parseComments(code, file)
					};
				})
			);
		});
		return $.when.apply($.when,a).then(function(){
			var obj = {};
			$.each(arguments, function(key, value) {
				obj[value.file] = value.results;
			});
			return obj;
		});
	},
	
	
	processComments: function (comments) {
		var i, len = comments.length;
		for (i = 0; i < len; i++) {
			comments[i] = yuidoc.processComment(comments[i]);
		}
		return comments;
	},
	
	
	processComment: function (lines) {
		var comment = {},
			i, len = lines.length,
			line;
		
		for (i = 0; i < len; i++) {
			line = lines[i];
			switch (typeof(comment[line.tag])) {
				case "undefined":
					comment[line.tag] = line.value;
					break;
				case "string":
					comment[line.tag] = [comment[line.tag]];
				case "array":
					comment[line.tag].push(line.value);
			}
		}
		return comment;
	},
	
	
	processFiles: function() {
		var a = [];
		$.each(arguments, function(i,file){
			a.push(
				$.get(file).then(function(code){
					return {
						file: file,
						results: yuidoc.processComments(yuidoc.parseComments(code, file))
					};
				})
			);
		});
		return $.when.apply($.when,a).then(function(){
			var obj = {};
			$.each(arguments, function(key, value) {
				obj[value.file] = value.results;
			});
			return obj;
		});
	}
};

$.yuidoc = yuidoc.processFiles;
$.extend($.yuidoc, yuidoc)


}(jQuery));

/*


$.yuidoc("jquery.stream.js").then(function(){
    console.log(arguments);
})


*/