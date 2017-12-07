//var Memory.room_strategy = require('Memory.room_strategy')
var f = require('f')
var roles = require('roles')

module.exports = {

census: function(justCount, home_room){
    role_count={};
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

check_population: function(){
    for (roomName in Memory.room_strategy) {
        var room = Game.rooms[roomName]
        var spawn = undefined
        if (room)
            spawn = Game.rooms[roomName].find(FIND_MY_SPAWNS)[0]
        var role_count = this.census(false, roomName)
        //Replace base classes as they die
        var spawn_order = f.get([Memory, 'room_strategy', roomName, 'spawn_priority'])
        if (spawn_order) {
            for (var i in spawn_order) {
                r = Memory.room_strategy[roomName].spawn_priority[i]
                number = f.get([Memory, 'room_strategy', roomName, r, 'desired_number'])
                if ( number && ((! role_count[r]) || role_count[r].length < number)) {
                    var spawnAt = spawn
                    if ( f.get([Memory, 'room_strategy', roomName, r, 'spawn_room'])) {
                        spawnAt = Game.rooms[ Memory.room_strategy[roomName][r].spawn_room ].find(FIND_MY_SPAWNS)[0]
                    }
                    if (spawnAt) {
                        
                        //console.log("wanna spawn a "+r+" in room "+spawnAt.room.name+" for "+roomName)
                        
                        spawnAt.createCreep(Memory.room_strategy[roomName][r].parts, {role: r, home_room: roomName})
                        break;
                    }
                }
            }
        }
    }

    //Create creeps in 1-1 correspondance with special flags
    //TODO make this different method? flag associated creeps vs. counted creeps?
    for (var f_name in Game.flags){
        
        //Create solominers
        if (f_name.includes('solomine')){
            if (! f.get([Game, 'creeps', [Memory, f_name]]) 
                    || f.imminent_death(Game.creeps[Memory[f_name]])
            ) {
                //There is no creep (or soon will be no creep) mining this location, so let's create one!
                
                var mine_in_room = Game.flags[f_name].room.name
                var spawn_in_room = mine_in_room
                
                if (f.get([Memory.room_strategy, mine_in_room, 'role_solominer', 'spawn_room'])) {
                    spawn_in_room = Memory.room_strategy[mine_in_room].role_solominer.spawn_room
                }
                var spawn = Game.rooms[spawn_in_room].find(FIND_MY_SPAWNS)[0];
                
                parts = Memory.room_strategy[mine_in_room]['role_solominer'].parts
                var r = spawn.createCreep(parts, {role: "role_solominer", home_room: mine_in_room, mining_flag: f_name});
                if (_.isString(r))
                    Memory[f_name] = r
            }
        }
        //Create creep to claim a controller
        if (f_name.includes('claim') && ( !('role_claimer' in role_count)) && (! f.get([Game, 'creeps', [Memory, f_name]]))){
            //There is no creep claiming this location, so let's create one!
                
            var claim_room = f.get([Game, 'flags', f_name, 'pos','roomName'])
            var spawn_room = f.get([Memory.room_strategy, claim_room, 'role_claimer', 'spawn_room'])
            if (!spawn_room) {
                console.log("Set a strategy in "+claim_room+" to know where to spawn the claimer")

            } else {
                console.log("Wanna make a claimer for "+f_name+' in '+spawn_room)
                var spawn = Game.rooms[spawn_room].find(FIND_MY_SPAWNS)[0]

                var r = spawn.createCreep([CLAIM, MOVE], {role: "role_claimer", home_room: 'claim_room', claiming_flag: f_name});
                if (_.isString(r)){
                    Memory[f_name] = r;
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
}

};
