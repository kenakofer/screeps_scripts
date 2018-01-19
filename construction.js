var f = require('f')

module.exports = {

/* This list gives the order in which structures are checked for building in
 * rooms For extensions, each number signifies a clump of 5 (which may or may
 * not be complete depending on the flags or walls around it. the clumps of
 * extensions also include surrounding roads.
 */
construction_order: [
    'tower1', 
    'spawn1',
    'extension01', 
    'extension02', 
    'link1','link2',
    'tower2', 
    'storage', 
    'extension03','extension04','extension05',
    'link3','link4','link5','link6',
    'rampart','constructedWall',
    'extension06','extension07','extension08','extension09','extension10','extension11','extension12','extension13','extension14',
    'spawn2','spawn3',
    'terminal', 'extractor',
    'tower3', 'tower4',
    'lab01','lab02','lab03','lab04','lab05','lab06','lab07','lab08','lab09','lab10',
    'observer',
    'tower5','tower6',
    'nuker',
    'container1', 'container2', 'container3','container4','container5',
],

check_construction_sites: function(roomName){
    var room = Game.rooms[roomName]
    // If it isn't my room, don't do it!
    if ((!room) || (!room.controller) || (!room.controller.my)){
        //console.log('the room isn\'t mine')
        return false
    }
    if (room.controller.level < 3){
        // The new strategy is to bootstrap a room all the way to level 3, in
        // order to build a tower first
        return false
    }
    // If there's a current construction project, we can wait.
    if (room.find(FIND_MY_CONSTRUCTION_SITES)[0]){
        //console.log('There is construction already')
        return false
    }
    // If the room is at level 1, don't worry about any construction other than spawn
    if (room.controller.level === 1){
        return this.check_construction_type(room, 'spawn')
    }

    // Run through the construction order and see if anything is needed
    for (var i in this.construction_order){
        //console.log(this.construction_order[i])
        var r = this.check_construction_type(room, this.construction_order[i])
        // If we created a construction site with that check, no need to continue
        if (r)
            return r
    }
    return false
},

check_construction_type: function(room, entry){
    // Get the type of structure we're looking at
    var index = entry.search(/\d/)
    var structure_type;
    var structure_index;
    if (index < 0) {
        structure_index = 1 
        structure_type = entry 
    } else {
        structure_type = entry.substring(0,index)
        structure_index = entry.substring(index)
    }

    var flag = room.find(FIND_FLAGS, {filter: (f) => f.name.includes(entry)})[0]
    //There is no flag for this entry, so skip it
    if (!flag)
        return false

    if (structure_type == 'extension'){
        var r = this.create_extension_sites(flag)
        if (r)
            return r
        return this.create_extension_roads(flag)
    } else if (structure_type == 'storage'){
        var r = this.create_storage_site(flag)
        if (r)
            return r
    } else {
        var r = room.createConstructionSite(flag.pos, structure_type)
        if (r === OK) {
            console.log('constructing a '+entry+' in '+room.name)
            return true
        }

    }
},

create_extension_sites: function(flag){
    // In the special case of an extension, try to build in the four
    // surrounding spaces as well.  If there is a flag or another
    // structure there, don't build there
    var coords = [[0,0],[0,1],[1,0],[-1,0],[0,-1]]
    var room = Game.rooms[flag.pos.roomName]
    //console.log(flag)
    coords = coords.map(c => new RoomPosition(c[0]+flag.pos.x, c[1]+flag.pos.y, room.name))
    coords = coords.sort(function(c1,c2){return room.controller.pos.getRangeTo(c1) - room.controller.pos.getRangeTo(c2)});
    // Now we have the coordinates sorted in order of which is closest
    // to the controller, check each one in order
    for (i in coords){
        var c = coords[i]
        // If there is a blocking flag at that coord, skip it
        var block_flags = c.lookFor(LOOK_FLAGS)
        block_flags = block_flags.filter(f => ! f.name.includes('extension'))
        if (block_flags[0])
            continue
        // Otherwise, try to place an extension construction site there
        var r = room.createConstructionSite(c, STRUCTURE_EXTENSION)
        if (r === OK){
            console.log('constructing an extension in '+room.name)
            return true
        } else if (r === ERR_RCL_NOT_ENOUGH) {
            // We can't make another extension yet.
            return false
        } else {
            // There is probably already an extension or a wall or
            // something here
            console.log(r)
            continue
        }
    }
},

create_extension_roads: function(flag){
    // Try to build roads in the 8 diamond spaces around the extension flag
    var room = Game.rooms[flag.pos.roomName]
    var coords = [[2,0],[1,1],[0,2],[-1,1],[-2,0],[-1,-1],[0,-2],[1,-1]]
    coords = coords.map(c => new RoomPosition(c[0]+flag.pos.x, c[1]+flag.pos.y, room.name))
    var r = false
    for (i in coords){
        var c = coords[i]
        if (room.createConstructionSite(c, 'road') === OK){
            r = true
        }
    }
    return r
},

create_storage_site: function(flag){
    // If RCL is high enough for a storage, and there isn't one there, destroy
    // any containers on the site and construct a storage
    // If RCL isn't high enough, try to build a container on the spot
    var room = Game.rooms[flag.pos.roomName]
    var rcl = room.controller.level
    if (CONTROLLER_STRUCTURES['storage'][rcl] >= 1){
        // If there's a storage there already, skip
        var storage = flag.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_STORAGE)[0]
        if (storage)
            return false
        // If there's a container there, we need to destroy it.
        var container = flag.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER)[0]
        if (container){
            container.destroy()
            console.log('destroying a container to make way for storage in '+room.name)
            return true
        }
        // Otherwise try to construct a storage on the site
        var r = room.createConstructionSite(flag.pos, STRUCTURE_STORAGE)
        if (r === OK) {
            console.log('constructing a storage in '+room.name)
            return true
        }
    } else {
        // RCL is not high enough for a storage, so build a container on the
        // spot instead
        var r = room.createConstructionSite(flag.pos, STRUCTURE_CONTAINER)
        if (r === OK) {
            console.log('constructing a container (in storage spot) in '+room.name)
            return true
        }
    }
},
}

