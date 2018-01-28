var f = require('f')

module.exports = {
//TODO refactor this anyway?
check_withdraw: function(c, noCheckEmpty, nomove){
    
    c.job = 'check_withdraw'
    if (c.picked_up) return false

    var needs = c.carryCapacity - _.sum(c.carry)
    if (needs == 0)
        return false
        
    if (noCheckEmpty || f.get_energy(c) == 0) {

        var store = undefined
        var filter = function(s){
            return f.can_withdraw2(c, s)
        }
        if (nomove){
            stores = c.pos.findInRange(FIND_STRUCTURES, 1, {filter: filter});
            //Make sure they take from links first
            store = stores.sort(function(s1,s2){return (s1.structureType!=STRUCTURE_LINK)})[0]
        }
        else {
            store = c.pos.findClosestByPath(FIND_STRUCTURES, {filter: filter});
        }

        if (store) {
            //Try to do the withdrawl
            r = c.withdraw(store, "energy")
            if (r == ERR_NOT_IN_RANGE){
                c.moveTo(store, {range:1,})
                return store
            }
            if (r==OK)
                return store
        }
    }
    return false
},

check_solomining: function(c, flag_name){

    c.job = 'check_solomining'

    if ( (! Game.flags[flag_name]) || (c.carryCapacity > 0 && f.get_energy(c) == c.carryCapacity))
        return false

    if (c.pos.roomName != Game.flags[flag_name].pos.roomName){
        c.moveTo(Game.flags[flag_name])
        return true
    }

    var target = Game.flags[flag_name].pos.findInRange(FIND_SOURCES, 1)[0] //GOTCHA: It return a list, in this case a list of one...

    if (Game.map.getTerrainAt(Game.flags[flag_name].pos) !== 'wall' && ! c.pos.isEqualTo(Game.flags[flag_name].pos)) {
        c.moveTo(Game.flags[flag_name], {visualizePathStyle: {stroke: '#ff0', opacity: .3}});
        return true
    }
    
    if (target){
        var r = c.harvest(target)
        if (r == ERR_NOT_IN_RANGE){
            c.moveTo(Game.flags[flag_name], {visualizePathStyle: {stroke: '#ff0', opacity: .3}});
        }
        return target
    }
},

//TODO upgraders and maybe others don't pick up resources next to them while upgrading? Maybe it's because they are withdrawing from a neighboring container too quickly.
check_ondropped: function(c){

    c.job = 'check_ondropped'

    var dropped = c.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0]
    if (!dropped || 
        (dropped.resourceType === RESOURCE_ENERGY && dropped.amount < c.carryCapacity))
    	return false
    r = c.pickup(dropped)
    if (r==OK){
        c.picked_up=true
        return OK
    }
    return false
},

check_dropped: function(c, needEmpty, maxOps,){

    if (needEmpty && f.get_energy(c) > 0)
        return false
    c.job = 'check_dropped'

    var dropped = c.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {maxOps:maxOps, range:1,
        filter: (r) => r.resourceType == 'energy' && r.amount > c.carryCapacity
    })
    if (! dropped)
    	return false

    var r = c.pickup(dropped)
    if (r == ERR_NOT_IN_RANGE){
        c.moveTo(dropped, {range:1,})
        return dropped
    }
    if (r == OK) {
        c.picked_up=true
        return dropped
    }
    return false
},

check_terminal: function(c) {

    c.job = 'check_terminal'

    terminal = c.room.terminal; 
    storage = c.room.storage
    if (terminal && storage){
            if (f.get_energy(storage) > storage.storeCapacity * 2/3){
                    //Energy surplus here, so take from the storage to the terminal
                    from = storage; to = terminal
            }
            else if (f.get_energy(storage) < storage.storeCapacity / 2 && f.get_energy(terminal) > 0) {
                    //Energy deficit here, so take from the terminal and place into storage
                    from = terminal; to = storage
            } else {
                    //Energy balanced here, with storage between 1/2 and 2/3 full of energy. No giving or receiving
                    return false
            }

            if (f.get_energy(c) > 0){
                    //Deposit in the receiving structure
                    r = c.transfer(to, RESOURCE_ENERGY)
                    if (r === ERR_NOT_IN_RANGE){
                            c.moveTo(to, {range:1,})
                            return true
                    }
                    if (r === OK) {
                            return true
                    }
                    console.log('Could not deposit energy: '+r)
            }
            else {
                    r = c.withdraw(from, RESOURCE_ENERGY)
                    if (r === ERR_NOT_IN_RANGE){
                            c.moveTo(to, {range:1,})
                            return true
                    }
                    if (r === OK) {
                            return true
                    }
                    console.log('Could not withdraw energy: '+r)
            }
    }
},



sign_controller: function(c, roomName, message){

    c.job = 'sign_controller'

    if (c.room.name !== roomName){
            c.moveTo(new RoomPosition(15, 15, roomName), {range:5,})
            return true
    }
    controller = get([Game.rooms[roomName], 'controller'])
    if (! controller){
            console.log('no controller in this room?')
            return false
    }
    r = c.signController(controller, message)
    if (r == ERR_NOT_IN_RANGE){
            c.moveTo(controller, {range:1,})
            return true
    }
    if (r == OK){
            Game.flags[c.memory.flag].remove()
            return true
    }
},

check_invaders: function(c){

    c.job = 'check_invaders'

    var target = c.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    if (target){
        var r = c.attack(target) 
        if (r == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {range:1, visualizePathStyle: {stroke: '#f00', opacity: .6}});
            return target
        }
        if (r==OK)
            return target
    }
},

goto_flag: function(c, flagName){

    c.job = 'goto_flag: '+flagName

    var flag = c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes(flagName)})[0]
    if (flag){
        c.moveTo(flag.pos)
    }
    return flag
},

check_mining: function(c){

    c.job = 'check_mining'

    if (c.getActiveBodyparts(WORK) === 0){
        return false
    }

    if ( (! c.memory.mining) && f.get_energy(c) == 0) {
        var mine = c.pos.findClosestByPath(FIND_SOURCES, {range:1, filter: (s) =>
            s.energy > 100 &&
        	//If there is a flag on the source position whose name is in memory, with the value of a currently living creep
            (! f.get(  [Game, 'creeps', [Memory, [s.pos.findInRange(FIND_FLAGS, 1), 0, 'name']]]  ))
            //TODO also if it's not in the room/not mining?
        })
        if (mine) {
            c.memory.mining = mine.id
        }
        else {
            // There is no place to mine, return false
            return false
        }
    } else if (c.memory.mining && f.get_energy(c) == c.carryCapacity) {
        c.memory.mining = false
    }
    if (c.memory.mining){
        var target = Game.getObjectById(c.memory.mining);
        if (c.harvest(target) == ERR_NOT_IN_RANGE){
            c.moveTo(target, {range:1, visualizePathStyle: {stroke: '#ff0', opacity: .3}})
        }
    }
    return c.memory.mining
},

check_mineral_mining: function(c){

    c.job = 'check_mineral_mining'

    if (! c.memory.mining) {
        if (_.sum(c.carry) > 0)
            return false
        else {
            var mine = c.pos.findClosestByPath(FIND_MINERALS)
            if (mine) 
                c.memory.mining = mine.id
        }
    } else if (c.memory.mining && _.sum(c.carry) == c.carryCapacity) {
        c.memory.mining = false
    }
    if (c.memory.mining){
        var target = Game.getObjectById(c.memory.mining);
        if (c.harvest(target) == ERR_NOT_IN_RANGE){
            c.moveTo(target, {range:1, visualizePathStyle: {stroke: '#ff0', opacity: .3}})
        }
    }
    return c.memory.mining
},

check_spawn: function(c, prevId){

    c.job = 'check_spawn'

    if (f.get_energy(c) == 0 || (false === f.get([Memory, 'room_strategy', c.room.name, 'energy_need_filled'])) ){
        //If the creep has no energy or the spawn system is already full, we can't do it
        return false
    }
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_EXTENSION ||
            s.structureType == STRUCTURE_SPAWN) 
            && s.energy < s.energyCapacity
            && s.id != prevId
        }
    });
    if (target) {
    	r = c.transfer(target, RESOURCE_ENERGY)
        if(r == ERR_NOT_IN_RANGE)
            c.moveTo(target, {range:1, visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
        if (r == OK && prevId===undefined) {
            // Now that we've filled it, make an effort to move to another
            if (f.get_energy(c)-target.energyCapacity > 0)
                this.check_spawn(c, target.id)
            else 
                this.check_withdraw(c, true)
        }
    }
    return target
},

check_towers: function(c){

    c.job = 'check_towers'

    if (f.get_energy(c) == 0)
            return false
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {range:1,
        filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < (s.energyCapacity * .90)
    });
    if (target) {
        if(c.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {range:1, visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
        }
    }
    return target
},

upgrade_controller: function(c) {

    c.job = 'upgrade_controller'
    //If there's a flag, we should be trying to move toward it
    this.goto_flag(c, 'upgrade')

    var r = c.upgradeController(c.room.controller)
    
    if(r === ERR_NOT_IN_RANGE) {
        c.moveTo(c.room.controller, {range:3, visualizePathStyle: {stroke: '#00ff00', opacity: .3}});
        return c.room.controller
    }
    else if (r===OK){
        //Try to pull more energy from any storage that might be nearby, but only if there is enough to fill up and leave some for other important stuff, like maybe restockers want it
        this.check_withdraw(c, true, true, 300)
        return true
    }
    return false
},

trucker_dropoff:  function(c){
    c.job = 'trucker_dropoff'
    if ( this.check_room(c, c.memory.drop_room) )
        return true
    flag = f.get([c.room.find(FIND_FLAGS, {
        filter: (f) => f.name.includes('trucker_drop')
    }), 0])
    if (! flag) {
        console.log('No place for '+c.name+' to drop energy!')
        return false
    }
    store = flag.pos.findInRange(FIND_STRUCTURES, 0, {
        filter: (s) => [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_LINK].includes(s.structureType)
    })[0]

    c.moveTo(flag, {range:1,})
    r = c.transfer(store, "energy")
    return r
},

trucker_pickup:  function(c){
    c.job = 'trucker_pickup'
    if (_.sum(c.carry) > .5 * c.carryCapacity)
        return false
    flag = Game.flags[f.get([c, 'memory', 'pickup_flag'])]
    if (flag.pos.roomName != c.room.name){
        c.moveTo(flag, {range:5,})
        return true
    }
    store = flag.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s) => s.structureType == STRUCTURE_CONTAINER
    })[0]
    if (! store){
        // There is no container by the flag, so pick up energy from the ground
        resource = flag.pos.findInRange(FIND_DROPPED_RESOURCES,1)
        r = c.pickup(resource)
        if (r != OK)
            c.moveTo(flag, {range:0,})
        return true
    }
    if (flag.pos.roomName == c.room.name){
         r = c.withdraw(store, "energy")
         if (r == ERR_NOT_IN_RANGE)
            c.moveTo(flag, {range:1,})
    }

    return true
},

repair_nomove: function(c){
    if (c.carry.energy ==0)
        return false
    c.job = 'repair_nomove'
    var damagedStuff = c.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (s) => {
            if (s.hits < s.hitsMax - 500) {
                desired_hits = f.get_desired_hits(s)
                return s.hits < desired_hits
            }
            return false
        }
    });
    if (! damagedStuff[0])
        return false
    c.repair(damagedStuff[0])
    return true
},

claim_controller: function(c, flag_name){

    c.job = 'claim_controller'

    var flag = Game.flags[flag_name]
    if (! flag)
        return false

    var pos = flag.pos

    c.moveTo(flag, {range:1,})
    if (c.room.name !== flag.pos.roomName){
        return true
    }
    
    var controller = Game.rooms[flag.pos.roomName].controller
    //c.claimController(controller)

    if (controller) {
        if (_.contains(flag_name, 'actually')){
            if ( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.claimController(controller))) {
                c.moveTo(pos);
            }
        }
        else 
            if ( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.reserveController(controller))) {
                c.moveTo(pos);
            }
        if (controller.my)
            flag.remove()
        return true
    }
},

check_room: function(c, roomName){
    c.job = 'check_room'

    if (c.room.name === roomName)
        return false //We're already there
    else {
        var r = c.moveTo(new RoomPosition(25,25, roomName), {range:10, visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
        c.say("to "+ roomName)
        return roomName
    }

},

check_home_room: function(c) {

    c.job = 'check_home_room'

    if (! c.memory.home_room){
            c.memory.home_room = c.room.name
            return false //We've decided this is home
    }
    if (c.room.name === c.memory.home_room){
        return false //We're already there
    }
    else {
        var path = f.get([Memory.room_strategy, c.memory.home_room, 'room_path'])
        var nextRoom = undefined
        if (! path){
            nextRoom = c.memory.home_room
        } else {
            // We have a path to guide us there.
            index = path.indexOf(c.room.name)
            nextRoom = path[index+1]
        }
        var r = c.moveTo(new RoomPosition(25,25, nextRoom), {range:5, visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
        if (r == -2) {
            r = c.moveTo(new RoomPosition(25,25, nextRoom), {range:10, visualizePathStyle: {stroke: '#ff0', opacity: .3}, maxOps: 10000} )
        }
        if (Game.time % 2 == 0) c.say("to "+ c.memory.home_room)
        else c.say(' via '+nextRoom)
        c.memory['nextRoom']=nextRoom

        //Jettison extra cargo
        c.drop(RESOURCE_ENERGY)

        return c.memory.home_room
    }
},

check_construction: function(c, nomove){
    
    c.job = 'check_construction'

    var target = c.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {range:3,});
    if (target){
        var r = c.build(target)
        if (r == ERR_NOT_IN_RANGE && ! nomove) {
            c.moveTo(target, {range:3, visualizePathStyle: {stroke: '#00f', opacity: .3}})
            return target
        }
        if (r==OK){
            //TODO does this work?
            this.check_withdraw(c, true, true, 300)
            return target
        }
    }
    return false
},

check_store: function(c, types, distance){
    types = types || [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL]
    distance = distance || 5

    c.job = 'check_store'

    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {range:1,
            filter: (s) =>  ((_.contains(types, s.structureType) ||
                            (s.pos.lookFor('flag')[0] && s.pos.lookFor('flag')[0].name.includes('stor'))) &&
                            s.store.energy < s.storeCapacity &&
                            f.can_store(c, s))
        });
        if (store) {
            r = c.transfer(store, "energy")
            //Only go out of your way to store energy if you're full or a restocker, and the store is close by
            if (r == ERR_NOT_IN_RANGE && 
                (_.sum(c.carry) == c.carryCapacity || c.memory.role=='role_restocker')
                && c.pos.getRangeTo(store) < distance){
                    c.moveTo(store, {range:1,})
                    return store
            }
            if (r==OK) {
                return store
            }
        }
        else return false
    }
},

check_store_minerals: function(c){
    var desired_amounts = {
        [RESOURCE_HYDROGEN]: 10000,
        [RESOURCE_OXYGEN]: 10000,
        [RESOURCE_UTRIUM]: 10000,
        [RESOURCE_LEMERGIUM]: 10000,
        [RESOURCE_KEANIUM]: 10000,
        [RESOURCE_ZYNTHIUM]: 10000,
        [RESOURCE_CATALYST]: 10000,
        [RESOURCE_GHODIUM]: 10000,
    }
    var dest_struct = c.room.terminal
    if (! dest_struct)
        dest_struct = c.room.storage
    if (! dest_struct)
        return false
    for (rtype in c.carry){
        if (rtype == RESOURCE_ENERGY)
            continue
        r=c.transfer(dest_struct, rtype)
        if (r === ERR_NOT_IN_RANGE){
            c.moveTo(dest_struct, {range:1,})
            return true
        }
        if (r===OK)
            return true
    }
},

//TODO add parameter for movement?
check_store_link: function(c){

    c.job = 'check_store_link'
    var store = undefined

    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  s.structureType == STRUCTURE_LINK && s.energy < s.energyCapacity
        });
        if (store) {
            var r = c.transfer(store, 'energy')
            if (r == ERR_NOT_IN_RANGE){
                //Never go out of your way?
                //c.moveTo(store, {range:1,})
                //return store
            }
            if (r==OK) {
                return store
                
            }
        } else return false
    }
},

check_labs: function(c){
    // Don't interrupt a mining job
    if (c.memory.mining)
        return false

    c.job = 'check_labs'

    labs = c.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LAB}})
    target_lab = undefined
    for (i in labs){
        lab = labs[i]
        //If there isn't an input flag, skip over the lab
        flag = lab.pos.lookFor(LOOK_FLAGS)[0]
        if (!flag)
            continue
        if (flag.name.includes('_in')){
            //Get the resource associated with the flag
            resource = flag.name.substring(0,flag.name.indexOf('_'))
            // If the lab doesn't have the wrong mineral in it
            if (_.contains([null,resource], lab.mineralType)) {
                // If there is already plenty (2/3 capacity) skip over this lab
                if (lab.mineralAmount > 2000)
                    continue
                if ( c.carry[resource] > 0 ){
                    // So the creep has the resource. Go put it in
                    r = c.transfer(lab, resource)
                    if (r === ERR_NOT_IN_RANGE){
                        c.moveTo(lab, {range:1,})
                        return true
                    }
                    return (r === OK)
                } else if (c.room.terminal.store[resource]>0 && _.sum(c.carry)===0){
                    // It doesn't the have the resource, the creep!
                    // Go get some from the terminal if it can
                    console.log('here')
                    r = c.withdraw(c.room.terminal, resource)
                    if (r === ERR_NOT_IN_RANGE){
                        c.moveTo(c.room.terminal, {range:1,})
                        return true
                    }
                }
            } else {
                console.log('wrong mineral type in lab: '+lab.mineralType)
                // The lab has the wrong mineral in it, and it should be removed
                r = c.withdraw(lab, lab.mineralType)
                if (r === ERR_NOT_IN_RANGE){
                    c.moveTo(lab, {range:1,})
                    return true
                }

            }
        } else if (flag.name.includes('_boost')){
            // This lab won't need minerals, but it'll need energy!!!
            if (lab.energy > 1200)
                continue
            // Creep need energy first
            if (_.sum(c.carry)===0){
                return this.check_withdraw(c)
            } else if (c.carry.energy > 0){
                // Get the energy to the lab
                r = c.transfer(lab, RESOURCE_ENERGY)
                //console.log(r)
                if (r === ERR_NOT_IN_RANGE){
                    c.moveTo(lab, {range:1,})
                    return true
                }
                return (r === OK)
            }
        } else if (flag.name.includes('_make')){
            //Get the resource associated with the flag
            resource = flag.name.substring(0,flag.name.indexOf('_'))
            // If the creep is carrying something already, move on
            if (_.sum(c.carry)>0)
                continue
            // If the lab has the right mineral in it, move on
            if (_.contains(['null',resource], lab.mineralType))
                continue
            console.log('wrong mineral type')
            // The lab has the wrong mineral in it, and it should be removed
            r = c.withdraw(lab, lab.mineralType)
            if (r === ERR_NOT_IN_RANGE){
                c.moveTo(lab, {range:1,})
                return true
            }
        }
    }
    //Nothing useful to do with the labs. Maybe try mining?
    return false

},

check_gathering_place: function(c){

    c.job = 'check_gathering_place'

    var flag = f.get([c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes(c.memory.role) && f.name.includes('gather')}), 0])
    if (! flag)
        return false
    if (c.pos.getRangeTo(flag) > 0) {
        c.moveTo(flag)
        return true
    }
},

check_boosts: function(c){
    boosts = {
        role_restocker: ['KH', 'ZO'],
        role_mineral_miner: ['KH', 'ZO'],
    }
    for (i in boosts[c.memory.role]){
        resource = boosts[c.memory.role][i]
        var flag =  f.get([c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('_boost') && f.name.includes(resource+'_')}), 0])
        // There is no flag indicating that resource
        if (! flag)
            continue
        var lab = flag.pos.lookFor(LOOK_STRUCTURES)[0]
        console.log(lab)
        if (lab.mineralType != resource){
            console.log('The lab doesn\'t have the boost resource: '+resource)
            continue
        }
        if (lab.energy < LAB_BOOST_ENERGY || lab.mineralAmount < LAB_BOOST_MINERAL){
            console.log('The lab doesn\'t have enough energy or minerals to boost with')
            continue
        }
        // Ok, now try the boost and check the result
        // TODO this is also the result if the creep is already boosted, but far away
        r = lab.boostCreep(c)
        if (r === ERR_NOT_IN_RANGE){
            c.moveTo(lab, {range:1,})
            return true
        }
        // This means the creep is already boosted
        if (r === ERR_NOT_FOUND){
            return false
        }
        return true
    }
    return false
},

check_demolishion: function(c){
    // Check for safe mode
    if (c.room.controller && c.room.controller.safeMode){
        // Don't send any more
        Memory.room_strategy[c.room.name] = undefined
    }
    if (c.room.controller.my){
        // Something has gone horribly wrong. Please don't destroy anything in
        // my own room
        console.log('I won\'t break my own room!')
        return false
    }
    // Destroy stuff, starting with any demolish flags
    var flag = c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('demolish')})[0]
    if (flag){
        var struct = flag.pos.lookFor(LOOK_STRUCTURES)[0]
        if (! struct) {
            //flag.remove()
        } else {
            var r = c.dismantle(struct)   
            if (r == OK)
                return true
            else if (r == ERR_NOT_IN_RANGE){
                c.moveTo(struct, {range:1,})
                return true
            } else {
                console.log('returned '+r)
                return false
            }
        }
    }
    // There is no demolish flags. Look for the closest of: A tower with energy, or a spawn.
    var struct = c.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {range:1, 
        filter: function(s){
            return ((s.structureType == STRUCTURE_TOWER && s.energy > 0) ||
                (s.structureType == STRUCTURE_SPAWN) ||
                (s.structureType == STRUCTURE_EXTENSION))
    }});
    

},

check_healself: function(c){
    if (c.hits == c.hitsMax)
        return false
    else {
        var r = c.heal(c)
        if (r === OK)
            return true
        else
            return false
    }
},

check_renew: function(c){
    var r = undefined
    //console.log(c.body.map(b => b.type) == f.get(Memory.room_strategy, c.memory.home_room, c.memory.role, 'parts'))
    if (c.ticksToLive > 60 && c.ticksToLive < 1200){
        var spawn = c.pos.findInRange(FIND_STRUCTURES, 1, {filter: (s) => s.structureType == STRUCTURE_SPAWN && s.energy > 150})[0]
        if (spawn)
            r = spawn.renewCreep(c)
    }
    return (r === OK)
},

};
