/**
 * Wrapper for doctrine.
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @see https://github.com/Constellation/doctrine
 * @requires jquery
 * @requires doctrine
 * @requires jquery.blob
 * @module jquery.jsdoc
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as a module depending on jQuery.
	define("jquery.jsdoc",["jquery","doctrine","jquery.blob"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function($){
	"use strict";
	
	var unindent = function (content) {
		var indent = content.match(/^(\s+\*?)/);
		if (indent) {
			content = content.replace(new RegExp('^' + indent[1], 'gm'), '');
		}
		return content;
	};
	
	var jsdoc = {
		parse: {},
		asyncParse: {}
	};
	
	/**
	 * Parse comment
	 * 
	 * @example $.jsdoc.parse.comment('@method foo\n@param {String} bar\n@returns {Boolean}');
	 * 
	 * @method $.jsdoc.parse.comment
	 * @param {String} code
	 * @param {Object} options
	 * @returns {Object}
	 */
	var parseComment = jsdoc.parse.comment = function (comment, options, catchErr) {
		comment = comment.replace(/^\s*\*/gm,"");	// remove leading spaces + "*";
		comment = unindent(comment);				// remove space padding
		
		if (!catchErr) return doctrine.parse(comment, options);
		try {
			return doctrine.parse(comment, options);
		} catch (err) {
			return {error: err};
		}
	};
	
	/**
	 * Parse comments
	 * Returns an array of parsed comments with the "lineNumber" number included.
	 *
	 * @method $.jsdoc.parse.comments
	 * @param {String} code
	 * @param {Object} options
	 * @returns {Array.<Object.<{lineNumber:Integer,comments:Array}>>}
	 */
	var parseComments = jsdoc.parse.comments = function (code, options, catchErr) {
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
				
				comments.push(
					$.extend(
						{lineNumber:linenum},
						parseComment(commentlines.join("\n"), options, catchErr)
					)
				);
			}
		}
		return comments;
	};
	
	/**
	 * Parse a file accessible via URL or defined by File instance.
	 * @example $.jsdoc.asyncParse.file("./jquery.jsdoc.js");
	 * @example $.jsdoc.asyncParse.file(new Blob(["/**\n@file dummy\n*"+"/"]))
	 * 
	 * @method $.jsdoc.asyncParse.file
	 * @param {URL|File} file
	 * @param {Object} options
	 * @param {Boolean} catchErr
	 * @returns {$.Deferred}
	 */
	var asyncParseFile = jsdoc.asyncParse.file = function (file, options, catchErr) {
		if ($.blob && $.blob.is(file)) {
			return $.blob.readAsText(file, {async:true}).then(function(code){
				return {
					comments:$.jsdoc.parse.comments(code, options, catchErr),
					file: file.name || file + " " + $.blob.size(file,true)
				};
			})
		} else {
			return $.ajax({
				url: file,
				dataType: "text"
			}).then(function(code){
				return {
					comments:$.jsdoc.parse.comments(code, options, catchErr),
					file: file
				}
			}, function(o){return ("status" in o) ? o.status + ": " + o.statusText : o;});
		}
	};
	
	/**
	 * @method $.jsdoc.asyncParse.files
	 * @param {Array} files
	 * @param {Object} options
	 * @param {Boolean} catchErr
	 * @returns {$.Deferred}
	 */
	jsdoc.asyncParse.files = function (files, options, catchErr) {
		var getters = [];
		
		$.each(files, function(i,file){
			getters.push(
				asyncParseFile(file, options, catchErr)
			);
		});
		
		return $.when.apply($.when, getters).then(function(){
			return $.makeArray(arguments);
		});
	};
	
	$.jsdoc = jsdoc;
}));