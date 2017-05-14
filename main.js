var roles = require('roles')
var f = require('f')
var population = require('population')
var structures = require('structures')

module.exports.loop = function () {

    for (var name in Game.creeps){
        var c = Game.creeps[name];
        if (! c.spawning) {
            c.job = 'I was given no job.'

            //c.say(c.memory.role)

            //TODO use get
	        if ( f.get([roles, c.memory.role, 'run'])) {
	            
	            roles[c.memory.role].run(c)
	        }
	        else {
	            console.log(c.name+" has no recognized role with a run function: "+c.memory.role)
	            roles['role_harvester'].run(c)
	        }
	    }

            c.memory.job = c.job
    }

    if (Game.time % 3 === 1)
    	population.check_population()
    


    //TODO put this in structures.js?
    var towers = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_TOWER); 
    for (i = 0; i < towers.length; i++) { structures.run_tower(towers[ i ]); }
    
    if (! (Game.time % 9)) {
    	var links = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_LINK);
   		for (i = 0; i < links.length; i++) { structures.run_link(links[ i ]); }
   	}

    if (! (Game.time % 30)) {
    	structures.check_terminals()
    }

    f.cpuTrack(1,10,100,1000,10000)
    
}
