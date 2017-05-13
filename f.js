module.exports = {
/*
Takes the field address of some desired value, and either returns it, or returns undefined if the field or a parent doesn't exist
[Game,'creeps',[Memory, 'f_name']] => is defined: Game['creeps'][Memory['f_name']]
*/
get: function(list) {
	if (arguments.length !== 1){
		message = "Function takes exactly one argument! Did you forget to make it a list?"
		console.log(message);
		throw message;
	}
	if (typeof list !== 'object')
		return list // Not actually a list, but a primitive of some sort
	if (list.length === 0)
		return undefined

	var val = list[0]
	for (var i = 1; i < list.length; i++) {
		if (val === undefined || val === null || typeof val !== 'object')
			return undefined //Won't be able to fetch a subvalue of this thing, so call it off before we fail
		var sub_val = this.get(list[i])
		if (sub_val === undefined)
			return undefined
		val = val[sub_val.toString()]
	}
	return val
},

//TODO finish
get_energy: function(structure){
	if (! structure)
		return 0
	if ( [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL].includes(structure.structureType) ) {
		return structure.store.energy
	} else if (structure.structureType === STRUCTURE_LINK) {
		return structure.energy
	} else if ( this.get([structure, 'carry', 'energy']) !== undefined){
		//It's actually a creep :)
		return structure.carry.energy
	}
	return 0
},

replace_ticks: function(creep){
    return creep.body.length * CREEP_SPAWN_TIME
},

imminent_death: function(creep){
    return creep.ticksToLive <= this.replace_ticks(creep)
}

};
