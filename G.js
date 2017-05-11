var default_parts = [MOVE,CARRY,WORK];
var spawn_priority = ['role_harvester', 'role_restocker', 'role_guard', 'role_upgrader', 'role_builder']

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

room_strategy = {
    'E47N87': {
        'role_harvester': {
                desired_number: 1,
                parts: default_parts,
        },
        'role_upgrader': {
                desired_number: 1,
                parts: default_parts,
        },
        'role_builder': {
                desired_number: 3,
                parts: default_parts,
        },
        'role_guard': {
                desired_number: 0,
                parts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],
        },
        'role_restocker': {
                desired_number: 0,
                parts: [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
        },
        'role_solominer': {
            parts: [MOVE, WORK, WORK, WORK, WORK, WORK, CARRY]
            //desired number is determined by flags in the room
        },
        'constructedWall': {
            desired_hits: 50000
        },
        'rampart': {
            desired_hits: 40000
        },
    },
}


function census(justCount, home_room){
        
    roles={};
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.home_room == home_room){
            var r = creep.memory.role;
            if (! (r in roles)) {
                roles[r] = [creep];
            } else {
                roles[r].push(creep);
            }
        }
    }
    if (justCount)
        return _.mapValues(roles, function(list) {return list.length} )
    else
        return roles;
}

function check_population(){
    for (roomName in Game.rooms) {
        var spawn = Game.rooms[roomName].find(FIND_MY_SPAWNS)[0]
        var roles = census(false, roomName)
        //Replace base classes as they die
        for (var i in spawn_priority) {
            r = spawn_priority[i]
            number = get([room_strategy, roomName, r, 'desired_number'])
            if ( number && ((! roles[r]) || roles[r].length < room_strategy[roomName][r].desired_number)) {
                var spawnAt = spawn
                if (room_strategy[roomName]
                    && room_strategy[roomName][r]
                    && room_strategy[roomName][r].spawn_room){
                    spawnAt = Game.rooms[ room_strategy[roomName][r].spawn_room ].find(FIND_MY_SPAWNS)[0]
                }
                if (spawnAt) {
                    
                    //console.log("wanna spawn a "+r+" in room "+spawnAt.room.name+" for "+roomName)
                    
                    spawnAt.createCreep(room_strategy[roomName][r].parts, {role: r, home_room: roomName})
                    console.log('wanna spawn a ' + r)
                    break;
                }
            }
        }
    }

    //Create creeps in 1-1 correspondance with special flags
    for (var f_name in Game.flags){
        
        //Create solominers
        if (f_name.includes('solomine')){
            if (! get([Game, 'creeps', [Memory, f_name]])) {
                
                var mine_in_room = Game.flags[f_name].room.name
                var spawn_in_room = mine_in_room
                
                if (room_strategy[mine_in_room].role_solominer.spawn_room) {
                    spawn_in_room = room_strategy[mine_in_room].role_solominer.spawn_room
                }
                var spawn = Game.rooms[spawn_in_room].find(FIND_MY_SPAWNS)[0];
                
                //There is no creep mining this location, so let's create one!
                parts = room_strategy[roomName]['role_solominer'].parts
                var r = spawn.createCreep(parts, {role: "role_solominer", home_room: mine_in_room, mining_flag: f_name});
                if (_.isString(r))
                    Memory[f_name] = r
            }
        }

        //Create creep to claim a controller
        //TODO where? it matters.../TODO
        if (f_name.includes('claim') && ( !('role_claimer' in roles)) && (! get([Game, 'creeps', [Memory, f_name]]))){
            //There is no creep claiming this location, so let's create one!
            console.log("Wanna make a claimer for "+f_name)
            var r = Game.spawns.Spawn1.createCreep(role_claimer.parts, {role: "role_claimer", home_room: 'W7N3', claiming_flag: f_name});
            if (_.isString(r)){
                Memory[f_name] = r;
            }
        }
        
        //Create a creep to bring peace to arbitrary flags
        if (f_name.includes('courier') && (! get([Game, 'creeps', [Memory, f_name]]))){
            var r = Game.spawns.Spawn1.createCreep(role_courier.parts, {role: "role_courier", home_room: 'W7N3', flag: f_name});
            if (_.isString(r)){
                Memory[f_name] = r;
            }
        }
    }
}

/*
Takes the field address of some desired value, and either returns it, or returns undefined if the field or a parent doesn't exist
[Game,'creeps',[Memory, 'f_name']] => is defined: Game['creeps'][Memory['f_name']
*/
function get(list) {
	if (arguments.length !== 1){
		message = "Function takes exactly one argument! Did you forget to make it a list?"
		console.log(message);
		throw message;
	}
	if (typeof list !== 'object')
		return list // Not actually a list, but a primitive of some sort
	if (list.length === 0)
		return undefined

	var val = list[0]
	for (var i = 1; i < list.length; i++) {
		if (val === undefined || val === null || typeof val !== 'object')
			return undefined //Won't be able to fetch a subvalue of this thing, so call it off before we fail
		var sub_val = get(list[i])
		if (sub_val === undefined)
			return undefined
		val = val[sub_val.toString()]
	}
	return val
}

function check_invaders(c){
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
}

function check_barracks(c){
    var flag = c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('barrack')})[0]
    if (flag){
        c.moveTo(flag.pos)
    }
    return flag
}

function check_mining(c){
    if ( (! c.memory.mining) && get_energy(c) == 0) {
        var mine = c.pos.findClosestByPath(FIND_SOURCES, {filter: (s) =>
        	//If there is a flag on the source position whose name is in memory, with the value of a currently living creep
            (! get(  [Game, 'creeps', [Memory, [s.pos.lookFor('flag')[0], 'name']]]  ))
            //TODO also if it's not in the room/not mining?
        })
        if (mine) {
            c.memory.mining = mine.id
        }
    } else if (c.memory.mining && get_energy(c) == c.carryCapacity) {
        c.memory.mining = false
    }
    if (c.memory.mining){
        var target = Game.getObjectById(c.memory.mining);
        if (c.harvest(target) == ERR_NOT_IN_RANGE){
            c.moveTo(target, {visualizePathStyle: {stroke: '#ff0', opacity: .3}})
        }
    }
    return c.memory.mining
}

function check_spawn(c){
	if (get_energy(c) == 0)
		return false
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
}

function check_towers(c){
	if (get_energy(c) == 0)
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
}

function upgrade_controller(c) {
    var r = c.upgradeController(c.room.controller)
    
    if(r === ERR_NOT_IN_RANGE) {
        c.moveTo(c.room.controller, {visualizePathStyle: {stroke: '#00ff00', opacity: .3}});
        return c.room.controller
    }
    else if (r===OK){
        //Try to pull more energy from any storage that might be nearby, but only if there is enough to fill up and leave some for other important stuff, like maybe restockers want it
        check_withdraw(c, true, true, 100)
        return true
    }
    return false
}

function claim_controller(c, flag_name){
    var flag = Game.flags[flag_name]
    if (! flag)
        return false

    var pos = flag.pos
    var controller = pos.lookFor(LOOK_STRUCTURES)[0]

    if (controller) {
        
        var r = c.claimController(controller)
        if( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], r)) {
            c.moveTo(pos);
            return true
        } 
        else if (r == ERR_GCL_NOT_ENOUGH) {
            if( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.reserveController(controller))) {
                c.moveTo(pos);
            }
            return true
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
        }
    }
    
}

function check_home_room(c) {
	if (! c.memory.home_room){
		c.memory.home_room = c.room.name
		return false //We've decided this is home
	}
    if (c.room.name === c.memory.home_room)
        return false //We're already there
    else {
        var r = c.moveTo(new RoomPosition(25,25, c.memory.home_room), {visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
        c.say("to "+ c.memory.home_room)
        return c.memory.home_room
    }
}

function check_construction(c){
    var target = c.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target){
        var r = c.build(target)
        if (r == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#00f', opacity: .3}})
            return target
        }
        if (r==OK)
            return target
    }
}

function check_store(c){
    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  (s.structureType == STRUCTURE_STORAGE ||
                            s.structureType == STRUCTURE_CONTAINER) &&
                            s.store.energy < s.storeCapacity
                            
        });
        //TODO change or remove this to help solominers not wander away
        if (store) {
            r = c.transfer(store, "energy")
            //Only go out of your way to store energy if you're full
            if (r == ERR_NOT_IN_RANGE && get_energy(c) == c.carryCapacity){
                c.moveTo(store)
                return store
            }
            if (r==OK)
                return store
        }
    }
}

//TODO add parameter for movement?
function check_store_link(c){
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
    
}

//TODO finish
function get_energy(structure){
	if (! structure)
		return 0
	if ( [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL].includes(structure.structureType) ) {
		return structure.store.energy
	} else if (structure.structureType === STRUCTURE_LINK) {
		return structure.energy
	} else if ( get([structure, 'carry', 'energy']) !== undefined){
		//It's actually a creep :)
		return structure.carry.energy
	}
	return 0
}

//TODO refactor this anyway?
function check_withdraw(c, noCheckEmpty, nomove, leaveEnergyAmount){
    if (! leaveEnergyAmount)
        leaveEnergyAmount=0
        
    var needs = c.carryCapacity - _.sum(c.carry)
    if (needs == 0)
        return false
        
    if (noCheckEmpty || get_energy(c) == 0) {

    	//Check these structures, and only check terminals if the room has below half a storage full
    	types = [STRUCTURE_CONTAINER, STRUCTURE_LINK]
    	if (! (get_energy(c.room.storage) > 500000))
    		types.push(STRUCTURE_TERMINAL)
    	//Only allow restockers to take from storage if we are above half storage or if we don't have much energy in the terminal
    	if (c.memory.role !== 'role_restocker'
    			|| get_energy(c.room.terminal) < c.carryCapacity
    			|| get_energy(c.room.storage) > 500000)
    		types.push(STRUCTURE_STORAGE)

        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => types.includes( s.structureType)
                	&& get_energy(s) > needs + leaveEnergyAmount 
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
}

function check_solomining(c, flag_name){
    if ( (! Game.flags[flag_name]) || get_energy(c) == c.carryCapacity)
        return false
    var target = Game.flags[flag_name].pos.lookFor('source')[0] //GOTCHA: It return a list, in this case a list of one...
    
    if (target){
        var r = c.harvest(target)
        if (r == ERR_NOT_IN_RANGE){
            c.moveTo(target, {visualizePathStyle: {stroke: '#ff0', opacity: .3}});
        }
        return target
    }
}

//TODO upgraders and maybe others don't pick up resources next to them while upgrading? Maybe it's because they are withdrawing from a neighboring container too quickly.
function check_ondropped(c){
    var dropped = c.pos.findInRange(FIND_DROPPED_ENERGY, 1)[0]
    if (!dropped)
    	return false
    r = c.pickup(dropped)
    //console.log('picking up: '+r)
    return dropped
}

function check_dropped(c){
    var dropped = c.pos.findClosestByPath(FIND_DROPPED_ENERGY)
    if (! dropped)
    	return false

    var r = c.pickup(dropped)
    if (r == ERR_NOT_IN_RANGE){
        c.moveTo(dropped)
        return dropped
    }
    if (r == OK)
        return dropped
}

function check_terminal(c) {
	terminal = c.room.terminal; 
	storage = c.room.storage
	if (terminal && storage){
		if (get_energy(storage) > storage.storeCapacity * 2/3){
			//Energy surplus here, so take from the storage to the terminal
			from = storage; to = terminal
		}
		else if (get_energy(storage) < storage.storeCapacity / 2 && get_energy(terminal) > 0) {
			//Energy deficit here, so take from the terminal and place into storage
			from = terminal; to = storage
		} else {
			//Energy balanced here. No giving or receiving
			return false
		}

		if (get_energy(c) > 0){
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
			console.log(from)
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
}

var role_solominer = {

    run: function(c) {
        check_ondropped(c);
        //Alternate between storing in storage/containers and storing in links. Don't check every turn to save CPU
        if (Game.time % 4 == 0)
            check_store(c)
        else if (Game.time % 4 == 2)
            check_store_link(c)
        
        check_solomining(c, c.memory.mining_flag)
        //|| check_construction(c)
    },
}

var role_claimer = {
    parts: [WORK, CARRY, CLAIM, MOVE, MOVE, MOVE],

    run: function(c) {
        claim_controller(c, c.memory.claiming_flag) ||
        //To build up a possibly newly claimed room:
        check_mining(c) ||
        check_spawn(c) ||
        upgrade_controller(c)
        
    },
}

var role_harvester = {
    run: function(c) {
	c.say('hi')
        check_ondropped(c);
        check_invaders(c) || 
        check_mining(c) || 
        check_spawn(c) ||
        check_towers(c) ||
        upgrade_controller(c);
    },
}

var role_restocker = {
    run: function(c) {
        check_ondropped(c);

        !(s='withdawing') ||
        check_withdraw(c) ||
        !(s='mining') ||
        check_mining(c) ||
        !(s='spawn refill') ||
        check_spawn(c) ||
        !(s='tower refill') ||
        check_towers(c) ||
        !(s='terminal filling/withdrawing') ||
        check_terminal(c) ||
        !(s='finding dropped stuff') ||
        check_dropped(c) ||
        !(s='checking my home room') ||
        check_home_room(c) ||
        !(s='I have nothing to do...')

        //console.log(c.name+': '+s)
    },
}

var role_guard = {
    run: function(c) {
        check_invaders(c) ||
        check_home_room(c) ||
        check_barracks(c)
    },
}

var role_upgrader = {
    run: function(c) {
        //c.say('hi')
        check_ondropped(c);
        check_invaders(c) ||
        check_home_room(c) ||
        check_withdraw(c) ||
        check_mining(c) ||
        upgrade_controller(c);
    },
}

var role_builder = {
    run: function(c) {
        //c.say('hi')
        check_ondropped(c);
        check_invaders(c) ||
        check_withdraw(c) ||
        check_mining(c) ||
        check_home_room(c) ||
        check_construction(c) ||
        //check_spawn(c) ||
        //check_towers(c) ||
        upgrade_controller(c);
    },
}

var role_courier = {
    message: '🙏peace!',
    parts: [MOVE],
    
    run: function(c) {
        if (c.memory.flag) {
            c.notifyWhenAttacked(false)
            c.say(this.message, true);
            c.moveTo(Game.flags[c.memory.flag])
        }
        else {
            c.say("???")
        }
    }
}

// A role whose goal is that every controller should be signed by me. 
var role_signer = {
	message: function(c) {
		return "Signed by "+c.name+" in service of kenanbit, The One True Instructor, from whom all scripting flows."
	},
	parts: [MOVE],

	run: function(c) {

		if (get([Game.flags, c.memory.flag])){
			c.notifyWhenAttacked(false)
			sign_controller(c, Game.flags[c.memory.flag].pos.roomName, this.message(c))
		}
	}
}

function sign_controller(c, roomName, message){
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
}

function run_tower(t) {
    
    //First attack enemies in room
    var enemy = t.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
    if (enemy) {
        t.attack(enemy)
        return
    }
    //Next look for my injured creeps
    var injuredCreep = t.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: (c) => c.hits < c.hitsMax
    })
    if (injuredCreep){
        t.heal(injuredCreep)
        return
    }
    if (t.energy < t.energyCapacity/2){
        //Don't move on to repairing things, but conserve energy in case of attack
        return
    }
    //Repair broken structures
    var roomName = t.room.name
    var closestDamaged = t.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => {
        	if (s.hits < s.hitsMax - 500) {
        		desired_hits = get([room_strategy, roomName, s.structureType, 'desired_hits'])
        		if (! desired_hits)
        			desired_hits = 30000
        		return s.hits < desired_hits
        	}
        	return false
        }
    });
    if (closestDamaged) {
        t.repair(closestDamaged);
    }
}

function run_link(l){
    var shouldSend = (l.energy > l.energyCapacity / 2 && l.pos.lookFor('flag')[0].name.includes('sender') );
    if (shouldSend){
        var flagReceive = l.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('receiver')})[0]
        if (flagReceive){
            var linkReceive = _.filter(
                flagReceive.pos.lookFor(LOOK_STRUCTURES), 
                function (s) {return s.structureType == 'link'}
            )[0]
            l.transferEnergy(linkReceive)
        }
        
    }
}

function check_terminals(){
	surplus_terminals = []
	var most_deficit_room
	var most_deficit_amount = 333333 //One third capacity of storage
	for (roomName in Game.rooms){
		room = Game.rooms[roomName]
		terminal = room.terminal; 
		storage = room.storage
		if (terminal && storage){
			total = get_energy(storage) + get_energy(terminal)
			if (total > storage.storeCapacity / 2 && get_energy(terminal) > 200){
				//Energy surplus here, so take from the storage to the terminal
				surplus_terminals.push(terminal)
			}
			if (total < most_deficit_amount) {
				most_deficit_room = roomName
				most_deficit_amount = total
			}
		}
	}
	if (! most_deficit_room)
		return false
	//Now we have a list of sending terminals and a room to send to. Let's do it!
	for (i in surplus_terminals){

		t = surplus_terminals[i]
		e = get_energy(t)
		amount = (e*e) / (e + Game.market.calcTransactionCost(e, t.room.name, most_deficit_room))
		amount = _.floor(amount)
		can_accept = TERMINAL_CAPACITY - _.sum(Game.rooms[most_deficit_room].terminal.store)
		amount = _.min([amount, can_accept])

		if (amount < 100)
			return false

		r = surplus_terminals[i].send(RESOURCE_ENERGY, amount, most_deficit_room)
		if (r === OK) {
			console.log('Successfully tranferred '+amount+' energy from '+t.room.name+' to '+most_deficit_room)
			return true //In order to avoid duplicate transactions from different senders toward the same room
		}
		else
			console.log('Failed to tranfer '+amount+' energy from '+t.room.name+' to '+most_deficit_room+': '+r)

	}
}

function run_tick(){
    for (var name in Game.creeps){
        var c = Game.creeps[name];
        if (! c.spawning) {
	        if (c.memory.role && this[c.memory.role]){
	            //c.say(c.memory.role)
	            this[c.memory.role].run(c)
	        }
	        else {
	            console.log(c.name+" has no recognized role: "+c.memory.role)
	            role_harvester.run(c)
	        }
	    }
    }

    if (Game.time % 3 === 1)
    	check_population()
    



    var towers = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_TOWER); 
    for (i = 0; i < towers.length; i++) { run_tower(towers[ i ]); }
    
    if (! (Game.time % 9)) {
    	var links = _.filter(Game.structures, (s) => s.structureType == STRUCTURE_LINK);
   		for (i = 0; i < links.length; i++) { run_link(links[ i ]); }
   	}

    if (! (Game.time % 30)) {
    	check_terminals()
    }

    //cpuTrack(10,100,1000,10000)
}

//It keeps running track of the cpu across different time intervals. It's not exactly an average, but I think it's close...
function cpuTrack(){
	for (i in arguments){
		t = arguments[i]
		if ( [undefined, null].includes(Memory.cpuTrack[t]))
			Memory.cpuTrack[t] = Game.cpu.getUsed()
		else
			Memory.cpuTrack[t] = ( (t-1)*Memory.cpuTrack[t] + Game.cpu.getUsed()) / t
	}
	console.log(JSON.stringify(Memory.cpuTrack))
}

module.exports = {
    census,
    default_parts,
    check_population,
    check_invaders,
    role_harvester,
    role_restocker,
    role_builder,
    role_upgrader,
    role_guard,
    role_solominer,
    role_courier,
    role_claimer,
    role_signer,
    run_tower,
    run_link,
    get,
    get_energy,
    run_tick
};

