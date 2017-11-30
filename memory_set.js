//Gives some standard settings for different controller levels and situations

module.exports = {
    
    //This is a good method to call for the first ever room, to get everything up and running
    controller1_noassist: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_harvester', 'role_guard', 'role_upgrader', 'role_builder' ],
            'role_harvester': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_guard': {'desired_number':1, 'parts':[MOVE,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_builder': {'desired_number':3, 'parts':[MOVE,WORK,CARRY] },
        }
    },

    //Once the controller is up to 2 and you have some extensions and containers 
    controller2_noassist: function(roomName){
        Memory.room_strategy[roomName]={
            //TODO
        }
    }
}
