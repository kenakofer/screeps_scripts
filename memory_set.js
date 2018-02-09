var f = require('f')
//Gives some standard settings for different controller levels and situations
//
// Example:
// require('memory_set').controller1_basic('E27S24')

module.exports = {
    
    //This is a good method to call for the first ever room, to get everything up and running
    // e.g. require('memory_set').controller1_basic('E27S26')
    controller1: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_harvester', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester': {'desired_number':6, 'parts':[MOVE,WORK,CARRY] },
            'role_guard': {'desired_number':1, 'parts':[MOVE,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_builder': {'desired_number':0, 'parts':[MOVE,WORK,CARRY] }, //Harvesters are like builders when spawn is full at lvl 1, and harvesters should make the transition into controller2 smoother
            'role_solominer': {'parts':[WORK,WORK,WORK,WORK,WORK,MOVE]}, //Don't make this until you're shifting to the next
            'name': 'controller1',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //Once you have lvl2, 5 extensions
    //When switching to this, make sure you place a 'solomine*' flag to create the solominer(s)!
    controller2: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_solominer', 'role_harvester', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester': {'desired_number':2, 'parts':[MOVE,MOVE, WORK, CARRY,CARRY,CARRY] },
            'role_restocker': {'desired_number':0, 'parts':[MOVE, CARRY, CARRY] },
            'role_guard': {'desired_number':1, 'parts':[MOVE,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_builder': {'desired_number':3, 'parts':[MOVE, MOVE, WORK,WORK, CARRY,CARRY] },
            'role_solominer': {'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]}, //You need 5 extensions before you can make this one
            'name': 'controller2',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //When wanting to claim a new room and send workers there, call this on the new room
    // E.g. require('memory_set').bootstrap_room('E28S22', 'E27S24')
    // If the path to the room isn't straightforward, use a list of rooms in room_path to show the order.
    // eg require('memory_set').bootstrap_room('E29S29', 'E28S22', ['E28S22', 'E29S22', 'E30S22', 'E30S23','E30S24', 'E30S25', 'E30S26', 'E30S27', 'E29S27','E29S28','E28S28','E28S29',E29S29'])
    //
    bootstrap_room: function(roomName, fromRoom, room_path){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority':['role_claimer', 'role_upgrader', 'role_harvester'],
            'role_claimer':{'spawn_room':fromRoom, 'parts':[MOVE,CLAIM]},
            'role_harvester':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':2},
            'role_upgrader':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':1},
            'room_path':room_path,
            'name': 'bootstrap_room',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },


    rebuild_spawn: function(roomName, fromRoom, room_path){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority':['role_builder'],
            'role_builder':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK,WORK, CARRY,CARRY,CARRY,CARRY], 'desired_number':1},
            'room_path':room_path,
            'name': 'rebuild_spawn',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //When wanting to claim a new room and send workers there, call this on the new room
    // E.g. require('memory_set').remote_mine_room('E28S26', 'E27S26')
    remote_mine_room: function(roomName, fromRoom){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority':['role_guard','role_solominer', 'role_claimer', 'role_builder', 'role_trucker'],
            'role_claimer':{'spawn_room':fromRoom},
            'role_builder':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':0},
            'role_solominer':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, CARRY, WORK,WORK,WORK,WORK,WORK]},
            'role_trucker':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]},
            'role_guard':    {'spawn_room':fromRoom, 'desired_number':1, 'parts':[TOUGH,TOUGH,TOUGH,TOUGH, MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
            'name': 'remote_mine_room',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },
    
    remote_mine_room_defenseless: function(roomName, fromRoom){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority':['role_solominer', 'role_claimer', 'role_builder', 'role_trucker'],
            'role_claimer':{'spawn_room':fromRoom},
            'role_builder':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':0},
            'role_solominer':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, CARRY, WORK,WORK,WORK,WORK,WORK]},
            'role_trucker':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]},
            'name': 'remote_mine_room',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },
    

    //For controller level 3. Solomining is assumed by this point. Prioritize building the new extensions and a tower
    controller3: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer', 'role_trucker' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':3, 'parts':[MOVE,MOVE, CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[MOVE,MOVE,ATTACK,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,MOVE, WORK,WORK, CARRY,CARRY] },
            'role_builder':  {'desired_number':3, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]},
            'name': 'controller3',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //For controller level 4, to minimize the creep count for CPU
    controller4: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer', 'role_trucker' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':3, 'parts':[MOVE,MOVE,MOVE, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
            'role_builder':  {'desired_number':1, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK,WORK, CARRY,CARRY,CARRY,CARRY] },
            'role_upgrader':  {'desired_number':1, 'parts':[MOVE,MOVE, WORK,WORK,WORK,WORK,WORK,WORK,WORK, CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, CARRY, MOVE]},
            'name': 'controller4',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //For controller level 5. Links are now assumed. This lightweight setup should help you fill up a storage with energy
    controller5: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer', 'role_trucker' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':2, 'parts':[MOVE,MOVE,MOVE, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[TOUGH,TOUGH,TOUGH,TOUGH, MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
            'role_builder':  {'desired_number':1, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK,WORK, CARRY,CARRY,CARRY,CARRY] },
            'role_upgrader':  {'desired_number':1, 'parts':[MOVE,MOVE, WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK, CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE, CARRY]},
            'name': 'controller5',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //For controller level 6. The motions of creeps should be reduced as much as possible.
    controller6: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer', 'role_trucker' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':1, 'parts':[MOVE,MOVE,MOVE, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[TOUGH,TOUGH,TOUGH,TOUGH, MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
            'role_builder':  {'desired_number':1, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK,WORK,WORK,WORK, CARRY,CARRY] }, //cost: 900
            'role_upgrader':  {'desired_number':1, 'parts':[MOVE,MOVE, WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK, CARRY] }, //cost: 1050
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE, CARRY]},
            'name': 'controller6',
        };
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //For controller level 7. I'm not sure what I'm aiming for here, but perhaps one large builder can take the place of an upgrader? There's like 5300 energy available, but I shouldn't spend it all in one place
    controller7: function(roomName){
        if (! Memory.room_strategy[roomName]) Memory.room_strategy[roomName] = {}
        var updates = {
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':1, 'parts':[CARRY,CARRY,MOVE, CARRY,CARRY,MOVE, CARRY,CARRY,MOVE, CARRY,CARRY,MOVE, CARRY,CARRY,MOVE, CARRY,CARRY,MOVE, ] },
            'role_guard':    {'desired_number':1, 'parts':[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH, MOVE,MOVE,MOVE,MOVE,MOVE,MOVE, ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK] },
            'role_builder':  {'desired_number':1, 'parts':[WORK,WORK,WORK,WORK,MOVE, WORK,WORK,WORK,WORK,MOVE, WORK,WORK,WORK,WORK,MOVE, WORK,WORK,WORK,WORK,MOVE, WORK,CARRY,CARRY,CARRY,MOVE, ] }, //cost: 2100
            'role_upgrader':  {'desired_number':0, 'parts':[MOVE,MOVE, WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK, CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE, CARRY]},
            'name': 'controller7',
        };
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[roomName][key] = updates[key]
        });
    },

    //Example: require('memory_set').storage(Game.getObjectById('5a2472801369731ed9a3ca7e'))
    storage: function(storage_object){
        Memory[storage_object.id] = {
            'store_spawn_full': 1,
            'store_spawn_empty': 1,
            'withdraw_spawn_full': ['role_upgrader','role_builder'],
            'withdraw_spawn_empty': 1,
        }
        
    },

    //eg require('memory_set').increase_desired_hits('E27S24', STRUCTURE_WALL, 10000)
    increase_desired_hits: function(roomName, structure_type, amount){
        amount = amount || 5000
        mem_obj = Memory.room_strategy[roomName][structure_type]
        if (mem_obj === undefined)
            Memory.room_strategy[roomName][structure_type] = {desired_hits: 1000+amount}
        else if (mem_obj['desired_hits'] === undefined)
            Memory.room_strategy[roomName][structure_type]['desired_hits'] = 1000+amount
        else
            Memory.room_strategy[roomName][structure_type]['desired_hits'] += amount
        return Memory.room_strategy[roomName][structure_type].desired_hits

    },
    
    // Increases the fortification level of all rooms with controllers at 3 or higher. Good for
    // no fuss increases in defenses across the board
    increase_all_fortifications: function(amount){
        amount = amount || 2000
        for (roomName in Game.rooms){
            room = Game.rooms[roomName]
            if (room.controller && room.controller.my && f.get_room_level(roomName) >= 3){
                this.increase_desired_hits(roomName, STRUCTURE_WALL, amount)
                this.increase_desired_hits(roomName, STRUCTURE_RAMPART, amount)
            }
        }
    },

    // Set up the demolishing of a room
    // eg. require('memory_set').demolish_room('E38S38', 'E36S38', ['E36S38','E36S39','E37S39','E37S40','E38S40','E39S40','E39S39','E39S38','E38S38'])
    demolish_room: function(room, fromRoom, room_path){
        if (! Memory.room_strategy[room]) Memory.room_strategy[room] = {}
        var updates = {
            'spawn_priority':['role_demolisher'],
            'role_demolisher':{'spawn_room':fromRoom, 'parts':[WORK,WORK,WORK, MOVE,MOVE,MOVE,MOVE, HEAL], 'desired_number':1},
            'room_path':room_path,
            'name': 'demolish_room',
        }
        Object.keys(updates).forEach(function(key){
            Memory.room_strategy[room][key] = updates[key]
        });

    },

    // Increase capacity of the trucker for remote mining
    // eg: require('memory_set').increase_trucker_capacity('E44S37')

    increase_trucker_capacity: function(roomName, increase_amount){
        increase_amount = increase_amount || 1
        if (! f.get([Memory.room_strategy, roomName, 'role_trucker'])){
            console.log('This room doesn\'t have truckers in it!')
            return false
        }
        var current_move_parts = Memory.room_strategy[roomName].role_trucker.parts.filter(p => p == MOVE).length
        var new_move_parts = current_move_parts + increase_amount
        console.log(new_move_parts)
        var new_parts=[]

        for (var i=0; i<new_move_parts; i++) new_parts.push(MOVE)
        for (var i=0; i<2*new_move_parts; i++) new_parts.push(CARRY)
        Memory.room_strategy[roomName].role_trucker.parts = new_parts
        return new_parts
    },

    // Increase work parts of the upgrader (excess energy in room!)
    // eg: require('memory_set').increase_upgrader_work('E44S37')
    // Only use this for creeps that will spend most of their time upgrading

    increase_upgrader_work: function(roomName, increase_amount, role){
        role = role || 'role_upgrader'
        if (! f.get([Memory.room_strategy, roomName, role, desired_number]) > 0){
            // If there are none of whatever was passed in in the room, try
            // builder instead
            role = 'role_builder'
        }
        
        increase_amount = increase_amount || 1
        if (! f.get([Memory.room_strategy, roomName, role])){
            console.log('This room doesn\'t have a '+role+' in it!')
            return false
        }
        var current_work_parts = Memory.room_strategy[roomName][role].parts.filter(p => p == WORK).length
        var new_work_parts = current_work_parts + increase_amount
        console.log(new_work_parts)

        if (new_work_parts < 17){
            // For less than 17, use a pattern of MOVE,MOVE, <all work parts>,
            // CARRY
            var new_parts=[MOVE,MOVE]
            for (var i=0; i<new_work_parts; i++) new_parts.push(WORK)
            new_parts.push(CARRY)
            Memory.room_strategy[roomName][role].parts = new_parts
            return new_parts
        } else {
            // For more than 17, push a MOVE before each group of 4 other parts,
            // starting with all works and ending with 3 CARRYs
            var new_parts=[]
            for (var i=0; i<new_work_parts+3; i++){
                if (i%4==0)
                    new_parts.push(MOVE)
                if (i < new_work_parts)
                    new_parts.push(WORK)
                else
                    new_parts.push(CARRY)
            }
            Memory.room_strategy[roomName][role].parts = new_parts
            return new_parts
        }
    },


    start_mineral_mining(roomName){
        if (_.contains(Memory.room_strategy[roomName].role_mineral_miner))
            return false
        if ( ! _.contains(Memory.room_strategy[roomName].spawn_priority, 'role_mineral_miner'))
            Memory.room_strategy[roomName].spawn_priority.push('role_mineral_miner')
        Memory.room_strategy[roomName].role_mineral_miner = {'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':1}
    },

    automatic_room_strategy_rules(roomName){
        var room = Game.rooms[roomName]
        // If the room isn't my controller, don't touch
        if ((! room) || (! room.controller) || (! room.controller.my))
            return false
        // If the room doesn't have a spawn of its own, don't touch
        if (! room.find(FIND_MY_SPAWNS)[0])
            return false

        var eca = room.energyCapacityAvailable

        // When bootstrapping, don't switch to local spawning until eca reaches
        // 800 (controller3)
        var current = f.get([Memory.room_strategy, roomName, 'name'])
        if (current == 'bootstrap_room' && eca < 800){
            console.log(roomName)
            return false
        }

        // Choose a level based on eca
        if (eca < 550){
            if (! f.get([Memory.room_strategy, roomName, 'name'])){
                // Set a baseline for new, not bootstrapped rooms
                console.log('Automatically setting '+roomName+' to controller1')
                return this.controller1(roomName)
            } else{
                // For young rooms which already have a strategy, don't touch
                return false
            }
        //Controller2: For 550 < eca < 800 
        } else if (eca < 800){
            if (Memory.room_strategy[roomName].name != 'controller2'){
                console.log('Automatically setting '+roomName+' to controller2')
                return this.controller2(roomName)
            }
        //Controller3: For 800 < eca < 1300
        } else if (eca < 1300){
            if (Memory.room_strategy[roomName].name != 'controller3'){
                console.log('Automatically setting '+roomName+' to controller3')
                return this.controller3(roomName)
            }
        //Controller4: For 1300 < eca < 1800
        } else if (eca < 1800){
            if (Memory.room_strategy[roomName].name != 'controller4'){
                console.log('Automatically setting '+roomName+' to controller4')
                return this.controller4(roomName)
            }
        //Controller5: For 1800 < eca < 2300
        } else if (eca < 2300){
            if (Memory.room_strategy[roomName].name != 'controller5'){
                console.log('Automatically setting '+roomName+' to controller5')
                return this.controller5(roomName)
            }
        //Controller6: For 2300 < eca < 5300
        } else if (eca < 5300){
            if (Memory.room_strategy[roomName].name != 'controller6'){
                console.log('Automatically setting '+roomName+' to controller6')
                return this.controller6(roomName)
            }
        //Controller7: For 5300 < eca < 12300
        } else if (eca < 12300){
            if (Memory.room_strategy[roomName].name != 'controller7'){
                console.log('Automatically setting '+roomName+' to controller7')
                return this.controller7(roomName)
            }
        //TODO do I even need a controller8 setting? It will probably look just like 7.
        } else {
            console.log('uncaught')
            return false
        }
    },

    // Automatically check a room's storage compared to a previous check. If
    // there is still energy flowing into the storage rather than out, or if
    // the energy in the storage is above 2/3, then we will increase the
    // upgrader's work parts. Ideally, this method should only be run once in a
    // maybe 10 000 ticks, so that any previous effects from a previous
    // automatic upgrade can take effect.
    automatic_upgrader_work_check(roomName){
        var room = Game.rooms[roomName]
        var storage = f.get([room, 'storage'])
        var controller_level = f.get([room, 'controller', 'level'])
        if (! room || ! storage || ! storage.my || ! controller_level || controller_level < 5){
            console.log('This room is not suitable for an upgrader work check: '+roomName)
            return false
        }
        
        // If there is no snapshot on file, this is the first, so just take a
        // snapshot and return
        if (! Memory.room_strategy[roomName].storage_snapshot){
            console.log('Taking initial snapshot of storage')
            Memory.room_strategy[roomName].storage_snapshot = {'tick':Game.time, 'amount':storage.store.energy}
            return Memory.room_strategy[roomName].storage_snapshot 
        }

        // There is a snapshot on file. Let's compare to it
        var ss = Memory.room_strategy[roomName].storage_snapshot

        // Make sure enough time has passed
        if (Game.time - ss.tick < 10000){
            console.log((Game.time - ss.tick)+' is not enough time since the last snapshot')
            return false
        }

        // Since enough time has passed, set another snapshot. This won't
        // mess up our processing with ss
        Memory.room_strategy[roomName].storage_snapshot = {'tick':Game.time, 'amount':storage.store.energy}

        // First order of business is to fix rooms that may be drawing too much
        // If the storage is low overall, and is decreasing in amount, reduce the work parts
        if (storage.store.energy < 50000 && storage.store.energy - ss.amount < 0){
            console.log('Room is low on energy and decreasing')
            return true
        }
        // If the room is suffering great decreases in energy, reduce. 
        if (storage.store.energy - ss.amount < -7000){
            console.log('Room is decreasing rapidly')
            return true
        }
        
        // Now to check for happy excesses!
        // Make sure there is enough energy
        if (storage.store.energy < 50000){
            console.log('Not enough energy in storage for increase')
            return false
        }
        // Make sure there is an increase of energy, or a continuing excess of energy
        if (storage.store.energy - ss.amount < 7000 && storage.store.energy < 600000){
            console.log('Not enough increase in storage')
            return false
        }

        // At this point, we know that the storage has enough energy and is
        // increasing (or has a ton of energy). Now we increase upgrader capacity.
        console.log('Increasing the upgrader work parts in '+roomName)
        return increase_upgrader_work(roomName, 1)
    }
}

