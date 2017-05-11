var f = require('f')
var room_strategy = require('room_strategy')

module.exports = {


run_tower: function(t) {
    
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
},

run_link: function(l){
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
},

check_terminals: function(){
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
},

};