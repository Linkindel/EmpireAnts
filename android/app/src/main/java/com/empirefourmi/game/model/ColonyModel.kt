package com.empirefourmi.game.model

data class AntCounts(
    val workers: Int = 6,
    val scouts: Int = 2,
    val warriors: Int = 2,
    val tanks: Int = 1
) {
    val total: Int get() = workers + scouts + warriors + tanks
}

data class RoomLevels(
    val queenChamber: Int = 1,
    val granary: Int = 1,
    val dormitories: Int = 1,
    val barricade: Int = 0
)

data class SquadState(
    val tanks: Int = 0,
    val warriors: Int = 0,
    val scouts: Int = 0,
    val doctrine: String = "balanced"
) {
    val total: Int get() = tanks + warriors + scouts
}

data class ColonyState(
    val food: Float = 120f,
    val maxFood: Float = 180f,
    val pheromones: Float = 20f,
    val queenHealth: Float = 100f,
    val day: Int = 1,
    val ants: AntCounts = AntCounts(),
    val rooms: RoomLevels = RoomLevels(),
    val squad: SquadState = SquadState(),
    val logs: List<String> = listOf("La colonie a été fondée par la Reine.")
) {
    val maxPop: Int get() = 15 + (rooms.dormitories * 10)
    val foodNetPerSec: Float
        get() = (ants.workers * 0.55f) - (ants.total * 0.08f + ants.tanks * 0.12f + ants.warriors * 0.06f)
}
