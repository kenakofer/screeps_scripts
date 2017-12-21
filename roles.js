var jobs = require('jobs')
var f = require('f')

module.exports = {

role_solominer: {

    run: function(c) {
        //Alternate between storing in storage/containers and storing in links. Don't check every turn to save CPU
        var r = OK
        if (! c.memory.mining_flag.includes('link')){
            if (Game.time % 4 == 0)
                r = jobs.check_store(c)
            else if (Game.time % 4 == 2)
                r = jobs.check_store_link(c)
        } else if (Game.time % 2 == 0) {
            //Link is in the flag name, so prioritize the link, storage is overflow
            r = jobs.check_store_link(c) || jobs.check_store(c)        
        }
        if (c.memory.mining_flag.includes('remote'))
            jobs.repair_nomove(c)
        jobs.check_solomining(c, c.memory.mining_flag)
        || jobs.check_construction(c, true) //Set the nomove parameter so they don't wander away. This is useful mainly for constructing the containers they will store in.
        if (r === false){
            // An attempt to store energy failed, so drop the energy on the ground instead
            c.drop(RESOURCE_ENERGY)
        }
        //jobs.check_ondropped(c);
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
        jobs.check_ondropped(c);

        jobs.check_invaders(c) || 
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

        if ( il==0 || (Game.time%5 === 2)){
            r =
            jobs.check_dropped(c, true, 40) ||
            jobs.check_withdraw(c) ||
            jobs.check_mining(c) ||
            jobs.check_spawn(c) ||
            jobs.check_towers(c) ||
            jobs.check_terminal(c) ||
            jobs.check_dropped(c) ||
            jobs.check_home_room(c) ||
            jobs.check_store(c, [STRUCTURE_STORAGE], 20) ||
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
        jobs.check_barracks(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do') 
    },
},

role_upgrader: {
    run: function(c) {
        jobs.check_ondropped(c);

        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.check_withdraw(c, false, false, 300) || //Leave energy for the restockers
        jobs.check_dropped(c, true, 50) ||
        jobs.check_mining(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
        (c.job = 'Nothing to do');
    },
},

role_builder: {
    run: function(c) {
        jobs.check_ondropped(c);

        jobs.check_dropped(c, true, 40) ||
        jobs.check_invaders(c) ||
        jobs.check_home_room(c) ||
        jobs.check_withdraw(c, false, false, 300) || //Leave energy for the restockers
        jobs.check_dropped(c, true, 50) ||
        jobs.check_mining(c) ||
        jobs.check_construction(c) ||
        //check_spawn(c) ||
        //check_towers(c) ||
        jobs.upgrade_controller(c) ||
        jobs.check_gathering_place(c) ||
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
