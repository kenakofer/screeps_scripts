var f = require('f')
//var room_strategy = require('room_strategy')

module.exports = {


run_tower: function(t) {


    // The inactivity level for the tower corresponds to how long it's been since the
    // tower did anything. It will make fewer checks if it hasn't done anything in a while
    if (! f.get([Memory, t.id, 'inactive_level'])) Memory[t.id] = {'inactive_level':0, }
    
    var inactive_level = f.get([Memory, t.id, 'inactive_level'])
    //console.log(inactive_level)

    //First attack enemies in room
    var enemy = t.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
    if (enemy) {
        Memory[t.id].inactive_level=0 
        t.attack(enemy)
        return
    }

    //Do all the following conditional on how inactive the tower has been
    if (inactive_level==0 || (inactive_level <= 3 && Game.time%5 === 1) || (Game.time%25 === 1)){

        //Next look for my injured creeps
        var injuredCreep = t.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => c.hits < c.hitsMax
        })
        if (injuredCreep){
            Memory[t.id].inactive_level=0
            t.heal(injuredCreep)
            return
        }
        if (t.energy < t.energyCapacity/2){
            //Don't move on to repairing things, but conserve energy in case of attack
            //If we made it here, there is nothing to do at the moment, so our inactive level can go up
            Memory[t.id].inactive_level++;
            return
        }
        //Repair broken structures
        var roomName = t.room.name
        var closestDamaged = t.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
                    if (s.hits < s.hitsMax - 500) {
                            //desired_hits = f.get([Memory, 'room_strategy', roomName, s.structureType, 'desired_hits'])
                            //if (! desired_hits)
                            //        desired_hits = 10000
                            desired_hits = f.get_desired_hits(s)
                            return s.hits < desired_hits
                    }
                    return false
            }
        });
        if (closestDamaged) {
            Memory[t.id].inactive_level=0
            t.repair(closestDamaged);
            return
        }

        //If we made it here, there is nothing to do at the moment, so our inactive level can go up
        Memory[t.id].inactive_level++;
    }
},

run_link: function(l){
    var flagSend = _.filter(
        l.pos.lookFor('flag'),
        function (f) { return f.name.includes('sender') }
    )[0]
    //console.log(flagSend)
    var shouldSend = ( (l.energy > (l.energyCapacity / 2)) && flagSend );
    //console.log(shouldSend)
    if (shouldSend){
        var flagReceive = l.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('receiver')})[0]
        if (flagReceive){
            var linkReceive = _.filter(
                flagReceive.pos.lookFor(LOOK_STRUCTURES), 
                function (s) {return s.structureType == 'link'}
            )[0]
            r = l.transferEnergy(linkReceive)
            //console.log(r)
        }
        
    }
},

check_terminals: function(){
	surplus_terminals = []
	var most_deficit_room = undefined
	var most_deficit_amount = 333333 //One third capacity of storage
	for (roomName in Game.rooms){
		room = Game.rooms[roomName]
		terminal = room.terminal; 
		storage = room.storage
		if (terminal && storage){
			total = f.get_energy(storage) + f.get_energy(terminal)
			if (total > storage.storeCapacity / 2 && f.get_energy(terminal) > 20000){
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
