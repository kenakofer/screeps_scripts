var roles = require('roles')
var f = require('f')
var population = require('population')
var structures = require('structures')
//var room_control = require('room_control')

module.exports.loop = function () {

    //Make sure basic memory locations exist
    if (! Memory.cpuTrack){ Memory.cpuTrack={} }
    if (! Memory.cpuTrackRole){ Memory.cpuTrackRole={} }
    if (! Memory.room_strategy){ Memory.room_strategy={} }

    //Run each rooms main control
    //for (roomName in Memory.room_strategy){
    //    room_control.run_room(roomName)
    //}

    var cpuAll = {}
    for (var name in Game.creeps){
        var c = Game.creeps[name];
        if (! c.spawning) {
            c.job = 'I was given no job.'

            //c.say(c.memory.role)

            if ( f.get([roles, c.memory.role, 'run'])) {
                var cpu = Game.cpu.getUsed()
                roles[c.memory.role].run(c)
                var used = Game.cpu.getUsed()-cpu
                if (cpuAll[c.memory.role] === undefined) cpuAll[c.memory.role] = {'number':1, 'totalCpu':used}
                else {
                    cpuAll[c.memory.role].number += 1; 
                    cpuAll[c.memory.role].totalCpu += used}
            }
            else {
                console.log(c.name+" has no recognized role with a run function: "+c.memory.role)
                roles['role_harvester'].run(c)
            }
        }

        c.memory.job = c.job
    }
    //console.log(JSON.stringify(cpuAll))
    f.cpuTrackRole(cpuAll)

    if (Game.time % 3 === 1){
        population.check_population(false)
        population.check_population(true)
        population.check_flag_creeps()
    }
    // Update various room status
    if (Game.time % 3 === 2){
        for (var roomName in Game.rooms){
            var room = Game.rooms[roomName]
            if (! Memory.room_strategy[roomName]){ Memory.room_strategy[roomName]={} }
            Memory.room_strategy[roomName]['energy_need_filled'] = room.energyAvailable < room.energyCapacityAvailable
            Memory.room_strategy[roomName]['towers_need_filled'] = 
                room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < (s.energyCapacity * .90)
                })[0]
            Memory.room_strategy[roomName]['storage_low'] = 
                (Game.rooms[roomName].storage && Game.rooms[roomName].storage.store.energy < 100000)
            Memory.room_strategy[roomName]['terminal_low'] = 
                (Game.rooms[roomName].terminal && Game.rooms[roomName].terminal.store.energy < 10000)
        }
    }
    


    //TODO put this in structures.js?
    //Not a significant portion of cpu
    var towers = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_TOWER); 
    for (i = 0; i < towers.length; i++) { structures.run_tower(towers[ i ]); }
    
    if (! (Game.time % 5)) {
    	var links = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_LINK);
   		for (i = 0; i < links.length; i++) { structures.run_link(links[ i ]); }
    }

    if (! (Game.time % 30)) {
    	structures.check_terminals()
    }

    if ((Game.time % 10) == 1){
        structures.check_lab_reactions()
    }

    f.cpuTrack(1,10,100,1000,10000)
    
}
