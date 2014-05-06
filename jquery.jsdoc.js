/**
 * Wrapper for doctrine.
 * @see https://github.com/Constellation/doctrine
 */
(function($){


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
 * Parse comments
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
 * @example $.jsdoc.asyncParse.file($('input[type="file"]').prop("files")[0])
 * 
 * @method $.jsdoc.asyncParse.file
 * @param {URL|File} file
 * @param {Object} options
 * @param {Boolean} catchErr
 * @returns {$.Deferred}
 */
var asyncParseFile = jsdoc.asyncParse.file = function (file, options, catchErr) {
	return (
		($.blob && $.blob.readAsText && file instanceof File) 
		? $.blob.readAsText(file, {async:true})
		: $.ajax({
			url: file,
			dataType: "text"
		})
	).then(function(code){
		var comments = $.jsdoc.parse.comments(code, options, catchErr);
		return {
			file: (
				file instanceof File
				? file.name
				: file
			),
			comments: comments
		};
	});
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


}(jQuery));