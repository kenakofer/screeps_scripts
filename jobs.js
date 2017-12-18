var f = require('f')

module.exports = {
//TODO refactor this anyway?
check_withdraw: function(c, noCheckEmpty, nomove, leaveEnergyAmount){
    
    c.job = 'check_withdraw'
    if (c.picked_up) return false

    if (! leaveEnergyAmount)
        leaveEnergyAmount=0
        
    var needs = c.carryCapacity - _.sum(c.carry)
    if (needs == 0)
        return false
        
    if (noCheckEmpty || f.get_energy(c) == 0) {

    	//Check these structures, and only check terminals if the room has below half a storage full
    	//types = [STRUCTURE_CONTAINER, STRUCTURE_LINK]
    	//if (! (f.get_energy(c.room.storage) > 500000))
    	//	types.push(STRUCTURE_TERMINAL)
    	//Only allow restockers to take from storage if we are above half storage or if we don't have much energy in the terminal
        //TODO this should go into the can_withdraw function
    	/*if (c.memory.role !== 'role_restocker'
    			|| f.get_energy(c.room.terminal) < 1000
    			|| f.get_energy(c.room.storage) > 500000)
    		types.push(STRUCTURE_STORAGE)
                */

        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => 
                        //types.includes( s.structureType) &&
                        f.can_withdraw2(c, s)
                	&& f.get_energy(s) > needs + leaveEnergyAmount 
                	&& (!  (s.pos.lookFor('flag')[0] && ( s.pos.lookFor('flag')[0].name.includes('sender'))))               
        });
        if (store) {
            //Calculate how much can be given
            energyContained = store.energy
            if (! energyContained){
                energyContained = store.store.energy
            }
            if (! energyContained){
                console.log('whoops')
            }

            amount = _.min([energyContained - leaveEnergyAmount, needs])
            
            //Try to do the withdrawl
            r = c.withdraw(store, "energy", amount)
            if (r == ERR_NOT_IN_RANGE){
                if (nomove)
                    return false
                c.moveTo(store)
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
    //console.log('picking up: '+r)
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

    var dropped = c.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {maxOps:maxOps, 
        filter: (r) => r.resourceType == 'energy' && r.amount > c.carryCapacity
    })
    //console.log(JSON.stringify(dropped))
    if (! dropped)
    	return false

    var r = c.pickup(dropped)
    if (r == ERR_NOT_IN_RANGE){
        c.moveTo(dropped)
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
                            c.moveTo(to)
                            return true
                    }
                    if (r === OK) {
                            return true
                    }
                    console.log('Could not deposit energy: '+r)
            }
            else {
                    //TODO this segment may never get reached, since the restockers check_withdraw when they have no energy. Is it needed?
                    //Update: It is sometimes reached in W8N6
                    console.log('This strange segment is being reached by creep '+c.name)
                    //Withdraw from the giving structure
                    r = c.withdraw(from, RESOURCE_ENERGY)
                    if (r === ERR_NOT_IN_RANGE){
                            c.moveTo(to)
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
            c.moveTo(new RoomPosition(15, 15, roomName))
            return true
    }
    controller = get([Game.rooms[roomName], 'controller'])
    if (! controller){
            console.log('no controller in this room?')
            return false
    }
    r = c.signController(controller, message)
    if (r == ERR_NOT_IN_RANGE){
            c.moveTo(controller)
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
        r = c.attack(target) 
        if (r == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#f00', opacity: .6}});
            return target
        }
        if (r==OK)
            return target
    }
},

check_barracks: function(c){

    c.job = 'check_barracks'

    var flag = c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('barrack')})[0]
    if (flag){
        c.moveTo(flag.pos)
    }
    return flag
},

check_mining: function(c){

    c.job = 'check_mining'

    if ( (! c.memory.mining) && f.get_energy(c) == 0) {
        var mine = c.pos.findClosestByPath(FIND_SOURCES, {filter: (s) =>
        	//If there is a flag on the source position whose name is in memory, with the value of a currently living creep
            (! f.get(  [Game, 'creeps', [Memory, [s.pos.findInRange(FIND_FLAGS, 1), 0, 'name']]]  ))
            //TODO also if it's not in the room/not mining?
        })
        if (mine) {
            c.memory.mining = mine.id
        }
    } else if (c.memory.mining && f.get_energy(c) == c.carryCapacity) {
        c.memory.mining = false
    }
    if (c.memory.mining){
        var target = Game.getObjectById(c.memory.mining);
        if (c.harvest(target) == ERR_NOT_IN_RANGE){
            c.moveTo(target, {visualizePathStyle: {stroke: '#ff0', opacity: .3}})
        }
    }
    return c.memory.mining
},

check_spawn: function(c){

    c.job = 'check_spawn'

    if (f.get_energy(c) == 0 || (false === f.get([Memory, 'room_strategy', c.room.name, 'energy_need_filled'])) ){
        //If the creep has no energy or the spawn system is already full, we can't do it
        return false
    }
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_EXTENSION ||
            s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
        }
    });
    if (target) {
    	r = c.transfer(target, RESOURCE_ENERGY)
        if(r == ERR_NOT_IN_RANGE)
            c.moveTo(target, {visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
    }
    return target
},

check_towers: function(c){

    c.job = 'check_towers'

    if (f.get_energy(c) == 0)
            return false
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < (s.energyCapacity * .90)
    });
    if (target) {
        if(c.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
        }
    }
    return target
},

upgrade_controller: function(c) {

    c.job = 'upgrade_controller'

    var r = c.upgradeController(c.room.controller)
    
    if(r === ERR_NOT_IN_RANGE) {
        c.moveTo(c.room.controller, {visualizePathStyle: {stroke: '#00ff00', opacity: .3}});
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

    //console.log(store)
    //console.log(flag)
    c.moveTo(flag)
    r = c.transfer(store, "energy")
},

trucker_pickup:  function(c){
    c.job = 'trucker_pickup'
    if (_.sum(c.carry) > .5 * c.carryCapacity)
        return false
    //console.log(f.get([c, 'memory', 'pickup_flag']))
    flag = Game.flags[f.get([c, 'memory', 'pickup_flag'])]
    if (flag.pos.roomName != c.room.name){
        c.moveTo(flag)
        return true
    }
    store = flag.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s) => s.structureType == STRUCTURE_CONTAINER
    })[0]
    //console.log(store)
    //console.log(flag)
    if (flag.pos.roomName == c.room.name){
         r = c.withdraw(store, "energy")
         if (r == ERR_NOT_IN_RANGE)
            c.moveTo(flag)
        //console.log(r)
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
    //console.log('damaged: '+damagedStuff)
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

    if (c.room.name !== flag.pos.roomName){
        c.moveTo(flag)
        return true
    }
    
    var controller = pos.lookFor(LOOK_STRUCTURES)[0]

    if (controller) {
        
        //var r = c.claimController(controller)
        /*if( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], r)) {
            c.moveTo(pos);
            return true
        } 
        else
        if (r == ERR_GCL_NOT_ENOUGH) {*/
            if (_.contains(flag_name, 'actually')){
                if ( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.claimController(controller))) {
                    c.moveTo(pos);
                }
            }
            else 
                if ( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.reserveController(controller))) {
                    c.moveTo(pos);
                }
            return true
        /*
        }
        else if (r == OK) {
            Game.flags[flag_name].remove()
            message = 'Room '+controller.room.name+' has been claimed.'
            console.log(message)
            Game.notify(message)
            return false //Because we might still be able to do something else
        } 
        else {
            console.log("Could not claim controller: "+r)
            return false
        }*/
    }
    
},

check_room: function(c, roomName){
    c.job = 'check_room'

    if (c.room.name === roomName)
        return false //We're already there
    else {
        var r = c.moveTo(new RoomPosition(25,25, roomName), {visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
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
            //console.log(c.name+' is going next to '+nextRoom)
        }
        var r = c.moveTo(new RoomPosition(25,25, nextRoom), {visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
        //console.log('result: '+r)
        if (r == -2) {
            r = c.moveTo(new RoomPosition(25,25, nextRoom), {visualizePathStyle: {stroke: '#ff0', opacity: .3}, maxOps: 10000} )
        }
        if (Game.time % 2 == 0) c.say("to "+ c.memory.home_room)
        else c.say(' via '+nextRoom)
        c.memory['nextRoom']=nextRoom
        return c.memory.home_room
    }
},

check_construction: function(c, nomove){
    
    c.job = 'check_construction'

    var target = c.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target){
        var r = c.build(target)
        if (r == ERR_NOT_IN_RANGE && ! nomove) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#00f', opacity: .3}})
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
    types = types || [STRUCTURE_STORAGE, STRUCTURE_CONTAINER]
    distance = distance || 5

    c.job = 'check_store'
    //console.log(c.memory.role + 'check_store')

    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  ((_.contains(types, s.structureType) ||
                            (s.pos.lookFor('flag')[0] && s.pos.lookFor('flag')[0].name.includes('store'))) &&
                            s.store.energy < s.storeCapacity)
        });
        if (store) {
            //console.log(store)
            r = c.transfer(store, "energy")
            //Only go out of your way to store energy if you're full or a restocker, and the store is close by
            if (r == ERR_NOT_IN_RANGE && 
                (_.sum(c.carry) == c.carryCapacity || c.memory.role=='role_restocker')
                && c.pos.getRangeTo(store) < distance){
                    c.moveTo(store)
                    return store
            }
            if (r==OK) {
                return store
            }
        }
    }
},

//TODO add parameter for movement?
check_store_link: function(c){

    c.job = 'check_store_link'

    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  s.structureType == STRUCTURE_LINK && s.energy < s.energyCapacity
        });
        if (store) {
            var r = c.transfer(store, 'energy')
            if (r == ERR_NOT_IN_RANGE){
                //Never go out of your way?
                //c.moveTo(store)
                //return store
            }
            if (r==OK) {
                return store
                
            }
        }
    }
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
}

};
