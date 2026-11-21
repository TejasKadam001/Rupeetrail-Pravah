package com.pravah.app

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.InputStreamReader

class DataRepository(private val context: Context) {
    private val gson = Gson()

    val wards: List<WardRecord> by lazy {
        loadJsonFromAssets("wards.json", object : TypeToken<List<WardRecord>>() {}.type)
    }

    val roads: List<RoadRecord> by lazy {
        loadJsonFromAssets("roads.json", object : TypeToken<List<RoadRecord>>() {}.type)
    }

    val contractors: List<ContractorRecord> by lazy {
        loadJsonFromAssets("contractors.json", object : TypeToken<List<ContractorRecord>>() {}.type)
    }

    private fun <T> loadJsonFromAssets(fileName: String, type: java.lang.reflect.Type): T {
        val inputStream = context.assets.open(fileName)
        val reader = InputStreamReader(inputStream)
        return gson.fromJson(reader, type)
    }

    fun getRoadsByWard(wardCode: String): List<RoadRecord> {
        if (wardCode == "ALL") return roads
        return roads.filter { it.ward_code == wardCode }
    }

    fun getContractor(id: String): ContractorRecord? {
        return contractors.find { it.id == id }
    }
}
