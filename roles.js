var jobs = require('jobs')

module.exports = {

role_solominer: {

    run: function(c) {
        jobs.check_ondropped(c);
        //Alternate between storing in storage/containers and storing in links. Don't check every turn to save CPU
        if (Game.time % 4 == 0)
            jobs.check_store(c)
        else if (Game.time % 4 == 2)
            jobs.check_store_link(c)
        
        jobs.check_solomining(c, c.memory.mining_flag)
        //|| check_construction(c)
    },
},

role_claimer: {
    parts: [WORK, CARRY, CLAIM, MOVE, MOVE, MOVE],

    run: function(c) {
        jobs.claim_controller(c, c.memory.claiming_flag) ||
        //To build up a possibly newly claimed room:
        jobs.check_mining(c) ||
        jobs.check_spawn(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 
        
    },
},

role_harvester: {
    run: function(c) {
        jobs.check_ondropped(c);
        jobs.check_invaders(c) || 
        jobs.check_mining(c) || 
        jobs.check_spawn(c) ||
        jobs.check_towers(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 
    },
},

role_restocker: {
    run: function(c) {
        jobs.check_ondropped(c);

        jobs.check_withdraw(c) ||
        jobs.check_mining(c) ||
        jobs.check_spawn(c) ||
        jobs.check_towers(c) ||
        jobs.check_terminal(c) ||
        jobs.check_dropped(c) ||
        jobs.check_home_room(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 

        //console.log(c.name+': '+s)
    },
},

role_guard: {
    run: function(c) {
        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.check_barracks(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 
    },
},

role_upgrader: {
    run: function(c) {
        //c.say('hi')
        jobs.check_ondropped(c);
        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.check_withdraw(c) ||
        jobs.check_mining(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do')

    },
},

role_builder: {
    run: function(c) {
        //c.say('hi')
        jobs.check_ondropped(c);
        jobs.check_invaders(c) ||
        jobs.check_withdraw(c) ||
        jobs.check_mining(c) ||
        jobs.check_home_room(c) ||
        jobs.check_construction(c) ||
        //check_spawn(c) ||
        //check_towers(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 

    },
},

role_courier: {
    message: 'Peace!',
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
    },
},

// A role whose goal is that every controller should be signed by me. 
role_signer: {
	message: function(c) {
		return "Signed by "+c.name+" in service of kenanbit, The One True Instructor, from whom all scripting flows."
	},
	parts: [MOVE],

	run: function(c) {

		if (functions.get([Game.flags, c.memory.flag])){
			c.notifyWhenAttacked(false)
			jobs.sign_controller(c, Game.flags[c.memory.flag].pos.roomName, this.message(c))
		}
	},
}

}
