package com.pravah.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.pravah.app.ui.theme.*

@Composable
fun AppNavigation(
    navController: androidx.navigation.NavHostController,
    modifier: Modifier = Modifier,
    repository: DataRepository,
    selectedWard: String,
    lang: String
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Lookup.route,
        modifier = modifier
    ) {
        composable(Screen.Lookup.route) {
            LookupScreen(repository, selectedWard, lang, navController)
        }
        composable(Screen.Snap.route) {
            SnapScreen(lang)
        }
        composable(Screen.Roads.route) {
            RoadsScreen(repository, selectedWard, lang, navController)
        }
        composable(Screen.Community.route) {
            CommunityScreen(lang)
        }
    }
}

@Composable
fun LookupScreen(
    repository: DataRepository,
    selectedWard: String,
    lang: String,
    navController: NavController
) {
    val roads = remember(selectedWard) { repository.getRoadsByWard(selectedWard) }
    var selectedRoad by remember { mutableStateOf(roads.firstOrNull()) }
    var searchQuery by remember { mutableStateOf("") }
    
    val filteredRoads = remember(roads, searchQuery) {
        if (searchQuery.isEmpty()) roads
        else roads.filter { it.name.contains(searchQuery, ignoreCase = true) || it.contractor_name.contains(searchQuery, ignoreCase = true) }
    }

    LaunchedEffect(selectedWard) {
        selectedRoad = roads.firstOrNull()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Column {
                Text(
                    text = if (lang == "en") "Who Built This Road?" else "हा रस्ता कोणी बांधला?",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = Stone900
                )
                Text(
                    text = if (lang == "en") "Check the registered contractor and warranty details." else "दुरुस्तीपूर्वी कंत्राटदार आणि हमी तपासा.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Stone500
                )
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        if (lang == "en") "Select Road" else "रस्ता निवडा",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Stone700
                    )
                    
                    var expanded by remember { mutableStateOf(false) }
                    Box {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { expanded = true },
                            color = Stone50,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Stone200)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    selectedRoad?.name ?: "Select a road",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                            }
                        }
                        DropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            modifier = Modifier.fillMaxWidth(0.9f)
                        ) {
                            filteredRoads.take(10).forEach { road ->
                                DropdownMenuItem(
                                    text = { Text("${road.name} (Seg ${road.segment_no})") },
                                    onClick = { selectedRoad = road; expanded = false }
                                )
                            }
                        }
                    }

                    TextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text(if (lang == "en") "Search road..." else "रस्ता शोधा...", fontSize = 12.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Stone50,
                            unfocusedContainerColor = Stone50,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }
        }

        selectedRoad?.let { road ->
            item {
                ContractorReceiptCard(road, lang)
            }
            
            item {
                WarrantyClockCard(lang)
            }
        }
    }
}

@Composable
fun ContractorReceiptCard(road: RoadRecord, lang: String) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column {
                Text(
                    if (lang == "en") "ASSIGNED BMC CONTRACTOR" else "नियुक्त महापालिका कंत्राटदार",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Stone400
                )
                Text(
                    road.contractor_name,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Emerald900
                )
                Text(
                    "${road.name} • Ward ${road.ward_code}",
                    fontSize = 12.sp,
                    color = Stone500
                )
            }

            if (road.under_dlp) {
                Surface(
                    color = Emerald50,
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Emerald200)
                ) {
                    Row(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = Emerald700, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (lang == "en") "₹0 Fix Under Warranty (DLP)" else "₹० मोफत दुरुस्ती (हमी अंतर्गत)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Emerald800
                        )
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatItem(label = if (lang == "en") "Surface" else "पृष्ठभाग", value = road.surface, modifier = Modifier.weight(1f))
                StatItem(label = if (lang == "en") "Length" else "लांबी", value = "${road.length_m}m", modifier = Modifier.weight(1f))
                StatItem(label = if (lang == "en") "Audited Spend" else "मंजूर खर्च", value = "₹${String.format("%,.0f", road.total_spent_inr)}", modifier = Modifier.weight(1.2f))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { /* Report */ },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Stone100, contentColor = Stone800),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text(if (lang == "en") "Report Pothole" else "तक्रार", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { /* Enforce */ },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald800, contentColor = Color.White),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text(if (lang == "en") "Enforce Warranty" else "हमी लागू करा", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = Stone50,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Stone200.copy(alpha = 0.6f))
    ) {
        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 9.sp, color = Stone400)
            Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Stone900, maxLines = 1)
        }
    }
}

@Composable
fun WarrantyClockCard(lang: String) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Schedule, contentDescription = null, tint = Emerald700, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (lang == "en") "DLP Warranty Clock" else "हमी कालावधी घड्याळ", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Text("410 Days Left", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Emerald800)
            }
            
            LinearProgressIndicator(
                progress = 0.62f,
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = Emerald600,
                trackColor = Stone100
            )
            
            Text(
                if (lang == "en") "Under Clause 20, the contractor must rectify any potholes for ₹0." else "कलम २० नुसार कंत्राटदाराने मोफत दुरुस्ती करणे बंधनकारक आहे.",
                fontSize = 11.sp,
                color = Stone500
            )
        }
    }
}

@Composable
fun SnapScreen(lang: String) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp).background(Stone50), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(if (lang == "en") "Snap & Report" else "तक्रार नोंदवा", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Surface(
                    modifier = Modifier.fillMaxWidth().height(160.dp).clickable { },
                    color = Stone50,
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(2.dp, Stone200)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(40.dp), tint = Stone400)
                        Text(if (lang == "en") "Tap to snap photo" else "फोटो काढण्यासाठी दाबा", fontSize = 12.sp, color = Stone500)
                    }
                }
                
                TextField(
                    value = "",
                    onValueChange = {},
                    placeholder = { Text(if (lang == "en") "Road Name..." else "रस्त्याचे नाव...", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(focusedContainerColor = Stone50, unfocusedContainerColor = Stone50)
                )
                
                Button(
                    onClick = { },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald800),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text(if (lang == "en") "Submit Grievance" else "तक्रार पाठवा")
                }
            }
        }
    }
}

@Composable
fun RoadsScreen(repository: DataRepository, selectedWard: String, lang: String, navController: NavController) {
    val roads = remember(selectedWard) { repository.getRoadsByWard(selectedWard) }
    
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(if (lang == "en") "Ward Road Inventory" else "रस्ते यादी", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        }
        
        items(roads) { road ->
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { 
                    // Navigate to Lookup with this road (simplified)
                    navController.navigate(Screen.Lookup.route)
                },
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Stone200)
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(road.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Contractor: ${road.contractor_name}", fontSize = 11.sp, color = Stone500)
                    }
                    if (road.under_dlp) {
                        Surface(color = Emerald50, shape = CircleShape) {
                            Text("₹0", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Emerald800)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CommunityScreen(lang: String) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(if (lang == "en") "Community Feed" else "नागरिक मंच", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        
        repeat(3) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(color = Stone100, shape = CircleShape) {
                            Text("Ward K/W", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Reported Today", fontSize = 10.sp, color = Stone400)
                    }
                    Text("Potholes near Andheri Station junction", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("The surface has peeled off completely.", fontSize = 12.sp, color = Stone700, style = androidx.compose.ui.text.TextStyle(fontStyle = androidx.compose.ui.text.font.FontStyle.Italic))
                    
                    Button(
                        onClick = { },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald50, contentColor = Emerald800),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Icon(Icons.Default.ThumbUp, contentDescription = null, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Me Too (12)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
