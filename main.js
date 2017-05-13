//TODO strategy option to fix upgraders in place
//TODO find ways to reduce cpu usage
//	Diminish processing while on a job, like mining, upgrading, building?
//	Reduce number of moving creeps to cut pathfinding.
//	Reduce creeps by making larger creeps
//	Find tasks that don't need to be run every tick
//TODO claim 5th room
//TODO stop couriers from killing themselves!
//TODO start mining minerals
//TODO develop soldier/healer pairs to take rooms
//TODO anticipate deaths of solominers?
//TODO system of "calling dibs" on energy
//	How about a link operator creep that stands by a storage and a link and receives requests for energy at other links, and fulfills them?
//TODO recycle creep names?
//TODO controller signing!
//TODO restockers go to spawn when done: 
//	Maybe not, because they might be waiting for access to stored materials

var roles = require('roles')
var f = require('f')
var population = require('population')
var structures = require('structures')

//It keeps running track of the cpu across different time intervals. It's not exactly an average, but I think it's close...
function cpuTrack(){
    for (i in arguments){
            t = arguments[i]
            if ( [undefined, null].includes(Memory.cpuTrack[t]))
                    Memory.cpuTrack[t] = Game.cpu.getUsed()
            else
                    Memory.cpuTrack[t] = ( (t-1)*Memory.cpuTrack[t] + Game.cpu.getUsed()) / t
    }

    if (Memory.printCpu)
	console.log(JSON.stringify(Memory.cpuTrack))
}

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

    cpuTrack(1,10,100,1000,10000)
    
}
