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

            // Check for if an emergency safe mode is needed
            // First establish the presence of a non safemode controller with hostiles in the room
            var controller = f.get([Game.rooms, roomName, 'controller'])
            if (controller && controller.my && (controller.safeMode === undefined) && (controller.room.find(FIND_HOSTILE_CREEPS)[0])){
                // See if we don't have a cache of structures
                if (! f.get([Memory.room_strategy, roomName, 'hostile_struct_check'])){
                    // Get all the relevant structure ids in the room
                    struct_types = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_OBSERVER, STRUCTURE_EXTRACTOR, STRUCTURE_LAB, STRUCTURE_TERMINAL, STRUCTURE_NUKER]
                    structs = c.room.find(FIND_MY_STRUCTURES, {filter: (s) => _.contains(struct_types, s.structureType)})
                    ids = structs.map(s => s.id)
                    // Write the ids to memory
                    Memory.room_strategy[roomName].hostile_struct_check = ids
                    console.log(Memory.room_strategy[roomName].hostile_struct_check)
                    console.log(ids.length)
                } else {
                    // Run through cache and make sure the structures still exist at full hits
                    structs = Memory.room_strategy[roomName].hostile_struct_check
                    for (i in structs) {
                        obj = Game.getObjectById(structs[i])
                        if ( !obj ){
                            r = controller.activateSafeMode()
                            console.log('START SAFE MODE cause of object id: '+structs[i]+' with result '+r)
                            Game.notify('Hey Kenan, '+roomName+' started a safe mode with result'+r+'  Better check it out!', 1)
                           break
                        }
                    }
                    console.log('Already cached!')
                }
            } else {
                // No safe mode needed at this time, so clear the cache
                if (Memory.room_strategy[roomName].hostile_struct_check) {
                    console.log('clearing the cache')
                    Memory.room_strategy[roomName].hostile_struct_check = undefined
                }
            }
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
        structures.check_terminal_minerals()
    }

    if ((Game.time % 10) == 1){
        structures.check_lab_reactions()
    }

    f.cpuTrack(1,10,100,1000,10000)
    
}
