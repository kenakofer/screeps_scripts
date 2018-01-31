//var Memory.room_strategy = require('Memory.room_strategy')
var f = require('f')
var roles = require('roles')

module.exports = {

census: function(justCount, home_room){
    var role_count={};
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.home_room == home_room && ! f.imminent_death(creep)){
            var r = creep.memory.role;
            if (! (r in role_count)) {
                role_count[r] = [creep];
            } else {
                role_count[r].push(creep);
            }
        }
    }
    if (justCount)
        return _.mapValues(role_count, function(list) {return list.length} )
    else
        return role_count;
},

check_population: function(rooms_with_spawn){
    for (var roomName in Memory.room_strategy) {
        var room = Game.rooms[roomName]
        var spawn = undefined
        if (room)
            spawn = Game.rooms[roomName].find(FIND_MY_SPAWNS)[0]
        if ( (!spawn) && rooms_with_spawn)
            continue;
        if ( spawn && (!rooms_with_spawn))
            continue;
        var role_count = this.census(false, roomName)
        //Replace base classes as they die
        var spawn_order = f.get([Memory, 'room_strategy', roomName, 'spawn_priority'])
        if (spawn_order) {
            for (var i in spawn_order) {
                var r = Memory.room_strategy[roomName].spawn_priority[i]
                var number = f.get([Memory, 'room_strategy', roomName, r, 'desired_number'])
                if ( number && ((! role_count[r]) || role_count[r].length < number)) {
                    var spawnAt = spawn
                    if ( f.get([Game.rooms, [Memory, 'room_strategy', roomName, r, 'spawn_room']])) {
                        spawnAt = Game.rooms[ Memory.room_strategy[roomName][r].spawn_room ].find(FIND_MY_SPAWNS)[0]
                    }
                    if (spawnAt) {
                        
                        var result = spawnAt.createCreep(Memory.room_strategy[roomName][r].parts, {role: r, home_room: roomName})
                        //console.log(r)
                        if (result === ERR_NOT_ENOUGH_ENERGY){
                            if (r=='role_restocker' || r=='role_harvester') {
                                // Emergency catch for high level rooms where
                                // the available energy has dropped too low to
                                // spawn the more expensive restocker or harvester
                                spawnAt.createCreep([MOVE,MOVE, CARRY,CARRY, WORK], {role: 'role_harvester', home_room: roomName})
                                Game.notify('Hey Kenan, '+spawnAt.room.name+' ran low on energy, and spawned an emergency harvester to fix it. Just thought you\'d wanna know!', 1)
                            } else {
                                // Break from iterating the spawn order in this
                                // room: Don't try to spawn things further down
                                // the list
                                console.log(roomName+'failed to spawn a'+r)
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
},
check_flag_creeps: function(){
    //Create creeps in 1-1 correspondance with special flags
    //TODO make this different method? flag associated creeps vs. counted creeps?
    for (var f_name in Game.flags){
        
        //Create solominers
        if (f_name.includes('solomine')){
            if (! f.get([Game, 'creeps', [Memory, f_name]]) 
                    || f.imminent_death(Game.creeps[Memory[f_name]])
            ) {
                //There is no creep (or soon will be no creep) mining this location, so let's create one!
                Memory[f_name] = 'No one'
                
                var mine_in_room = Game.flags[f_name].pos.roomName
                var spawn_in_room = mine_in_room
                
                if (f.get([Memory.room_strategy, mine_in_room, 'role_solominer', 'spawn_room'])) {
                    spawn_in_room = Memory.room_strategy[mine_in_room].role_solominer.spawn_room
                }
                if (Game.rooms[spawn_in_room] && Memory.room_strategy[mine_in_room].role_solominer){
                    var spawn = f.get([Game.rooms[spawn_in_room].find(FIND_MY_SPAWNS), 0])
                    if (spawn){
                    
                        parts = Memory.room_strategy[mine_in_room]['role_solominer'].parts
                        var r = spawn.createCreep(parts, {role: "role_solominer", home_room: mine_in_room, mining_flag: f_name});
                        if (_.isString(r))
                            Memory[f_name] = r
                    } else if (f_name.includes('remote')){
                        console.log('You need to create a room_stategy to tell where to spawn the solominer for '+mine_in_room)
                    }
                }
            }
        }
        //Create trucker
        if (f_name.includes('trucker') && f_name.includes('pickup')){
            if (! f.get([Game, 'creeps', [Memory, f_name]]) 
                    || f.imminent_death(Game.creeps[Memory[f_name]])
            ) {
                //There is no creep (or soon will be no creep) trucking this location, so let's create one!
                
                var mine_in_room = Game.flags[f_name].pos.roomName
                var spawn_in_room = mine_in_room
                
                if (f.get([Memory.room_strategy, mine_in_room, 'role_trucker', 'spawn_room'])) {
                    spawn_in_room = Memory.room_strategy[mine_in_room].role_trucker.spawn_room
                }
                if (Game.rooms[spawn_in_room]){
                    var spawn = Game.rooms[spawn_in_room].find(FIND_MY_SPAWNS)[0];
                    if (spawn){
                        parts = Memory.room_strategy[mine_in_room]['role_trucker'].parts
                        var r = spawn.createCreep(parts, {role: "role_trucker", home_room: mine_in_room, drop_room: spawn_in_room, pickup_flag: f_name});
                        if (_.isString(r))
                            Memory[f_name] = r
                    }
                } else {
                    console.log('Gotta set a spawn room for this trucker: '+f_name)
                }   
            }
        }
        //Create creep to claim a controller
        if (f_name.includes('claim') && (! f.get([Game, 'creeps', [Memory, f_name]]))){
            //There is no creep claiming this location, so let's create one!
                
            var claim_room = f.get([Game, 'flags', f_name, 'pos','roomName'])
            var spawn_room = f.get([Memory.room_strategy, claim_room, 'role_claimer', 'spawn_room'])
            var parts = f.get([Memory.room_strategy, claim_room, 'role_claimer', 'parts'])
            if (! parts) parts = [CLAIM, CLAIM, MOVE]
            if (!spawn_room) {
                console.log("Set a strategy in "+claim_room+" to know where to spawn the claimer")
            } else {
                //console.log("Wanna make a claimer for "+f_name+' in '+spawn_room)
                var spawn = Game.rooms[spawn_room].find(FIND_MY_SPAWNS)[0]

                if (spawn){
                    var r = spawn.createCreep(parts, {role: "role_claimer", home_room: claim_room, claiming_flag: f_name});
                    if (_.isString(r)){
                        Memory[f_name] = r;
                    }
                }
            }
        }
        
        //Create a creep to bring peace to arbitrary flags
        //TODO hardcoded Spawn1? Gotta get rid of that
        if (f_name.includes('courier') && (! f.get([Game, 'creeps', [Memory, f_name]]))){
            var r = Game.spawns.Spawn1.createCreep(roles['role_courier'].parts, {role: "role_courier", home_room: 'W7N3', flag: f_name});
            if (_.isString(r)){
                Memory[f_name] = r;
            }
        }
    }
},

};
