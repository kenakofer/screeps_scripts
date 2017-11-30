//Gives some standard settings for different controller levels and situations

module.exports = {
    
    controller1_noassist: function(roomName){
        Memory.room_strategy[roomName}={
            'spawn_priority': ['harvester'],
            'harvester': {'desired_number':2, 'parts':[MOVE,WORK,CARRY] }
        }
    }
}
