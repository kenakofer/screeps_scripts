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
            'role_harvester': {'desired_number':2, 'parts':[MOVE,WORK,CARRY] },
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
            'spawn_priority':['role_claimer', 'role_harvester'],
            'role_claimer':{'spawn_room':fromRoom, 'parts':[MOVE,CLAIM]},
            'role_harvester':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY], 'desired_number':2},
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
            'role_trucker':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE, WORK, CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]},
            'role_guard':    {'spawn_room':fromRoom, 'desired_number':1, 'parts':[TOUGH,TOUGH,TOUGH,TOUGH, MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
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

        // Choose a level based on eca
        var eca = room.energyCapacityAvailable
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
        } else {
            console.log('uncaught')
            return false
        }


    }
}

