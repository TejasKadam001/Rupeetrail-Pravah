package com.pravah.app

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.pravah.app.ui.theme.*

@Composable
fun Header(
    lang: String,
    onLangChange: () -> Unit,
    selectedWard: String,
    onWardChange: (String) -> Unit,
    wards: List<WardRecord>
) {
    Surface(
        color = Color.White.copy(alpha = 0.9f),
        modifier = Modifier.fillMaxWidth(),
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White)
                        .padding(2.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.splash), // Using splash as placeholder for logo
                        contentDescription = "BMC Seal",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = if (lang == "en") "BMC PRAVAH" else "बीएमसी प्रवाह",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = Stone900
                    )
                    Text(
                        text = if (lang == "en") "Road Audit & Copilot" else "रस्ता लेखापरीक्षण व मदतनीस",
                        fontSize = 10.sp,
                        color = Stone500,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                // Language Toggle
                Button(
                    onClick = onLangChange,
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                    modifier = Modifier.height(32.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Stone100),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Language,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = Emerald700
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (lang == "en") "मराठी" else "English",
                        fontSize = 11.sp,
                        color = Stone800,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Spacer(modifier = Modifier.width(8.dp))

                // Ward Selector (Simple Dropdown)
                var expanded by remember { mutableStateOf(false) }
                Box {
                    Button(
                        onClick = { expanded = true },
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        modifier = Modifier.height(32.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Stone100),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Place,
                            contentDescription = null,
                            modifier = Modifier.size(12.dp),
                            tint = Stone500
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = selectedWard,
                            fontSize = 11.sp,
                            color = Stone900,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        DropdownMenuItem(
                            text = { Text("ALL") },
                            onClick = { onWardChange("ALL"); expanded = false }
                        )
                        wards.forEach { ward ->
                            DropdownMenuItem(
                                text = { Text(ward.code) },
                                onClick = { onWardChange(ward.code); expanded = false }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BottomNav(navController: NavController, lang: String) {
    val items = listOf(
        Screen.Lookup,
        Screen.Snap,
        Screen.Roads,
        Screen.Community
    )
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 8.dp
    ) {
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route

        items.forEach { screen ->
            NavigationBarItem(
                icon = { Icon(screen.icon, contentDescription = null) },
                label = { 
                    Text(
                        text = if (lang == "en") screen.enTitle else screen.mrTitle,
                        fontSize = 10.sp
                    ) 
                },
                selected = currentRoute == screen.route,
                onClick = {
                    navController.navigate(screen.route) {
                        popUpTo(navController.graph.startDestinationId) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Emerald800,
                    selectedTextColor = Emerald800,
                    unselectedIconColor = Stone400,
                    unselectedTextColor = Stone400,
                    indicatorColor = Emerald50
                )
            )
        }
    }
}

sealed class Screen(val route: String, val enTitle: String, val mrTitle: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Lookup : Screen("lookup", "Contractor", "कंत्राटदार", Icons.Default.Search)
    object Snap : Screen("snap", "Report", "तक्रार", Icons.Default.CameraAlt)
    object Roads : Screen("roads", "Inventory", "रस्ते यादी", Icons.Default.List)
    object Community : Screen("community", "Feed", "नागरिक मंच", Icons.Default.People)
}

@Composable
fun ChatbotFAB(lang: String, engine: ChatbotEngine) {
    var showModal by remember { mutableStateOf(false) }

    FloatingActionButton(
        onClick = { showModal = true },
        containerColor = Emerald800,
        contentColor = Color.White,
        shape = CircleShape,
        modifier = Modifier.padding(bottom = 16.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Emerald300, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                if (lang == "en") "Road Copilot" else "रस्ता मदतनीस",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }

    if (showModal) {
        ChatbotModal(lang, engine, onDismiss = { showModal = false })
    }
}

@Composable
fun ChatbotModal(lang: String, engine: ChatbotEngine, onDismiss: () -> Unit) {
    var messages by remember { mutableStateOf(listOf(
        ChatMessage(
            "welcome",
            "assistant",
            if (lang == "en") 
                "Namaste! I am the **BMC PRAVAH Road Copilot**. Ask me about any road and I will identify the contractor and warranty status."
            else
                "नमस्ते! मी **बीएमसी प्रवाह रस्ता मदतनीस** आहे. कोणत्याही रस्त्याबद्दल विचारा आणि मी कंत्राटदार आणि वॉरंटी तपशील सांगेन.",
            timestamp = "Just now"
        )
    )) }
    var inputText by remember { mutableStateOf("") }

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(24.dp),
            color = Color.White
        ) {
            Column {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Stone900)
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .padding(2.dp)
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.splash),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                if (lang == "en") "BMC PRAVAH Copilot" else "बीएमसी प्रवाह सहाय्यक",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                if (lang == "en") "Official Road Data" else "अधिकृत रस्ता माहिती",
                                color = Stone400,
                                fontSize = 10.sp
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = Stone400)
                    }
                }

                // Messages
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .background(Stone50)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(messages) { msg ->
                        ChatBubble(msg)
                    }
                }

                // Input
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Ask about a road...", fontSize = 12.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(24.dp)),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Stone100,
                            unfocusedContainerColor = Stone100,
                            disabledContainerColor = Stone100,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                        ),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                val userMsg = ChatMessage("usr-${System.currentTimeMillis()}", "user", inputText, timestamp = "now")
                                messages = messages + userMsg
                                val reply = engine.generateLocalRoadAnswer(inputText)
                                val matched = engine.findMatchingRoad(inputText)
                                val aiMsg = ChatMessage("ai-${System.currentTimeMillis()}", "assistant", reply, matchedRoad = matched, timestamp = "now")
                                messages = messages + aiMsg
                                inputText = ""
                            }
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .background(Emerald800, CircleShape)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(msg: ChatMessage) {
    val isUser = msg.role == "user"
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        Surface(
            color = if (isUser) Emerald800 else Color.White,
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isUser) 16.dp else 2.dp,
                bottomEnd = if (isUser) 2.dp else 16.dp
            ),
            shadowElevation = 1.dp,
            modifier = Modifier.fillMaxWidth(0.85f)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = msg.content,
                    color = if (isUser) Color.White else Stone900,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
                
                msg.matchedRoad?.let { road ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        color = Emerald50.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(road.name, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            Text("Contractor: ${road.contractor_name}", fontSize = 10.sp)
                            if (road.under_dlp) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Shield, contentDescription = null, modifier = Modifier.size(10.dp), tint = Emerald700)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Warranty Active", fontSize = 9.sp, color = Emerald700, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
        Text(msg.timestamp, fontSize = 9.sp, color = Stone400, modifier = Modifier.padding(top = 4.dp))
    }
}
