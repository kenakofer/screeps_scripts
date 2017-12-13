var roles = require('roles')
var f = require('f')
var population = require('population')
var structures = require('structures')
//var room_control = require('room_control')

module.exports.loop = function () {

    //Make sure basic memory locations exist
    if (! Memory.cpuTrack){ Memory.cpuTrack={} }
    if (! Memory.room_strategy){ Memory.room_strategy={} }

    //Run each rooms main control
    //for (roomName in Memory.room_strategy){
    //    room_control.run_room(roomName)
    //}

    for (var name in Game.creeps){
        var c = Game.creeps[name];
        if (! c.spawning) {
            c.job = 'I was given no job.'

            //c.say(c.memory.role)

            if ( f.get([roles, c.memory.role, 'run'])) {
                //if (c.memory.role == 'role_upgrader')
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
    if (Game.time % 3 === 2){
        for (var roomName in Game.rooms){
            var room = Game.rooms[roomName]
            if (! Memory.room_strategy[roomName]){ Memory.room_strategy[roomName]={} }
            Memory.room_strategy[roomName]['energy_need_filled'] = room.energyAvailable < room.energyCapacityAvailable
            Memory.room_strategy[roomName]['towers_need_filled'] = 
                room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < (s.energyCapacity * .90)
                })[0]
        }
    }
    


    //TODO put this in structures.js?
    //Not a significant portion of cpu
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
