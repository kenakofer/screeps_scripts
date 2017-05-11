default_parts = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, ATTACK]

module.exports = {
	

	'W7N3': {
        'role_upgrader': {
                desired_number: 1,
                parts: default_parts,
        },
        'role_builder': {
                desired_number: 1,
                parts: default_parts,
        },
        'role_guard': {
                desired_number: 1,
                parts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],
        },
        'role_restocker': {
                desired_number: 1,
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
    'W7N4': {
        'role_upgrader': {
            desired_number: 1,
            parts: default_parts,
            //spawn_room: 'W7N3'
        },
        'role_builder': {
            desired_number: 1,
            parts: default_parts,
            //spawn_room: 'W7N3'
        },
        'role_guard': {
            desired_number: 1,
            parts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],
        },
        'role_restocker': {
            desired_number: 1,
            parts: [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, CARRY, CARRY],
        },
        'role_solominer': {
            //desired number is determined by flags in the room
            parts: [MOVE, WORK, WORK, WORK, WORK, WORK, CARRY],
            //spawn_room: 'W7N3',
        },
        'constructedWall': {
            desired_hits: 50000
        },
        'rampart': {
            desired_hits: 49000 
        },
    },
    'W8N3': {
        'role_upgrader': {
            desired_number: 1,
            parts: [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY],
            //spawn_room: 'W7N3'
        },
        'role_builder': {
            desired_number: 1,
            parts: default_parts,
            //spawn_room: 'W7N3'
        },
        'role_guard': {
            desired_number: 1,
            parts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],
            //spawn_room: 'W7N3'
        },
        'role_restocker': {
            desired_number: 1,
            parts: [MOVE, CARRY, MOVE, CARRY, CARRY, CARRY],
        },
        'role_solominer': {
            //desired number is determined by flags in the room
            parts: [MOVE, WORK, WORK, WORK, WORK, WORK, CARRY],
            //spawn_room: 'W7N3',
        },
        'constructedWall': {
            desired_hits: 40000
        },
        'rampart': {
            desired_hits: 39000 
        },
    },
    
    'W8N6': {
        'role_upgrader': {
            desired_number: 1,
            //parts: default_parts,
            parts: [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], //Had 6 WORKS before
            //spawn_room: 'W7N4',
        },
        'role_builder': {
            desired_number: 1,
            //parts: default_parts,
            parts: [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK],
            //spawn_room: 'W7N4',
        },
        'role_guard': {
            desired_number: 1,
            parts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE],
            //spawn_room: 'W7N4',
        },
        'role_restocker': {
            desired_number: 1,
            parts: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
        },
        'role_solominer': {
            //desired number is determined by flags in the room
            parts: [MOVE, WORK, WORK, WORK, WORK, WORK, CARRY],
            //spawn_room: 'W7N3',
        },
        'constructedWall': {
            desired_hits: 40000
        },
        'rampart': {
            desired_hits: 39000
        },
    },

    //TODO: it really can't be good style to put this here...
    //And on the official server :)
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
            parts: [MOVE, CARRY, CARRY, WORK],
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
};