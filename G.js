var roles = require('roles')
var f = require('f')
var room_strategy = require('room_strategy')



var spawn_priority = ['role_harvester', 'role_restocker', 'role_guard', 'role_upgrader', 'role_builder']

//TODO make room_strategy a module
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



function census(justCount, home_room){
        
    role_count={};
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.home_room == home_room){
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
}

function check_population(){
    for (roomName in Game.rooms) {
        var spawn = Game.rooms[roomName].find(FIND_MY_SPAWNS)[0]
        var role_count = census(false, roomName)
        //Replace base classes as they die
        for (var i in spawn_priority) {
            r = spawn_priority[i]
            number = f.get([room_strategy, roomName, r, 'desired_number'])
            if ( number && ((! role_count[r]) || role_count[r].length < number)) {
                var spawnAt = spawn
                if (room_strategy[roomName]
                    && room_strategy[roomName][r]
                    && room_strategy[roomName][r].spawn_room){
                    spawnAt = Game.rooms[ room_strategy[roomName][r].spawn_room ].find(FIND_MY_SPAWNS)[0]
                }
                if (spawnAt) {
                    
                    //console.log("wanna spawn a "+r+" in room "+spawnAt.room.name+" for "+roomName)
                    
                    spawnAt.createCreep(room_strategy[roomName][r].parts, {role: r, home_room: roomName})
                    break;
                }
            }
        }
    }

    //Create creeps in 1-1 correspondance with special flags
    for (var f_name in Game.flags){
        
        //Create solominers
        if (f_name.includes('solomine')){
            if (! f.get([Game, 'creeps', [Memory, f_name]])) {
                
                var mine_in_room = Game.flags[f_name].room.name
                var spawn_in_room = mine_in_room
                
                //TODO use get
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
        if (f_name.includes('claim') && ( !('role_claimer' in role_count)) && (! f.get([Game, 'creeps', [Memory, f_name]]))){
            //There is no creep claiming this location, so let's create one!
            console.log("Wanna make a claimer for "+f_name)
            var r = Game.spawns.Spawn1.createCreep(roles['role_claimer'].parts, {role: "role_claimer", home_room: 'W7N3', claiming_flag: f_name});
            if (_.isString(r)){
                Memory[f_name] = r;
            }
        }
        
        //Create a creep to bring peace to arbitrary flags
        if (f_name.includes('courier') && (! f.get([Game, 'creeps', [Memory, f_name]]))){
            var r = Game.spawns.Spawn1.createCreep(roles['role_courier'].parts, {role: "role_courier", home_room: 'W7N3', flag: f_name});
            if (_.isString(r)){
                Memory[f_name] = r;
            }
        }
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
        		desired_hits = f.get([room_strategy, roomName, s.structureType, 'desired_hits'])
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
			total = f.get_energy(storage) + f.get_energy(terminal)
			if (total > storage.storeCapacity / 2 && f.get_energy(terminal) > 200){
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
		e = f.get_energy(t)
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

            //c.say(c.memory.role)

            //TODO use get
	        if ( f.get([roles, c.memory.role, 'run'])) {
	            
	            roles[c.memory.role].run(c)
	        }
	        else {
	            console.log(c.name+" has no recognized role with a run function: "+c.memory.role)
	            roles['role_harvester'].run(c)
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

    cpuTrack(1,10,100,1000,10000)
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
	//console.log(JSON.stringify(Memory.cpuTrack))
}

module.exports = {
    census,
    check_population,
    run_tower,
    run_link,
    run_tick
};
