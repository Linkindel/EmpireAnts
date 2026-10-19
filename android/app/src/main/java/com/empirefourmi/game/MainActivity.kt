package com.empirefourmi.game

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.empirefourmi.game.model.ColonyState
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EmpireFourmiApp()
        }
    }
}

@Composable
fun EmpireFourmiApp() {
    var state by remember { mutableStateOf(ColonyState()) }
    var selectedTab by remember { mutableIntStateOf(0) }

    // Boucle de simulation temps réel
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            val netFood = state.foodNetPerSec
            val newFood = (state.food + netFood).coerceIn(0f, state.maxFood)
            val newPhero = state.pheromones + 0.2f + (state.ants.scouts * 0.35f)
            
            state = state.copy(
                food = newFood,
                pheromones = newPhero
            )
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF12100E)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            ColonyHeader(state)

            // Vue graphique de la fourmilière
            ColonyCanvasView(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            )

            // Onglets de navigation
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color(0xFF1D1915),
                contentColor = Color(0xFFF6AD55)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Armée") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Salles") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Expéditions") }
                )
            }

            // Contenu selon l'onglet
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                when (selectedTab) {
                    0 -> ArmyTab(state) { updatedState -> state = updatedState }
                    1 -> RoomsTab(state) { updatedState -> state = updatedState }
                    2 -> ExpeditionsTab(state) { updatedState -> state = updatedState }
                }
            }
        }
    }
}

@Composable
fun ColonyHeader(state: ColonyState) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1512))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("EMPIRE FOURMI", color = Color(0xFFF6AD55), fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Jour ${state.day} • Pop: ${state.ants.total}/${state.maxPop}", color = Color(0xFFA69888), fontSize = 12.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ResourceBadge("🍃", "${state.food.toInt()} / ${state.maxFood.toInt()}", Color(0xFF68D391))
            ResourceBadge("🧪", state.pheromones.toInt().toString(), Color(0xFFB794F4))
        }
    }
}

@Composable
fun ResourceBadge(icon: String, value: String, color: Color) {
    Surface(
        color = Color(0xFF2A221C),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(icon, fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(value, color = color, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

@Composable
fun ColonyCanvasView(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.background(Color(0xFF291B10))) {
        val width = size.width
        val height = size.height

        // Surface (herbe)
        drawRect(Color(0xFF2F855A), Offset.Zero, size = androidx.compose.ui.geometry.Size(width, 30f))

        // Galeries souterraines
        drawCircle(Color(0xFF442E1B), radius = 60f, center = Offset(width * 0.5f, height * 0.55f))
        drawCircle(Color(0xFF3F2818), radius = 45f, center = Offset(width * 0.25f, height * 0.75f))
        drawCircle(Color(0xFF3F2818), radius = 45f, center = Offset(width * 0.75f, height * 0.75f))

        // Reine dans la chambre centrale
        drawCircle(Color(0xFFD69E2E), radius = 18f, center = Offset(width * 0.5f, height * 0.55f))
    }
}

@Composable
fun ArmyTab(state: ColonyState, onUpdate: (ColonyState) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        CasteCard(
            title = "Fourmi Ouvrière",
            desc = "Récolte et logistique (+0.55 🍃/s)",
            count = state.ants.workers,
            cost = 10,
            canAfford = state.food >= 10 && state.ants.total < state.maxPop
        ) {
            onUpdate(
                state.copy(
                    food = state.food - 10,
                    ants = state.ants.copy(workers = state.ants.workers + 1)
                )
            )
        }

        CasteCard(
            title = "Fourmi Éclaireuse",
            desc = "Détection des raids et découverte de zones",
            count = state.ants.scouts,
            cost = 15,
            canAfford = state.food >= 15 && state.ants.total < state.maxPop
        ) {
            onUpdate(
                state.copy(
                    food = state.food - 15,
                    ants = state.ants.copy(scouts = state.ants.scouts + 1)
                )
            )
        }

        CasteCard(
            title = "Fourmi Guerrière",
            desc = "Puissance d'attaque élevée (Mandibules & Acide)",
            count = state.ants.warriors,
            cost = 25,
            canAfford = state.food >= 25 && state.ants.total < state.maxPop
        ) {
            onUpdate(
                state.copy(
                    food = state.food - 25,
                    ants = state.ants.copy(warriors = state.ants.warriors + 1)
                )
            )
        }

        CasteCard(
            title = "Fourmi Tank (Major)",
            desc = "Tête blindée. Encaisse les chocs et protège l'armée",
            count = state.ants.tanks,
            cost = 40,
            canAfford = state.food >= 40 && state.ants.total < state.maxPop
        ) {
            onUpdate(
                state.copy(
                    food = state.food - 40,
                    ants = state.ants.copy(tanks = state.ants.tanks + 1)
                )
            )
        }
    }
}

@Composable
fun CasteCard(
    title: String,
    desc: String,
    count: Int,
    cost: Int,
    canAfford: Boolean,
    onIncubate: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1F1A15)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("$count", color = Color(0xFFF6AD55), fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            Text(desc, color = Color(0xFFA69888), fontSize = 12.sp, modifier = Modifier.padding(vertical = 4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("$cost 🍃", color = Color(0xFF68D391), fontWeight = FontWeight.SemiBold)
                Button(
                    onClick = onIncubate,
                    enabled = canAfford,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDD6B20))
                ) {
                    Text("Incuber")
                }
            }
        }
    }
}

@Composable
fun RoomsTab(state: ColonyState, onUpdate: (ColonyState) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Aménagement des Galeries", color = Color.White, fontWeight = FontWeight.Bold)
        Text("Dortoirs : Niveau ${state.rooms.dormitories} (Plafond Pop : ${state.maxPop})", color = Color(0xFFA69888))
        Text("Grenier : Niveau ${state.rooms.granary} (Capacité Stock : ${state.maxFood.toInt()} 🍃)", color = Color(0xFFA69888))
    }
}

@Composable
fun ExpeditionsTab(state: ColonyState, onUpdate: (ColonyState) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Expéditions de Surface", color = Color.White, fontWeight = FontWeight.Bold)
        Text("Composez vos escouades pour chasser et piller les ressources extérieures.", color = Color(0xFFA69888))
    }
}
