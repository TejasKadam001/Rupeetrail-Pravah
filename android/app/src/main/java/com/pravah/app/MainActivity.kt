package com.pravah.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.pravah.app.ui.theme.PravahTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val repository = DataRepository(this)
        val chatbotEngine = ChatbotEngine(repository)

        setContent {
            PravahTheme {
                val navController = rememberNavController()
                var selectedWard by remember { mutableStateOf("ALL") }
                var currentLanguage by remember { mutableStateOf("en") }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        Header(
                            lang = currentLanguage,
                            onLangChange = { currentLanguage = if (currentLanguage == "en") "mr" else "en" },
                            selectedWard = selectedWard,
                            onWardChange = { selectedWard = it },
                            wards = repository.wards
                        )
                    },
                    bottomBar = {
                        BottomNav(navController, currentLanguage)
                    },
                    floatingActionButton = {
                        ChatbotFAB(currentLanguage, chatbotEngine)
                    }
                ) { innerPadding ->
                    AppNavigation(
                        navController = navController,
                        modifier = Modifier.padding(innerPadding),
                        repository = repository,
                        selectedWard = selectedWard,
                        lang = currentLanguage
                    )
                }
            }
        }
    }
}
