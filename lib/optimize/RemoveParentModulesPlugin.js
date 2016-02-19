/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function hasModule(chunk, module, checkedChunksMap, pushedChunksMap, identifier) {
	if(chunk.modules.indexOf(module) >= 0) return [chunk];
	if(chunk.entry) return false;
	return allHaveModule(chunk.parents.filter(function(c) {
		return checkedChunksMap[c.debugId] !== identifier;
	}), module, checkedChunksMap, pushedChunksMap, identifier);
}

function allHaveModule(someChunks, module, checkedChunksMap, pushedChunksMap, identifier) {
	var chunks = [];
	for(var i = 0; i < someChunks.length; i++) {
		checkedChunksMap[someChunks[i].debugId] = identifier;
		var subChunks = hasModule(someChunks[i], module, checkedChunksMap, pushedChunksMap, identifier);
		if(!subChunks) return false;
		addToSet(chunks, subChunks, pushedChunksMap, identifier);
	}
	return chunks;
}

function addToSet(set, items, pushedChunksMap, identifier) {
	items.forEach(function(item) {
		if(pushedChunksMap[item.debugId] !== identifier) {
			set.push(item);
			pushedChunksMap[item.debugId] = identifier;
		}
	});
}

function RemoveParentModulesPlugin() {}
module.exports = RemoveParentModulesPlugin;

RemoveParentModulesPlugin.prototype.apply = function(compiler) {
	compiler.plugin("compilation", function(compilation) {
		compilation.plugin(["optimize-chunks", "optimize-extracted-chunks"], function(chunks) {
			var identifier = 1,
				pushedChunksMap = {},
				checkedChunksMap = {};
			chunks.forEach(function(chunk) {
				chunk.modules.slice().forEach(function(module) {
					if(chunk.entry) return;
					var parentChunksWithModule = allHaveModule(chunk.parents, module, checkedChunksMap, pushedChunksMap, identifier++);
					if(parentChunksWithModule) {
						module.rewriteChunkInReasons(chunk, parentChunksWithModule);
						chunk.removeModule(module);
					}
				});
			});
		});
	});
};
