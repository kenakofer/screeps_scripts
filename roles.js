var jobs = require('jobs')
var f = require('f')

module.exports = {

role_solominer: {

    run: function(c) {
        var r = OK
        if (Game.time % 2 == 0) {
            //prioritize the link, other storage is overflow
            r = jobs.check_store_link(c) || jobs.check_store(c)        
        }
        jobs.check_solomining(c, c.memory.mining_flag)
        || jobs.check_construction(c, true) //Set the nomove parameter so they don't wander away. This is useful mainly for constructing the containers they will store in.
        if (! r && r !== OK){
            // An attempt to store energy failed, so drop the energy on the ground instead
            c.drop(RESOURCE_ENERGY)
        }
    },
},

role_claimer: {
    parts: [WORK, CARRY, CLAIM, MOVE, MOVE, MOVE],

    run: function(c) {
        jobs.check_home_room(c) ||
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

        if (jobs.check_home_room(c))
            return true

        jobs.check_ondropped(c);

        jobs.check_dropped(c, true, 50) ||
        jobs.check_mining(c) || 
        jobs.check_spawn(c) ||
        jobs.check_towers(c) ||
        jobs.check_construction(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do');
    },
},

role_mineral_miner: {
    run: function(c) {
        jobs.check_labs(c) ||
        jobs.check_mineral_mining(c) || 
        jobs.check_store_minerals(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do');
    },
},

role_trucker: {
    run: function(c) {
        jobs.check_ondropped(c);
        jobs.repair_nomove(c);

        jobs.trucker_pickup(c) ||
        jobs.trucker_dropoff(c)

    }
},

role_restocker: {
    run: function(c) {
        if (! f.get([Memory, c.id, 'inactive_level'])) Memory[c.id] = {'inactive_level':0, }
        var il = f.get([Memory, c.id, 'inactive_level'])
        //console.log(il)

        jobs.check_ondropped(c);
        //jobs.check_renew(c);

        if ( il==0 || (Game.time%5 === 2)){
            r =
            jobs.check_store_minerals(c) ||
            jobs.check_withdraw(c) ||

            jobs.check_dropped(c, true, 40) ||
            jobs.check_mining(c) ||
            jobs.check_spawn(c) ||
            jobs.check_towers(c) ||
            jobs.check_home_room(c) ||
            jobs.check_store(c, [STRUCTURE_STORAGE, STRUCTURE_TERMINAL], 20) ||
            jobs.check_dropped(c) ||
            jobs.check_gathering_place(c)
            if (r) {
                Memory[c.id].inactive_level=0
                return
            }
        }
        Memory[c.id].inactive_level++
        (c.job = 'Nothing to do');
    },
},

role_guard: {
    run: function(c) {
        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.goto_flag(c, 'barracks') ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 
    },
},

role_upgrader: {
    run: function(c) {
        jobs.check_ondropped(c);

        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.check_withdraw(c, false, false) ||
        jobs.check_dropped(c, true, 200) ||
        jobs.check_mining(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do');
    },
},

role_builder: {
    run: function(c) {
        // Don't pick up anything if it's in the wrong room, that will only slow
        // it down
        if (jobs.check_home_room(c))
            return

        jobs.check_ondropped(c);

        jobs.check_invaders(c) ||
        jobs.check_withdraw(c, false, false) || 
        jobs.check_dropped(c, true, 200) ||
        jobs.check_mining(c) ||
        jobs.check_construction(c) ||
        //check_spawn(c) ||
        //check_towers(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do');
    },
},

role_demolisher: {
    run: function(c) {
        jobs.check_healself(c);

        // Move to the target room, and just destroy stuff.
        jobs.check_home_room(c) ||
        jobs.check_demolishion(c) ||
        (c.job = 'Nothing to do');
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
    parts: [MOVE],
    message: function(c) {
        return "Signed by "+c.name+" in service of kenanbit, The One True Instructor, from whom all scripting flows."
    },

    run: function(c) {
        if (functions.get([Game.flags, c.memory.flag])){
            c.notifyWhenAttacked(false)
            jobs.sign_controller(c, Game.flags[c.memory.flag].pos.roomName, this.message(c))
        }
    },
}

}
